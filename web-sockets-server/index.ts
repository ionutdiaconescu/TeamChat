import { Server } from "socket.io";
import { addDbDoc, getDbDocs } from "./../src/services/db-service/db.service.ts";

const formatMessage = (data, type = "message") => ({
  type,
  data,
});

const webSocketsServer = new Server({
  cors: { origin: "http://localhost:5173" },
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

webSocketsServer.listen(8000);
console.log("WebSocket server is running on port 8000");
