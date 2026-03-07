import {
  getDbDocs,
  getDbDocsWithOrder,
  addDbDoc,
} from "../db-service/db.service";
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
const sortMessagesByTime = (messages: any[]) => {
  return messages.sort((a, b) => {
    const timeA = a.timestamp?.toDate?.() || new Date(a.time || 0);
    const timeB = b.timestamp?.toDate?.() || new Date(b.time || 0);
    return timeA.getTime() - timeB.getTime();
  });
};

const getMessageUniqueKey = (message: any) => {
  return (
    message.id ||
    `${message.from || ""}|${message.to || ""}|${message.time || ""}|${message.message || ""}`
  );
};

const dedupeMessages = (messages: any[]) => {
  const uniqueMessages = new Map<string, any>();
  messages.forEach((message) => {
    uniqueMessages.set(getMessageUniqueKey(message), message);
  });
  return Array.from(uniqueMessages.values());
};

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

    // Combine, dedupe and sort all messages
    const allMessages = sortMessagesByTime(
      dedupeMessages([...messages1, ...messages2]),
    );

    return allMessages as unknown as ChatMessage[];
  } catch (error) {
    console.warn(
      "Indexed query failed for getMessagesBetweenUsers, trying fallback query:",
      error,
    );

    try {
      const allMessages = await getDbDocs("messages");
      const filteredMessages = allMessages.filter((message: any) => {
        return (
          (message.from === userId1 && message.to === userId2) ||
          (message.from === userId2 && message.to === userId1)
        );
      });

      return sortMessagesByTime(
        dedupeMessages(filteredMessages),
      ) as ChatMessage[];
    } catch (fallbackError) {
      console.error(
        "Error fetching messages between users (including fallback):",
        fallbackError,
      );
      return [];
    }
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
