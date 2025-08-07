//-------IMPORTS-------
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
  getLoggedInUser,
  onUserAuthStateChanged,
} from "./../../services/auth-service/auth.service";
import { getFriendsOfCurrentUser } from "../../services/friends-service/friends.service";
import {
  addFriendByEmail,
  removeFriendById,
} from "../../services/user-services/user.service";
import {
  fetchEmojis,
  initEmojiSelector,
  emojiSearch,
  closeEmojiOnOutsideClick,
} from "./emoji";
// --- DOM ELEMENTS ---
const messagesContainer = document.querySelector(".chat-messages")!;
const chatUserName = document.getElementById("chatUserName")!;
const chatUserEmail = document.getElementById("chatUserEmail")!;
const friendList = document.querySelector(".friend-list")!;
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

let wsSocket: Socket | null = null;
let messages: ChatMessage[] = [];

// --- INIT & AUTH ---
onUserAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "./index.html";
  } else {
    initializePage();
  }
});

async function initializePage() {
  if (!getLoggedInUser()) {
    window.location.href = "/index.html";
    return;
  }
  loadHeader();

  const user = getLoggedInUser();
  if (user) {
    chatUserName.textContent = user.displayName || user.email || "Anonim";
    chatUserEmail.textContent = user.email || "";
  }

  connectToWsServer();
  await loadFriends();
  sendBtn.addEventListener("click", onSendMessage);
  if (searchInput) {
    searchInput.addEventListener(
      "input",
      debounce(() => loadFriends(searchInput.value), 350)
    );
  }
}

// --- UI FUNCTIONS ---
async function loadFriends(searchTerm: string = "") {
  const friends = await getFriendsOfCurrentUser();
  friendList.innerHTML = "";
  const user = getLoggedInUser();
  const onlyFriends = friends.filter((friend: any) => friend.id !== user?.uid);

  const filtered = searchTerm
    ? onlyFriends.filter(
        (friend: any) =>
          friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          friend.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : onlyFriends;

  filtered.forEach((friend: any) => {
    const friendItem = createFriendItem(
      friend.name,
      friend.email,
      friend.status || "offline",
      async () => {
        await removeFriendById(friend.id);
        await loadFriends(searchTerm);
      },
      friend.id
    );
    friendList.appendChild(friendItem);
  });
  friendList.appendChild(createAddFriendButton(openAddFriendModal));
}

function renderMessages() {
  if (messagesContainer) {
    messagesContainer.innerHTML = "";
    const user = getLoggedInUser();
    messages.forEach((msg) => {
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
}

// --- MODALS ---
function openAddFriendModal() {
  const modal = createAddFriendModal(async (email) => {
    await addFriendByEmail(email);
    await loadFriends();
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
      messages = message.data || [];
      renderMessages();
      break;
    case "chat-update":
      const newMessage = message.data;
      const displayName =
        newMessage.name || newMessage.email || newMessage.from;
      const messageBubble = createMessageBubble(
        newMessage.message,
        newMessage.time,
        "left",
        displayName
      );
      messagesContainer.append(messageBubble);
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
  const user = getLoggedInUser();
  const newMessage = {
    from: user?.uid || "Anonim",
    name: user?.displayName || user?.email || "Anonim",
    email: user?.email || "",
    time: new Date().toISOString(),
    message,
  };

  messages.push(newMessage);

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
