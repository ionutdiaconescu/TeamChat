// Client Web Sockets Service
import { io, Socket } from "socket.io-client";
import { WebSocketsListeners } from './web-sockets.service.types';

let webSocket: Socket | null = null;

export function connectToWebSocketsServer(listeners: WebSocketsListeners = {}) {
  const { onOpen, onMessage, onClose, onError } = listeners;

  if (!webSocket) {
    webSocket = io('ws://localhost:8000');

    if (onOpen) {
      webSocket.on('connect', onOpen);
    }

    if (onMessage) {
      webSocket.on('message', onMessage);
    }

    if (onClose) {
      webSocket.on('disconnect', onClose);
    }

    if (onError) {
      webSocket.on('error', onError);
    }
  }

  return webSocket;
}