import { Socket } from "socket.io-client";
import { createFriendItem, createMessageBubble } from "./chatTemplates";
import { loadHeader } from "./../../services/page.service";
import { connectToWebSocketsServer } from "../../services/web-sockets-service/web-sockets.service";
import { ChatMessage, WssMessage } from "./chat.types";
import { auth } from "../../services/db-service/db.service";

initializePage();
const loggedInUser =
  auth.currentUser?.displayName || auth.currentUser?.email || "Anonim";

const messagesContainer = document.querySelector(".chat-messages")!;
const messageInput = document.getElementById(
  "messageInput"
)! as HTMLInputElement;
const sendBtn = document.getElementById("sendMessageBtn")!;

let wsSocket: Socket | null = null;
let messages: ChatMessage[] = [];

function initializePage() {
  loadHeader();

  connectToWsServer();
  sendBtn.addEventListener("click", onSendMessage);
}

function connectToWsServer() {
  wsSocket = connectToWebSocketsServer({
    onMessage: onRecieveMessageFromWsServer,
    onError: onWssError,
  });

  // Ascultă lista de prieteni de la server
  wsSocket.on("friends", (users: any[]) => {
    renderFriendsList(users);
  });

  // Cere lista de prieteni după conectare
  wsSocket.emit("get-friends");
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

function renderMessages() {
  if (messagesContainer) {
    messages.forEach((msg) => {
      const messageBubble = createMessageBubble(
        msg.message,
        msg.time,
        msg.from === loggedInUser ? "right" : "left",
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
    from: loggedInUser,
    time: new Date().toISOString(),
    message,
  };

  messages.push(newMessage);

  const messageBubble = createMessageBubble(
    newMessage.message,
    newMessage.time,
    "right",
    loggedInUser
  );

  if (wsSocket) {
    wsSocket.emit("send-chat-message", newMessage);
  } else {
    throw new Error("WebSocket connection is not established");
  }

  messagesContainer.append(messageBubble);
  messageInput.value = "";
}
