mport { createFriendItem, createMessageBubble } from "./chatTemplates";
import { updateDbDoc } from "../../services/db.services";
import { signOut } from "firebase/auth";
import { createFriendItem, createMessageBubble } from "./chatTemplates";



const loggedInUser = "Jane Smith";

// Add friends to the friend list
const friendList = document.querySelector(".friend-list")!;
friends.forEach((friend) => {
  const userItem = createFriendItem(
    friend.name,
    friend.status,
    friend.isOnline
  );
  friendList.append(userItem);
});

// add messages to the chat
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

// Send message
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