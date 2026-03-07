//-------IMPORTS-------
import { filterUsersBySearchTerm } from "../../services/user-service/user.service";
import { Socket } from "socket.io-client";
import {
  createAddFriendButton,
  createAddFriendModal,
  createFriendItem,
  createMessageBubble,
} from "./chatTemplates";
import { loadHeader } from "./../../services/page.service";
import { connectToWebSocketsServer } from "../../services/web-sockets-service/web-sockets.service";
import { ChatMessage, WssMessage } from "./chat.types";
import {
  checkIfUserIsLoggedIn,
  getLoggedInUser,
} from "./../../services/auth-service/auth.service";
import {
  addFriendByEmail,
  getFriendsOfCurrentUser,
  removeFriendFromUser,
} from "./../../services/friends-service/friends.service";
import {
  fetchEmojis,
  initEmojiSelector,
  emojiSearch,
  closeEmojiOnOutsideClick,
} from "./emoji";
import {
  getMessagesBetweenUsers,
  saveMessage,
} from "../../services/messages-service/messages.service";
import { User } from "./../../services/user-service/user.service.types";
import {
  ChatAttachmentsController,
  initChatAttachments,
} from "./chat-attachments";
import { createDebouncedFunction } from "../../common/utils";

// --- DOM ELEMENTS ---
const messagesContainer = document.querySelector(".chat-messages")!;
const chatUserName = document.getElementById("chatUserName")!;
const chatUserEmail = document.getElementById("chatUserEmail")!;
const friendList = document.querySelector(".friend-list")!;
const openCloseFriendList = document.querySelector(".open-close-friendList");
const sendBtn = document.getElementById("sendMessageBtn")!;
const messageInput = document.getElementById(
  "messageInput",
)! as HTMLInputElement;
const searchInput = document.querySelector<HTMLInputElement>(
  ".friend-search-input",
);
const emojiSearchInput = document.querySelector<HTMLInputElement>(
  ".search-emoji input",
);
const emojiSelectorIcon = document.getElementById("emojiSelectorIcon");
const emojiSelector = document.getElementById("emojiSelector");
const emojiList = document.getElementById("emojiList");
const textarea = document.querySelector(
  ".message-input",
) as HTMLTextAreaElement | null;
const imageInput = document.getElementById("imageInput") as HTMLInputElement;
const documentInput = document.getElementById(
  "documentInput",
) as HTMLInputElement;
const attachmentMenuButton = document.getElementById("attachmentMenuButton");
const attachmentMenu = document.getElementById("attachmentMenu");
const attachImageOption = document.getElementById("attachImageOption");
const attachDocumentOption = document.getElementById("attachDocumentOption");
const audioRecordBtn = document.getElementById("audioRecordBtn");
const MOBILE_BREAKPOINT = 768;
const PERSIST_MEDIA_CONTENT_IN_DB = false;

const isMobileViewport = () => window.innerWidth <= MOBILE_BREAKPOINT;

function syncFriendListToggleButtonState() {
  if (!openCloseFriendList) return;

  const isOpen = document.body.classList.contains("friend-list-open");
  openCloseFriendList.setAttribute("aria-expanded", String(isOpen));
  openCloseFriendList.setAttribute(
    "aria-label",
    isOpen ? "Hide friends list" : "Show friends list",
  );
}

function handleViewportResize() {
  if (!isMobileViewport()) {
    document.body.classList.remove("friend-list-open");
  }

  syncFriendListToggleButtonState();
}

if (textarea) {
  textarea.addEventListener("input", function (this: HTMLTextAreaElement) {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
  });
}
let wsSocket: Socket | null = null;
let conversations: { [friendId: string]: ChatMessage[] } = {};
let selectedFriendId: string | null = null;
let userStatuses: { [userId: string]: { isOnline: boolean; lastSeen?: Date } } =
  {};
let typingTimeouts: { [userId: string]: NodeJS.Timeout } = {};
let isTyping: boolean = false;
let attachmentsController: ChatAttachmentsController | null = null;

