// Client Web Sockets Service
import { io, Socket } from "socket.io-client";
import { WebSocketsListeners } from "./web-sockets.service.types";

let webSocket: Socket | null = null;

export function connectToWebSocketsServer(listeners: WebSocketsListeners = {}) {
  const {
    onOpen,
    onMessage,
    onClose,
    onError,
    onUserStatusUpdate,
    onUserTyping,
  } = listeners;

  if (!webSocket) {
    const wsUrl = import.meta.env.VITE_WS_SERVER || "ws://localhost:8000";
    webSocket = io(wsUrl);

    if (onOpen) {
      webSocket.on("connect", onOpen);
    }

    if (onMessage) {
      webSocket.on("message", onMessage);
    }

    if (onUserStatusUpdate) {
      webSocket.on("user-status-update", onUserStatusUpdate);
    }

    if (onUserTyping) {
      webSocket.on("user-typing", onUserTyping);
    }

    if (onClose) {
      webSocket.on("disconnect", onClose);
    }

    if (onError) {
      webSocket.on("error", onError);
    }
  }

  return webSocket;
}
