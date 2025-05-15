import { createFriendItem, createMessageBubble } from "./chatTemplates";

const friends = [
  { name: "Jane Smith", status: "Online", isOnline: true },
  { name: "John Doe", status: "Last seen 5m ago", isOnline: false },
  { name: "Alice Johnson", status: "Online", isOnline: true },
  { name: "Bob Brown", status: "Offline", isOnline: false },
];

const messages = [
  { from: "Jane Smith", time: "10:00 AM", message: "Hello, how are you?" },
  { from: "John Doe", time: "10:01 AM", message: "I'm good, you?" },
  { from: "Jane Smith", time: "10:02 AM", message: "Great! Let's chat." },
];

const loggedInUser = "Jane Smith";

// Adaugă prietenii în listă
const friendList = document.querySelector(".friend-list")!;
friends.forEach((friend) => {
  const userItem = createFriendItem(
    friend.name,
    friend.status,
    friend.isOnline
  );
  friendList.append(userItem);
});

// Adaugă mesajele în fereastra de chat
const messagesContainer = document.querySelector(".chat-messages")!;
messages.forEach((msg) => {
  const messageBubble = createMessageBubble(
    msg.message,
    msg.time,
    msg.from === loggedInUser ? "right" : "left",
    msg.from
  );
  messagesContainer.append(messageBubble);
});

// Trimitere mesaj
document.getElementById("sendMessageBtn")!.addEventListener("click", () => {
  const messageInput = document.getElementById(
    "messageInput"
  ) as HTMLInputElement;
  const message = messageInput.value;
  if (message.trim() === "") return;

  const newMessage = {
    from: loggedInUser,
    time: new Date().toLocaleTimeString(),
    message: message,
  };
  messages.push(newMessage);

  const messageBubble = createMessageBubble(
    newMessage.message,
    newMessage.time,
    "right",
    loggedInUser
  );
  messagesContainer.append(messageBubble);
  messageInput.value = "";
});
