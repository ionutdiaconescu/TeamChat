import { createDomElementFromHtmlString } from "./dom.service";

const menuLinks = [
  { name: "CHAT", link: "/src/pages/chat/" },
  { name: "ABOUT", link: "/src/pages/about/" },
  { name: "CONTACT", link: "/src/pages/contact-us/" },
];

const createMenuLink = (): string => {
  return menuLinks
    .map((menuLink) => `<a href="${menuLink.link}">${menuLink.name}</a>`)
    .join("\n");
};

const headerTemplate = `
<header class="flex justify-between align-center gap-md border-box sticky-top header">
  <a class="logo" href="/pages/comments/">
    <img src="/public/logo.webp" alt="logo" />
    <span>TeamChat</span>
  </a>
  <input type="checkbox" id="nav-bar-hidden-toggle" class="nav-bar-hidden-toggle" />
  <label for="nav-bar-hidden-toggle" class="mobile-menu-trigger">
    <span class="dot"></span>
    <span class="dot"></span>
    <span class="dot"></span>
  </label>
 <nav class="flex  nav-bar">
    ${createMenuLink()}
  </nav>
  <button type="submit" id="logout-button" class="btn btn-secondary logout-button">
    <span>Log out</span>
  </button>

</header>`;

export const loadHeader = (): void => {
  const headerElement = createDomElementFromHtmlString(headerTemplate);

  if (headerElement) {
    document.body.prepend(headerElement);
  } else {
    console.error("Failed to create header element from template.");
  }
};