let friends: User[] = [];

initializePage();

async function initializePage() {
  await checkIfUserIsLoggedIn();

  loadHeader();

  const user = getLoggedInUser();
  if (user) {
    chatUserName.textContent = user.displayName || user.email || "Anonim";
    chatUserEmail.textContent = user.email || "";
  }

  connectToWsServer();
  friends = (await getFriendsOfCurrentUser()) as User[];
  renderFriendsList();
  renderMessages(); // Show default message initially
  syncFriendListToggleButtonState();
  window.addEventListener("resize", handleViewportResize);

  sendBtn.addEventListener("click", onSendMessage);
  searchInput!.addEventListener(
    "input",
    createDebouncedFunction(renderFilteredFriendsList, 300),
  );
  // Add typing indicator
  messageInput.addEventListener("input", handleTyping);

  attachmentsController = initChatAttachments({
    attachmentMenuButton,
    attachmentMenu,
    attachImageOption,
    attachDocumentOption,
    imageInput,
    documentInput,
    audioRecordBtn,
    getSelectedFriendId: () => selectedFriendId,
    onImageSelected: sendImageMessage,
    onDocumentSelected: sendDocumentMessage,
    onAudioReady: sendAudioMessage,
  });
}

// --- UI FUNCTIONS ---
async function selectFriend(
  friendId: string,
  friendName: string,
  friendEmail: string,
) {
  selectedFriendId = friendId;

  // Update chat header
  chatUserName.textContent = friendName;
  chatUserEmail.textContent = friendEmail;

  // Update visual selection
  updateFriendSelection(friendId);

  // Load messages for this conversation from database
  await loadConversationMessages(friendId);

  // Render messages
  renderMessages();
  closeAttachmentMenu();

  // On mobile, close the friend list automatically
  if (isMobileViewport()) {
    document.body.classList.remove("friend-list-open");
    syncFriendListToggleButtonState();
  }
}

function updateFriendSelection(selectedId: string) {
  // Remove previous selection
  document.querySelectorAll(".friend").forEach((friend) => {
    friend.classList.remove("selected");
  });

  // Add selection to current friend
  const selectedFriend = document.querySelector(
    `[data-friend-id="${selectedId}"]`,
  );
  if (selectedFriend) {
    selectedFriend.classList.add("selected");
  }
}

function renderFriendsList(filteredFriends?: User[]) {
  const renderedFriends = filteredFriends || friends;
  friendList.innerHTML = "";

  renderedFriends.forEach((friend: any) => {
    const friendItem = createFriendItem(
      friend.name,
      friend.email,
      friend.status || "offline",
      () => removeFriend(friend),
      friend.id,
      () => selectFriend(friend.id, friend.name, friend.email), // Add selection callback
    );

    // Add data attribute for easy selection
    friendItem.setAttribute("data-friend-id", friend.id);

    friendList.appendChild(friendItem);
  });

  friendList.appendChild(createAddFriendButton(openAddFriendModal));
}

function renderFilteredFriendsList() {
  const filteredFriends = filterUsersBySearchTerm(friends, searchInput!.value);
  renderFriendsList(filteredFriends);
}

async function removeFriend(friend: User) {
  const user = getLoggedInUser();
  if (!user) throw new Error("You are not logged in");

  await removeFriendFromUser(user.uid, friend.id);
  friends = friends.filter((f) => f.id !== friend.id);
  renderFilteredFriendsList();
}

async function loadConversationMessages(friendId: string) {
  const user = getLoggedInUser();
  if (!user) return;

  try {
    const messages = await getMessagesBetweenUsers(user.uid, friendId);
    conversations[friendId] = messages;
  } catch (error) {
    console.error("Error loading conversation messages:", error);
    conversations[friendId] = [];
  }
}

