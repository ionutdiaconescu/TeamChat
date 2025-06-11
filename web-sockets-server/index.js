import { Server } from "socket.io";
import { db } from "./../src/services/db-service/db.service.js";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

const formatMessage = (data, type = "message") => ({
  type,
  data,
});

const webSocketsServer = new Server({
  cors: { origin: "http://localhost:5173" },
});

async function fetchMessages() {
  const messagesCol = collection(db, "messages");
  const messagesSnapshot = await getDocs(messagesCol);
  return messagesSnapshot.docs.map((doc) => doc.data());
}

// get users from Firestore
async function fetchAllUsers() {
  const usersCol = collection(db, "users");
  const usersSnapshot = await getDocs(usersCol);
  return usersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

webSocketsServer.on("connection", async (socket) => {
  console.log("New client connected:", socket.id);

  // Fetch messages from Firestore
  const messages = await fetchMessages();
  socket.emit("message", formatMessage(messages, "load-chat-messages"));

  socket.on("get-friends", async () => {
    const users = await fetchAllUsers();
    socket.emit("friends", users);
  });

  socket.on("send-chat-message", async (data) => {
    // Save new message to Firestore
    await addDoc(collection(db, "messages"), {
      ...data,
      timestamp: serverTimestamp(),
    });
    console.log("New message received:", data);
    socket.broadcast.emit("message", formatMessage(data, "chat-update"));
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

webSocketsServer.listen(8000, () => {
  console.log("WebSocket server is running on port 8000");
});
