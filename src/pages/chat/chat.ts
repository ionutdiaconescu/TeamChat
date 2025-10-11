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
  onUserAuthStateChanged,
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
import { User } from "./../../services/user-service/user.service.types";

// --- DOM ELEMENTS ---
const messagesContainer = document.querySelector(".chat-messages")!;
const chatUserName = document.getElementById("chatUserName")!;
const chatUserEmail = document.getElementById("chatUserEmail")!;
const friendList = document.querySelector(".friend-list")!;
const openCloseFriendList = document.querySelector(".open-close-friendList");
const sendBtn = document.getElementById("sendMessageBtn")!;
const messageInput = document.getElementById(
  "messageInput"
)! as HTMLInputElement;
const searchInput = document.querySelector<HTMLInputElement>(
  ".friend-search-input"
);
const emojiSearchInput = document.querySelector<HTMLInputElement>(
  ".search-emoji input"
);
const emojiSelectorIcon = document.getElementById("emojiSelectorIcon");
const emojiSelector = document.getElementById("emojiSelector");
const emojiList = document.getElementById("emojiList");
const textarea = document.querySelector(
  ".message-input"
) as HTMLTextAreaElement | null;
if (textarea) {
  textarea.addEventListener("input", function (this: HTMLTextAreaElement) {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
  });
}
let wsSocket: Socket | null = null;
let conversations: { [friendId: string]: ChatMessage[] } = {};
let selectedFriendId: string | null = null;

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
    debounce(renderFilteredFriendsList, 300)
  );
}

// --- UI FUNCTIONS ---
function selectFriend(
  friendId: string,
  friendName: string,
  friendEmail: string
) {
  selectedFriendId = friendId;

  // Update chat header
  chatUserName.textContent = friendName;
  chatUserEmail.textContent = friendEmail;

  // Update visual selection
  updateFriendSelection(friendId);

  // Load and render messages for this friend
  renderMessages();

  // On mobile, close the friend list automatically
  if (window.innerWidth <= 768) {
    document.body.classList.remove("friend-list-open");
  }

  // Request messages for this friend from server if needed
  if (wsSocket) {
    wsSocket.emit("load-conversation", { friendId });
  }
}

function updateFriendSelection(selectedId: string) {
  // Remove previous selection
  document.querySelectorAll(".friend").forEach((friend) => {
    friend.classList.remove("selected");
  });

  // Add selection to current friend
  const selectedFriend = document.querySelector(
    `[data-friend-id="${selectedId}"]`
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
      () => selectFriend(friend.id, friend.name, friend.email) // Add selection callback
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
      displayName
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
  });
}

function onRecieveMessageFromWsServer(message: WssMessage) {
  switch (message.type) {
    case "load-chat-messages":
      // Load messages for current selected friend
      if (selectedFriendId) {
        conversations[selectedFriendId] = message.data || [];
        renderMessages();
      }
      break;
    case "chat-update":
      const newMessage = message.data;
      const senderId = newMessage.from;

      // Add message to the correct conversation
      if (!conversations[senderId]) {
        conversations[senderId] = [];
      }
      conversations[senderId].push(newMessage);

      // If this message is for the currently selected friend, display it
      if (selectedFriendId === senderId) {
        const displayName =
          newMessage.name || newMessage.email || newMessage.from;
        const messageBubble = createMessageBubble(
          newMessage.message,
          newMessage.time,
          "left",
          displayName
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
function onSendMessage() {
  const message = messageInput.value;
  if (message.trim() === "") return;
  if (!selectedFriendId) {
    alert("Please select a friend to chat with!");
    return;
  }

  const user = getLoggedInUser();
  const newMessage = {
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
    newMessage.name
  );

  if (wsSocket) {
    wsSocket.emit("send-chat-message", newMessage);
  } else {
    throw new Error("WebSocket connection is not established");
  }

  messagesContainer.append(messageBubble);
  messageInput.value = "";
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
      messageInput
    );
    emojiSearch(emojiSearchInput, emojiList, allEmojis, messageInput);
    closeEmojiOnOutsideClick(emojiSelector, emojiSelectorIcon);
  });
}
