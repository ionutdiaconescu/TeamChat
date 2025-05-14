import { createDomElement } from "../../services/dom.services";

export const createMessageBubble = (
  message: string,
  time: string,
  direction: "left" | "right"
): HTMLElement => {
  const textElem = createDomElement("div", "text", message);
  const timeElem = createDomElement("div", "timestamp", time);

  return createDomElement("div", `message ${direction}`, "", undefined, [
    textElem,
    timeElem,
  ]);
};
export const createFriendItem = (
  name: string,
  status: string,
  isOnline: boolean
): HTMLElement => {
  const avatar = createDomElement("div", "avatar", "");
  const nameSpan = createDomElement("span", "name", name);
  const statusSpan = createDomElement("span", "status", status);
  if (isOnline) statusSpan.classList.add("online");

  const friendInfo = createDomElement("div", "friend-info", "", undefined, [
    nameSpan,
    statusSpan,
  ]);

  return createDomElement("li", "friend", "", undefined, [avatar, friendInfo]);
};
