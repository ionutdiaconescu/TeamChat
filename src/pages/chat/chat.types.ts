export type ChatMessage = {
  from: string;
  to?: string;
  name?: string;
  email?: string;
  time: string;
  message: string;
  imageUrl?: string;
  imageName?: string;
  documentUrl?: string;
  documentName?: string;
  audioUrl?: string;
  audioDurationSec?: number;
  mimeType?: string;
  fileSize?: number;
  type?: "text" | "image" | "document" | "audio";
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
