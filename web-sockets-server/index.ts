import { Server, Socket } from "socket.io";
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

// Store connected users: userId -> socket
const connectedUsers: Map<string, Socket> = new Map();

// Store user online status: userId -> {socketId, lastSeen}
const userStatuses: Map<
  string,
  { socketId: string; lastSeen: Date; isOnline: boolean }
> = new Map();

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

  // When a user connects, they should send their user ID
  socket.on("register-user", (userId: string) => {
    connectedUsers.set(userId, socket);
    userStatuses.set(userId, {
      socketId: socket.id,
      lastSeen: new Date(),
      isOnline: true,
    });

    console.log(`User ${userId} registered with socket ${socket.id}`);

    // Notify all connected users about the online status change
    broadcastUserStatus(userId, true);
  });

  // Fetch messages from Firestore (for backward compatibility)
  const messages = await fetchMessages();
  socket.emit("message", formatMessage(messages, "load-chat-messages"));

  socket.on("send-chat-message", async (data) => {
    try {
      // Save new message to Firestore
      await addDbDoc("messages", data);
      console.log("New message received:", data);

      // Send message to the recipient if they're connected
      const recipientSocket = connectedUsers.get(data.to);
      if (recipientSocket) {
        recipientSocket.emit("message", formatMessage(data, "chat-update"));
      }

      // Also send back to sender for confirmation
      socket.emit("message", formatMessage(data, "chat-update"));
    } catch (error) {
      console.error("Error adding message:", error);
    }
  });

  socket.on("typing-start", (data: { to: string }) => {
    const recipientSocket = connectedUsers.get(data.to);
    if (recipientSocket) {
      recipientSocket.emit("user-typing", { from: data.to, isTyping: true });
    }
  });

  socket.on("typing-stop", (data: { to: string }) => {
    const recipientSocket = connectedUsers.get(data.to);
    if (recipientSocket) {
      recipientSocket.emit("user-typing", { from: data.to, isTyping: false });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    // Remove user from connected users and update status
    for (const [userId, userSocket] of connectedUsers.entries()) {
      if (userSocket.id === socket.id) {
        connectedUsers.delete(userId);

        // Update status to offline
        const status = userStatuses.get(userId);
        if (status) {
          status.isOnline = false;
          status.lastSeen = new Date();
        }

        console.log(`User ${userId} disconnected`);

        // Notify all connected users about the offline status change
        broadcastUserStatus(userId, false);
        break;
      }
    }
  });
});

function broadcastUserStatus(userId: string, isOnline: boolean) {
  const statusData = {
    userId,
    isOnline,
    lastSeen: userStatuses.get(userId)?.lastSeen,
  };

  // Send to all connected users
  for (const socket of connectedUsers.values()) {
    socket.emit("user-status-update", statusData);
  }
}

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8000;
webSocketsServer.listen(PORT);
console.log(`WebSocket server is running on port ${PORT}`);
