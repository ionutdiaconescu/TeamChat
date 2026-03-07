import { Server, Socket } from "socket.io";

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

webSocketsServer.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // When a user connects, they should send their user ID
  socket.on("register-user", (userId: string) => {
    socket.data.userId = userId;
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

  socket.on("send-chat-message", (data: { to?: string }) => {
    if (!data?.to) {
      return;
    }

    console.log("New message received:", data);

    // Send message to the recipient if they're connected.
    const recipientSocket = connectedUsers.get(data.to);
    if (recipientSocket) {
      recipientSocket.emit("message", formatMessage(data, "chat-update"));
    }
  });

  socket.on("typing-start", (data: { to: string }) => {
    const senderId = socket.data.userId as string | undefined;
    const recipientSocket = connectedUsers.get(data.to);
    if (recipientSocket && senderId) {
      recipientSocket.emit("user-typing", { from: senderId, isTyping: true });
    }
  });

  socket.on("typing-stop", (data: { to: string }) => {
    const senderId = socket.data.userId as string | undefined;
    const recipientSocket = connectedUsers.get(data.to);
    if (recipientSocket && senderId) {
      recipientSocket.emit("user-typing", { from: senderId, isTyping: false });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    const userId = socket.data.userId as string | undefined;
    if (!userId) {
      return;
    }

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