function renderMessages() {
  if (!messagesContainer) return;

  messagesContainer.innerHTML = "";

  if (!selectedFriendId) {
    // Show default message when no friend is selected
    const defaultMessage = document.createElement("div");
    defaultMessage.className = "default-message";
    defaultMessage.innerHTML = `
      <div class="default-message-content">
        <h3>Welcome to TeamChat!</h3>
        <p>Select a friend from the sidebar to start chatting</p>
      </div>
    `;
    messagesContainer.appendChild(defaultMessage);
    return;
  }

  const user = getLoggedInUser();
  const currentConversation = conversations[selectedFriendId] || [];

  currentConversation.forEach((msg: ChatMessage) => {
    const isMine = msg.from === (user?.uid || user?.email);

    const displayName = getMessageDisplayName(msg);
    const messageBubble = createMessageBubble(
      msg.message,
      msg.time,
      isMine ? "right" : "left",
      displayName,
      msg.imageUrl,
      msg.documentUrl,
      msg.documentName,
      msg.audioUrl,
    );
    messagesContainer.append(messageBubble);
  });
}

function addMessageToConversation(friendId: string, message: ChatMessage) {
  if (!conversations[friendId]) {
    conversations[friendId] = [];
  }

  conversations[friendId].push(message);
}

function appendMessageBubbleToUi(
  message: ChatMessage,
  direction: "left" | "right",
) {
  const displayName = getMessageDisplayName(message);
  const messageBubble = createMessageBubble(
    message.message,
    message.time,
    direction,
    displayName,
    message.imageUrl,
    message.documentUrl,
    message.documentName,
    message.audioUrl,
  );

  messagesContainer.append(messageBubble);
}

function closeAttachmentMenu() {
  attachmentsController?.closeAttachmentMenu();
}

function getMessageDisplayName(message: ChatMessage) {
  if (typeof message.name === "string" && message.name.trim()) {
    return message.name;
  }

  if (typeof message.email === "string" && message.email.trim()) {
    return message.email;
  }

  return message.from;
}

function requireSelectedFriend(alertMessage: string) {
  if (!selectedFriendId) {
    alert(alertMessage);
    return null;
  }

  return selectedFriendId;
}

function buildOutgoingMessage(
  friendId: string,
  payload: Omit<ChatMessage, "from" | "name" | "email" | "time" | "to"> & {
    message: string;
  },
): ChatMessage {
  const user = getLoggedInUser();

  return {
    from: user?.uid || "Anonim",
    name: user?.displayName || user?.email || "Anonim",
    email: user?.email || "",
    time: new Date().toISOString(),
    to: friendId,
    ...payload,
  };
}

async function dispatchOutgoingMessage(
  friendId: string,
  message: ChatMessage,
  options: {
    saveErrorLogPrefix: string;
    saveErrorAlert: string;
    onAfterDispatch?: () => void;
    messageToPersist?: ChatMessage;
  },
) {
  addMessageToConversation(friendId, message);
  appendMessageBubbleToUi(message, "right");
  options.onAfterDispatch?.();

  wsSocket?.emit("send-chat-message", message);

  try {
    await saveMessage(options.messageToPersist || message);
  } catch (error) {
    console.error(options.saveErrorLogPrefix, error);
    alert(options.saveErrorAlert);
  }
}

function isMediaMessage(message: ChatMessage) {
  return (
    message.type === "image" ||
    message.type === "document" ||
    message.type === "audio"
  );
}

function toTextOnlyPersistedMessage(message: ChatMessage): ChatMessage {
  const textOnlyMessage: ChatMessage = { ...message };
  delete textOnlyMessage.imageUrl;
  delete textOnlyMessage.imageName;
  delete textOnlyMessage.documentUrl;
  delete textOnlyMessage.documentName;
  delete textOnlyMessage.audioUrl;
  delete textOnlyMessage.audioDurationSec;
  delete textOnlyMessage.mimeType;
  delete textOnlyMessage.fileSize;

  return {
    ...textOnlyMessage,
    type: "text",
  };
}

function getMessageForPersistence(message: ChatMessage): ChatMessage {
  if (PERSIST_MEDIA_CONTENT_IN_DB || !isMediaMessage(message)) {
    return message;
  }

  return toTextOnlyPersistedMessage(message);
}

