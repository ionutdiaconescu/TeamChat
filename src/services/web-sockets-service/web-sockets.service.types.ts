export interface WebSocketsListeners {
  onOpen?: () => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: () => void;
  onError?: (event: Error) => void;
  onUserStatusUpdate?: (statusData: UserStatusData) => void;
  onUserTyping?: (typingData: UserTypingData) => void;
}

export interface UserStatusData {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface UserTypingData {
  from: string;
  isTyping: boolean;
}
