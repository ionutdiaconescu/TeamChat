import { EmojiApiItem } from "./chat.types";

export function renderEmojiList(
  data: EmojiApiItem[],
  emojiList: HTMLElement,
  messageInput: HTMLInputElement,
) {
  emojiList.innerHTML = "";
  data.forEach((emoji) => {
    const li = document.createElement("li");
    li.setAttribute("emoji-name", emoji.slug);
    li.title = emoji.unicodeName;
    li.textContent = emoji.character;
    li.addEventListener("click", () => {
      messageInput.value += emoji.character;
    });
    emojiList.appendChild(li);
  });
}

export async function fetchEmojis(
  emojiList: HTMLElement,
  messageInput: HTMLInputElement,
) {
  try {
    const res = await fetch(
      "https://emoji-api.com/emojis?access_key=8f0d547a2b13d1968809f86674256575dcb7804e",
    );
    if (!res.ok) throw new Error("Network response was not ok");
    const data: EmojiApiItem[] = await res.json();
    renderEmojiList(data, emojiList, messageInput);
    return data;
  } catch (error) {
    console.error("Emoji fetch error:", error);
    return [];
  }
}

export function initEmojiSelector(
  emojiSelectorIcon: HTMLElement | null,
  emojiSelector: HTMLElement | null,
  allEmojis: EmojiApiItem[],
  emojiList: HTMLElement,
  messageInput: HTMLInputElement,
) {
  emojiSelectorIcon?.addEventListener("click", () => {
    emojiSelector?.classList.toggle("active");
    const emojiSearchInput = document.querySelector<HTMLInputElement>(
      ".search-emoji input",
    );
    if (emojiSearchInput) emojiSearchInput.value = "";
    renderEmojiList(allEmojis, emojiList, messageInput);
  });
}
export function emojiSearch(
  emojiSearchInput: HTMLInputElement,
  emojiList: HTMLElement,
  allEmojis: EmojiApiItem[],
  messageInput: HTMLInputElement,
) {
  emojiSearchInput.addEventListener("input", () => {
    const term = emojiSearchInput.value.toLocaleLowerCase();
    const filtered = allEmojis.filter(
      (emoji) =>
        emoji.unicodeName.toLowerCase().includes(term) ||
        emoji.slug.toLowerCase().includes(term),
    );
    renderEmojiList(filtered, emojiList, messageInput);
  });
}
export function closeEmojiOnOutsideClick(
  emojiSelector: HTMLElement,
  emojiSelectorIcon: HTMLElement,
) {
  document.addEventListener("mousedown", (event) => {
    const target = event.target as Node;

    if (
      emojiSelector.classList.contains("active") &&
      !emojiSelector.contains(target) &&
      !emojiSelectorIcon.contains(target)
    ) {
      emojiSelector.classList.remove("active");
    }
  });
}
