import { getLoggedInUser } from "../../services/auth-service/auth.service";
import { createDomElement } from "../../services/dom.service";
export const createMessageBubble = (
  message: string,
  time: string,
  direction: "left" | "right",
  user: string
): HTMLElement => {
  const userElem = createDomElement("div", "user", user);
  const textElem = createDomElement("div", "text", message);
  const timeElem = createDomElement(
    "div",
    "timestamp",
    time
      ? new Intl.DateTimeFormat("en-US", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date(time))
      : ""
  );

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
  email: string,
  status: string,
  onRemove: () => void,
  friendId: string
): HTMLElement => {
  const avatar = createDomElement(
    "div",
    `avatar ${status === "online" ? "avatar-online" : "avatar-offline"}`,
    ""
  );

  const nameSpan = createDomElement("span", "name", name);

  const emailSpan = createDomElement("span", "email", email);

  const info = createDomElement("div", "friend-info", "", undefined, [
    nameSpan,
    emailSpan,
  ]);

  //remove friend button
  const removeBtn = createDomElement("button", "remove-friend-btn", "❌");
  removeBtn.title = "Remove friend";

  if (friendId === getLoggedInUser()?.uid) {
    removeBtn.style.display = "none";
  } else {
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm(`Sigur vrei să ștergi prietenul ${name}?`)) {
        onRemove();
      }
    });
  }

  const item = createDomElement("li", "friend", "", undefined, [
    avatar,
    info,
    removeBtn,
  ]);
  return item;
};
export const createAddFriendButton = (onClick: () => void): HTMLElement => {
  const btn = document.createElement("button");
  btn.className = "add-friend-btn";
  btn.textContent = "Add Friend";
  btn.type = "button";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });
  return btn;
};

export const createAddFriendModal = (
  onConfirm: (email: string) => Promise<void>,
  onCancel?: () => void
): HTMLElement => {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal">
      <h3>Add friend</h3>
      <input type="email" id="new-friend-email" placeholder="Friend email" />
      <button id="confirm-add">Add</button>
      <button id="cancel-add">Cancel</button>
      <p id="add-error" class="error"></p>
    </div>
  `;

  const emailInput =
    overlay.querySelector<HTMLInputElement>("#new-friend-email")!;
  const errBox = overlay.querySelector<HTMLElement>("#add-error")!;

  overlay.querySelector("#cancel-add")!.addEventListener("click", () => {
    overlay.remove();
    if (onCancel) onCancel();
  });

  overlay.querySelector("#confirm-add")!.addEventListener("click", async () => {
    errBox.textContent = "";
    try {
      await onConfirm(emailInput.value);
      overlay.remove();
    } catch (e: any) {
      errBox.textContent = e.message;
    }
  });

  return overlay;
};
