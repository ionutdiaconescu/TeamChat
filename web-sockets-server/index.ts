import { Server } from "socket.io";
import {
  addDbDoc,
  getDbDocs,
} from "./../src/services/db-service/db.service.ts";

const formatMessage = (data, type = "message") => ({
  type,
  data,
});

// allow CORS origin via environment variable (e.g. frontend URL)
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
const webSocketsServer = new Server({
  cors: { origin: corsOrigin },
});

async function fetchMessages() {
  try {
    return await getDbDocs("messages");
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
}

webSocketsServer.on("connection", async (socket) => {
  console.log("New client connected:", socket.id);

  // Fetch messages from Firestore
  const messages = await fetchMessages();
  socket.emit("message", formatMessage(messages, "load-chat-messages"));

  socket.on("send-chat-message", async (data) => {
    // Save new message to Firestore
    try {
      await addDbDoc("messages", data);
      console.log("New message received:", data);
      socket.broadcast.emit("message", formatMessage(data, "chat-update"));
    } catch (error) {
      console.error("Error adding message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8000;
webSocketsServer.listen(PORT);
console.log(`WebSocket server is running on port ${PORT}`);
