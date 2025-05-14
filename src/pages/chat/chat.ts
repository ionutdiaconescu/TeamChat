import { createFriendItem, createMessageBubble } from "./chatTemplates";
import { createDomElement } from "../../services/dom.services";

export function renderChatInterface() {
  const chatContainer = createDomElement(
    "div",
    "chat-layout",
    "",
    document.body
  );
  chatContainer.id = "chat-container";

  const sidebar = createDomElement("aside", "sidebar", "", chatContainer!);
  const list = createDomElement("ul", "friend-list", "", sidebar);

  const user1 = createFriendItem("Jane Smith", "Online", true);
  const user2 = createFriendItem("John Doe", "Last seen 5m ago", false);
  list.append(user1, user2);

  const main = createDomElement("main", "chat-window", "", chatContainer!);
  const messages = createDomElement("div", "chat-messages", "", main);

  const m1 = createMessageBubble("Hello!", "10:00 AM", "left");
  const m2 = createMessageBubble("Hi there!", "10:01 AM", "right");

  messages.append(m1, m2);
}
renderChatInterface();
