import { createFriendItem, createMessageBubble } from "./chatTemplates";
import { updateDbDoc } from "../../services/db.services";
import { signOut } from "firebase/auth";
import { loadHeader } from "../../services/page.service";

initializePage();
function initializePage() {
  loadHeader();
}

const loggedInUser = "Jane Smith";

// hardcode example user data
const friends = [
  { name: "Alex Popescu", status: "online", isOnline: true },
  { name: "Maria Ionescu", status: "offline", isOnline: false },
];

const friendList = document.querySelector(".friend-list");
if (friendList) {
  friends.forEach((friend) => {
    const userItem = createFriendItem(
      friend.name,
      friend.status,
      friend.isOnline
    );
    friendList.append(userItem);
  });
}

// Mesaje hardcodate
const messages = [
  { from: "Jane Smith", time: "10:01", message: "Salut! Ce faci?" },
  { from: "Alex Popescu", time: "10:02", message: "Salut! Bine, tu?" },
  {
    from: "Jane Smith",
    time: "10:03",
    message: "Lucrez la proiectul TeamChat.",
  },
  {
    from: "Alex Popescu",
    time: "10:04",
    message: "Super! Ai nevoie de ajutor?",
  },
  {
    from: "Jane Smith",
    time: "10:05",
    message: "Momentan ma descurc, multumesc!",
  },
  {
    from: "Alex Popescu",
    time: "10:06",
    message: "Perfect, tine-ma la curent!",
  },
];

const messagesContainer = document.querySelector(".chat-messages");
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

// Send message
const sendBtn = document.getElementById("sendMessageBtn");
const messageInput = document.getElementById(
  "messageInput"
) as HTMLInputElement | null;

if (sendBtn && messageInput && messagesContainer) {
  sendBtn.addEventListener("click", () => {
    const message = messageInput.value;
    if (message.trim() === "") return;

    const newMessage = {
      from: loggedInUser,
      time: new Date().toLocaleTimeString().slice(0, 5),
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
}