async function sendRichMessage(
  friendId: string,
  payload: Omit<ChatMessage, "from" | "name" | "email" | "time" | "to"> & {
    message: string;
  },
  saveErrorLogPrefix: string,
  saveErrorAlert: string,
  onAfterDispatch?: () => void,
) {
  const newMessage = buildOutgoingMessage(friendId, payload);

  await dispatchOutgoingMessage(friendId, newMessage, {
    saveErrorLogPrefix,
    saveErrorAlert,
    messageToPersist: getMessageForPersistence(newMessage),
    onAfterDispatch,
  });
}

function messageAlreadyExists(
  existingMessage: ChatMessage,
  newMessage: ChatMessage,
) {
  return (
    existingMessage.time === newMessage.time &&
    existingMessage.message === newMessage.message &&
    existingMessage.from === newMessage.from
  );
}

function addMessageToConversationIfMissing(
  friendId: string,
  message: ChatMessage,
) {
  const conversation = conversations[friendId] || [];
  const exists = conversation.some((existingMessage) =>
    messageAlreadyExists(existingMessage, message),
  );

  if (!exists) {
    addMessageToConversation(friendId, message);
  }
}

//--open-close fiend list mobile-only
openCloseFriendList?.addEventListener("click", function () {
  if (!isMobileViewport()) {
    return;
  }

  document.body.classList.toggle("friend-list-open");
  syncFriendListToggleButtonState();
});

// --- MODALS ---
function openAddFriendModal() {
  const modal = createAddFriendModal(async (email) => {
    const newlyAddedFriend = await addFriendByEmail(email);
    friends.push(newlyAddedFriend);
    renderFilteredFriendsList();
  });
  document.body.appendChild(modal);
}

// --- WEBSOCKET ---

function connectToWsServer() {
  wsSocket = connectToWebSocketsServer({
    onMessage: onRecieveMessageFromWsServer,
    onError: onWssError,
    onOpen: onWsOpen,
    onUserStatusUpdate: onUserStatusUpdate,
    onUserTyping: onUserTyping,
  });
}

function onWsOpen() {
  // Register the current user when WebSocket connects
  const user = getLoggedInUser();
  if (user && wsSocket) {
    wsSocket.emit("register-user", user.uid);
  }
}

function onUserStatusUpdate(statusData: {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date;
}) {
  userStatuses[statusData.userId] = {
    isOnline: statusData.isOnline,
    lastSeen: statusData.lastSeen,
  };

  // Update the friend list to reflect the new status
  updateFriendOnlineStatus(statusData.userId, statusData.isOnline);
}

function updateFriendOnlineStatus(userId: string, isOnline: boolean) {
  const friendElement = document.querySelector(`[data-friend-id="${userId}"]`);
  if (friendElement) {
    const avatar = friendElement.querySelector(".avatar");
    if (avatar) {
      avatar.className = `avatar ${isOnline ? "avatar-online" : "avatar-offline"}`;
    }
  }
}

function onUserTyping(typingData: { from: string; isTyping: boolean }) {
  if (selectedFriendId === typingData.from) {
    showTypingIndicator(typingData.isTyping);
  }
}

function showTypingIndicator(isTyping: boolean) {
  let typingIndicator = document.querySelector(
    ".typing-indicator",
  ) as HTMLElement;

  if (isTyping) {
    if (!typingIndicator) {
      typingIndicator = document.createElement("div");
      typingIndicator.className = "typing-indicator";
      typingIndicator.innerHTML = `
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span class="typing-text">typing...</span>
      `;
      messagesContainer.appendChild(typingIndicator);
    }
    typingIndicator.classList.add("visible");
  } else {
    if (typingIndicator) {
      typingIndicator.classList.remove("visible");
    }
  }
}

