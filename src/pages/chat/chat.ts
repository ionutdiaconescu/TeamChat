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
let messages: ChatMessage[] = [];

let friends: User[] = [];

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
  friends = (await getFriendsOfCurrentUser()) as User[];
  renderFriendsList();

  sendBtn.addEventListener("click", onSendMessage);
  searchInput!.addEventListener(
    "input",
    debounce(renderFilteredFriendsList, 300)
  );
}

// --- UI FUNCTIONS ---
function renderFriendsList(filteredFriends?: User[]) {
  const renderedFriends = filteredFriends || friends;
  friendList.innerHTML = "";

  renderedFriends.forEach((friend: any) => {
    const friendItem = createFriendItem(
      friend.name,
      friend.email,
      friend.status || "offline",
      () => removeFriend(friend),
      friend.id
    );
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

//--open-close fiend list mobile-only
openCloseFriendList?.addEventListener("click", function () {
  document.body.classList.toggle("friend-list-open");
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
