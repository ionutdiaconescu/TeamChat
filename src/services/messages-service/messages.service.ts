import { getDbDocsWithOrder, addDbDoc } from "../db-service/db.service";
import { ChatMessage } from "../../pages/chat/chat.types";

export interface MessageService {
  getMessagesBetweenUsers: (
    userId1: string,
    userId2: string,
  ) => Promise<ChatMessage[]>;
  saveMessage: (message: ChatMessage) => Promise<string>;
}

/**
 * Get all messages between two users, ordered by timestamp
 */
export const getMessagesBetweenUsers = async (
  userId1: string,
  userId2: string,
): Promise<ChatMessage[]> => {
  try {
    // Get messages where from is userId1 and to is userId2
    const messages1 = await getDbDocsWithOrder(
      "messages",
      [
        ["from", "==", userId1],
        ["to", "==", userId2],
      ],
      "timestamp",
      "asc",
    );

    // Get messages where from is userId2 and to is userId1
    const messages2 = await getDbDocsWithOrder(
      "messages",
      [
        ["from", "==", userId2],
        ["to", "==", userId1],
      ],
      "timestamp",
      "asc",
    );

    // Combine and sort all messages
    const allMessages = [...messages1, ...messages2].sort((a, b) => {
      const timeA = a.timestamp?.toDate?.() || new Date(a.time || 0);
      const timeB = b.timestamp?.toDate?.() || new Date(b.time || 0);
      return timeA.getTime() - timeB.getTime();
    });

    return allMessages as unknown as ChatMessage[];
  } catch (error) {
    console.error("Error fetching messages between users:", error);
    return [];
  }
};

/**
 * Save a new message to the database
 */
export const saveMessage = async (message: ChatMessage): Promise<string> => {
  try {
    return await addDbDoc("messages", message);
  } catch (error) {
    console.error("Error saving message:", error);
    throw error;
  }
};
