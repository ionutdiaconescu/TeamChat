import { createDomElement } from "../../services/dom.services";
export const createMessageBubble = (
  message: string,
  time: string,
  direction: "left" | "right",
  user: string
): HTMLElement => {
  const userElem = createDomElement("div", "user", user);
  const textElem = createDomElement("div", "text", message);
  const timeElem = createDomElement("div", "timestamp", time);

  const bubble = createDomElement(
    "div",
    `message ${direction}`,
    "",
    undefined,
    [userElem, textElem, timeElem]
  );

  return bubble;
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

  const info = createDomElement("div", "friend-info", "", undefined, [
    nameSpan,
    statusSpan,
  ]);

  const item = createDomElement("li", "friend", "", undefined, [avatar, info]);
  return item;
};
