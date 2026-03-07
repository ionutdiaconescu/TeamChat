export type ChatMessage = {
  from: string;
  name?: string;
  email?: string;
  time: string;
  message: string;
  imageUrl?: string;
  imageName?: string;
  type?: "text" | "image";
};

export interface WssMessage {
  type: string;
  data?: any;
}
export type EmojiApiItem = {
  slug: string;
  character: string;
  unicodeName: string;
  codePoint: string;
  group: string;
  subGroup: string;
};
