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
const imageUploadIcon = document.getElementById("imageUploadIcon");
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

  sendBtn.addEventListener("click", onSendMessage);
  searchInput!.addEventListener(
    "input",
    debounce(renderFilteredFriendsList, 300),
  );
  // Add typing indicator
  messageInput.addEventListener("input", handleTyping);

  // Add image upload functionality
  if (imageUploadIcon && imageInput) {
    imageUploadIcon.addEventListener("click", () => {
      if (!selectedFriendId) {
        alert("Please select a friend before sending an image.");
        return;
      }

      // Reset value so selecting the same file again still triggers change.
      imageInput.value = "";
      imageInput.click();
    });

    imageInput.addEventListener("change", handleImageUpload);
  }
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

  // On mobile, close the friend list automatically
  if (window.innerWidth <= 768) {
    document.body.classList.remove("friend-list-open");
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

    const displayName =
      typeof msg.name === "string" && msg.name.trim()
        ? msg.name
        : typeof msg.email === "string" && msg.email.trim()
          ? msg.email
          : msg.from;
    const messageBubble = createMessageBubble(
      msg.message,
      msg.time,
      isMine ? "right" : "left",
      displayName,
      msg.imageUrl,
    );
    messagesContainer.append(messageBubble);
  });
}

//--open-close fiend list mobile-only
openCloseFriendList?.addEventListener("click", function () {
  document.body.classList.toggle("friend-list-open");

  // If opening the friend list, reset selection and show default state
  if (document.body.classList.contains("friend-list-open")) {
    selectedFriendId = null;

    // Clear chat header to default
    const user = getLoggedInUser();
    chatUserName.textContent = user?.displayName || user?.email || "Chat";
    chatUserEmail.textContent = user?.email || "";

    // Clear friend selection
    document.querySelectorAll(".friend").forEach((friend) => {
      friend.classList.remove("selected");
    });

    // Show default message
    renderMessages();
  }
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

function handleImageUpload(event: Event) {
  const fileInput = event.target as HTMLInputElement;
  const file = fileInput.files?.[0];
  if (!file) return;

  if (!selectedFriendId) {
    alert("Please select a friend to chat with!");
    fileInput.value = "";
    return;
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    alert("Please select an image file.");
    fileInput.value = "";
    return;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert("Image size must be less than 5MB.");
    fileInput.value = "";
    return;
  }

  // Create a preview and send
  const reader = new FileReader();
  reader.onload = (e) => {
    const imageUrl = e.target?.result as string;
    sendImageMessage(imageUrl, file.name);
  };
  reader.onerror = () => {
    alert("Image could not be read. Please try another file.");
    fileInput.value = "";
  };
  reader.readAsDataURL(file);
}

async function sendImageMessage(imageUrl: string, imageName: string) {
  if (!selectedFriendId) {
    alert("Please select a friend to chat with!");
    return;
  }

  const user = getLoggedInUser();
  const newMessage: ChatMessage = {
    from: user?.uid || "Anonim",
    name: user?.displayName || user?.email || "Anonim",
    email: user?.email || "",
    time: new Date().toISOString(),
    message: `Sent an image: ${imageName}`,
    imageUrl,
    imageName,
    type: "image" as const,
    to: selectedFriendId,
  };

  // Add message to current conversation
  if (!conversations[selectedFriendId]) {
    conversations[selectedFriendId] = [];
  }
  conversations[selectedFriendId].push(newMessage);

  const messageBubble = createMessageBubble(
    newMessage.message,
    newMessage.time,
    "right",
    newMessage.name || newMessage.email || newMessage.from,
    (newMessage as any).imageUrl,
  );

  messagesContainer.append(messageBubble);
  imageInput.value = "";

  if (wsSocket) {
    wsSocket.emit("send-chat-message", newMessage);
  }

  try {
    await saveMessage(newMessage);
  } catch (error) {
    console.error("Failed to persist image message:", error);
    alert("Message could not be saved. Please try again.");
  }
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

      // Add message to the correct conversation
      if (!conversations[conversationFriendId]) {
        conversations[conversationFriendId] = [];
      }

      // Check if message already exists to avoid duplicates
      const messageExists = conversations[conversationFriendId].some(
        (msg) =>
          msg.time === newMessage.time &&
          msg.message === newMessage.message &&
          msg.from === newMessage.from,
      );

      if (!messageExists) {
        conversations[conversationFriendId].push(newMessage);
      }

      // If this message is for the currently selected friend, display it
      if (selectedFriendId === conversationFriendId) {
        const isMine = newMessage.from === currentUserId;
        const displayName =
          newMessage.name || newMessage.email || newMessage.from;
        const messageBubble = createMessageBubble(
          newMessage.message,
          newMessage.time,
          isMine ? "right" : "left",
          displayName,
          newMessage.imageUrl,
        );
        messagesContainer.append(messageBubble);
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
  if (!selectedFriendId) {
    alert("Please select a friend to chat with!");
    return;
  }

  const user = getLoggedInUser();
  const newMessage: ChatMessage = {
    from: user?.uid || "Anonim",
    name: user?.displayName || user?.email || "Anonim",
    email: user?.email || "",
    time: new Date().toISOString(),
    message,
    to: selectedFriendId, // Add recipient info
  };

  // Add message to current conversation
  if (!conversations[selectedFriendId]) {
    conversations[selectedFriendId] = [];
  }
  conversations[selectedFriendId].push(newMessage);

  const messageBubble = createMessageBubble(
    newMessage.message,
    newMessage.time,
    "right",
    newMessage.name || newMessage.email || newMessage.from,
    (newMessage as any).imageUrl,
  );

  messagesContainer.append(messageBubble);
  messageInput.value = "";

  if (wsSocket) {
    wsSocket.emit("send-chat-message", newMessage);
  }

  try {
    await saveMessage(newMessage);
  } catch (error) {
    console.error("Failed to persist message:", error);
    alert("Message could not be saved. Please try again.");
  }
}

function debounce<T extends (...args: any[]) => void>(fn: T, delay = 300) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
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
