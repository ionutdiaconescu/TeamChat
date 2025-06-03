export interface ChatMessage {
  id?: number;
  from: string;
  time: string;
  message: string;
}

export interface WssMessage {
  type: string;
  data?: any;
}
