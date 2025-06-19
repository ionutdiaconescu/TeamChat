import { Socket } from "socket.io-client";
import { createFriendItem, createMessageBubble } from "./chatTemplates";
import { loadHeader } from "./../../services/page.service";
import { connectToWebSocketsServer } from "../../services/web-sockets-service/web-sockets.service";
import { ChatMessage, WssMessage } from "./chat.types";
import { getLoggedInUser } from './../../services/auth-service/auth.service';

const messagesContainer = document.querySelector(".chat-messages")!;
const messageInput = document.getElementById(
  "messageInput"
)! as HTMLInputElement;
const sendBtn = document.getElementById("sendMessageBtn")!;

let wsSocket: Socket | null = null;
let messages: ChatMessage[] = [];

initializePage();

async function initializePage() {
  loadHeader();
  connectToWsServer();

  const friends = await getFriends();
  renderFriendsList(friends);

  sendBtn.addEventListener("click", onSendMessage);
}

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

      const messageBubble = createMessageBubble(
        newMessage.message,
        newMessage.time,
        "left",
        newMessage.from
      );
      messagesContainer.append(messageBubble);
      break;
  }
}

function onWssError(error: Error) {
  console.error("WebSocket error:", error);
}

function renderFriendsList(friends: any[] = []) {
  const friendList = document.querySelector(".friend-list");

  if (friendList) {
    friendList.innerHTML = "";
    friends.forEach((friend) => {
      const userItem = createFriendItem(
        friend.name,
        friend.status,
        friend.isOnline
      );
      friendList.append(userItem);
    });
  }
}

async function getFriends() {
  try {
    const friendsResponse = await fetch("./../../mocks/friends.json");
    const friends = await friendsResponse.json();
    return friends;
  } catch (error) {
    console.error("Error fetching friends:", error);
  }
}

function renderMessages() {
  if (messagesContainer) {
    messages.forEach((msg) => {
      const messageBubble = createMessageBubble(
        msg.message,
        msg.time,
        msg.from === getLoggedInUser() ? "right" : "left",
        msg.from
      );

      messagesContainer.append(messageBubble);
    });
  }
}

// Send message

function onSendMessage() {
  const message = messageInput.value;
  if (message.trim() === "") return;

  const newMessage = {
    from: getLoggedInUser(),
    time: new Date().toISOString(),
    message,
  };

  messages.push(newMessage);

  const messageBubble = createMessageBubble(
    newMessage.message,
    newMessage.time,
    "right",
    getLoggedInUser()
  );

  if (wsSocket) {
    wsSocket.emit("send-chat-message", newMessage);
  } else {
    throw new Error("WebSocket connection is not established");
  }

  messagesContainer.append(messageBubble);
  messageInput.value = "";
}