function handleTyping() {
  if (!selectedFriendId || !wsSocket) return;

  if (!isTyping) {
    isTyping = true;
    wsSocket.emit("typing-start", { to: selectedFriendId });
  }

  // Clear existing timeout
  if (typingTimeouts[selectedFriendId]) {
    clearTimeout(typingTimeouts[selectedFriendId]);
  }

  // Set new timeout to stop typing indicator
  typingTimeouts[selectedFriendId] = setTimeout(() => {
    isTyping = false;
    wsSocket?.emit("typing-stop", { to: selectedFriendId });
  }, 1000);
}

async function sendImageMessage(imageUrl: string, imageName: string) {
  const friendId = requireSelectedFriend(
    "Please select a friend to chat with!",
  );
  if (!friendId) {
    return;
  }

  await sendRichMessage(
    friendId,
    {
      message: `Sent an image: ${imageName}`,
      imageUrl,
      imageName,
      type: "image" as const,
    },
    "Failed to persist image message:",
    "Message could not be saved. Please try again.",
    () => {
      imageInput.value = "";
    },
  );
}

async function sendDocumentMessage(documentUrl: string, file: File) {
  const friendId = requireSelectedFriend(
    "Please select a friend to chat with!",
  );
  if (!friendId) {
    return;
  }

  await sendRichMessage(
    friendId,
    {
      message: `Sent a file: ${file.name}`,
      documentUrl,
      documentName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      type: "document" as const,
    },
    "Failed to persist document message:",
    "Document message could not be saved. Please try again.",
    () => {
      documentInput.value = "";
    },
  );
}

async function sendAudioMessage(
  audioUrl: string,
  audioDurationSec: number,
  mimeType: string,
) {
  const friendId = requireSelectedFriend(
    "Please select a friend to chat with!",
  );
  if (!friendId) {
    return;
  }

  await sendRichMessage(
    friendId,
    {
      message: "Sent an audio message",
      audioUrl,
      audioDurationSec,
      mimeType,
      type: "audio",
    },
    "Failed to persist audio message:",
    "Audio message could not be saved. Please try again.",
  );
}

function onRecieveMessageFromWsServer(message: WssMessage) {
  switch (message.type) {
    case "load-chat-messages":
      // This is now handled by loadConversationMessages when selecting a friend
      // We can ignore this or use it for initial loading if needed
      break;
    case "chat-update":
      const newMessage = message.data as ChatMessage;
      const currentUser = getLoggedInUser();
      const currentUserId = currentUser?.uid;
      const conversationFriendId =
        newMessage.from === currentUserId ? newMessage.to : newMessage.from;

      if (!conversationFriendId) {
        break;
      }

      addMessageToConversationIfMissing(conversationFriendId, newMessage);

      // If this message is for the currently selected friend, display it
      if (selectedFriendId === conversationFriendId) {
        const isMine = newMessage.from === currentUserId;
        appendMessageBubbleToUi(newMessage, isMine ? "right" : "left");
      }
      break;
  }
}

function onWssError(error: Error) {
  console.error("WebSocket error:", error);
}

// --- SEND MESSAGE ---
async function onSendMessage() {
  const message = messageInput.value;
  if (message.trim() === "") return;
  const friendId = requireSelectedFriend(
    "Please select a friend to chat with!",
  );
  if (!friendId) {
    return;
  }

  const newMessage = buildOutgoingMessage(friendId, {
    message,
  });

  await dispatchOutgoingMessage(friendId, newMessage, {
    saveErrorLogPrefix: "Failed to persist message:",
    saveErrorAlert: "Message could not be saved. Please try again.",
    onAfterDispatch: () => {
      messageInput.value = "";
      closeAttachmentMenu();
    },
  });
}

// --- Emoji ---
if (
  emojiSelectorIcon &&
  emojiSelector &&
  emojiList &&
  messageInput &&
  emojiSearchInput
) {
  fetchEmojis(emojiList, messageInput).then((allEmojis) => {
    initEmojiSelector(
      emojiSelectorIcon,
      emojiSelector,
      allEmojis,
      emojiList,
      messageInput,
    );
    emojiSearch(emojiSearchInput, emojiList, allEmojis, messageInput);
    closeEmojiOnOutsideClick(emojiSelector, emojiSelectorIcon);
  });
}
