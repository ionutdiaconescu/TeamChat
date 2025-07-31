export type ChatMessage = {
  from: string;
  name?: string;
  email?: string;
  time: string;
  message: string;
};

export interface WssMessage {
  type: string;
  data?: any;
}
