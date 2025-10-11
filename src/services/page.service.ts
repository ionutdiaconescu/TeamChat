import { createDomElementFromHtmlString } from "./dom.service";
import {
  getSignOutUser,
  onUserAuthStateChanged,
} from "./auth-service/auth.service";

const menuLinks = [
  { name: "CHAT", link: "/src/pages/chat/" },
  { name: "ABOUT", link: "/src/pages/about/" },
  { name: "CONTACT", link: "/src/pages/contact-us/" },
];

const guestMenuLinks = [
  { name: "ABOUT", link: "/src/pages/about/" },
  { name: "CONTACT", link: "/src/pages/contact-us/" },
];

const createMenuLink = (): string => {
  return (
    menuLinks
      .map((menuLink) => `<a href="${menuLink.link}">${menuLink.name}</a>`)
      .join("\n") +
    `
    <button  type="submit" id="logout-button-mobile" class="btn btn-secondary logout-button mobile-only">
      <span>Log out</span>
    </button>
    `
  );
};

const createGuestMenuLink = (): string => {
  return guestMenuLinks
    .map((menuLink) => `<a href="${menuLink.link}">${menuLink.name}</a>`)
    .join("\n");
};

const headerTemplate = `
  <header class="flex justify-between align-center gap-md border-box sticky-top header">
    <a class="logo" href="/">
      <img src="/logo.webp" alt="logo" />
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
    <button type="submit" id="logout-button" class="btn btn-secondary logout-button desktop-only">
      <span>Log out</span>
    </button>
  </header>
`;

const guestHeaderTemplate = `
  <header class="flex justify-between align-center gap-md border-box sticky-top header guest-header">
    <a class="logo" href="/">
      <img src="/logo.webp" alt="logo" />
      <span>TeamChat</span>
    </a>
    <input type="checkbox" id="nav-bar-hidden-toggle" class="nav-bar-hidden-toggle" />
    <label for="nav-bar-hidden-toggle" class="mobile-menu-trigger">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </label>
    <nav class="flex nav-bar guest-nav">
      ${createGuestMenuLink()}
    </nav>
  </header>
`;

const publicHeaderTemplate = `
  <header class="flex justify-between align-center gap-md border-box sticky-top header public-header">
    <a class="logo" href="/">
      <img src="/logo.webp" alt="logo" />
      <span>TeamChat</span>
    </a>
    <input type="checkbox" id="nav-bar-hidden-toggle" class="nav-bar-hidden-toggle" />
    <label for="nav-bar-hidden-toggle" class="mobile-menu-trigger">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </label>
    <nav class="flex nav-bar public-nav">
      ${createGuestMenuLink()}
    </nav>
    <button type="button" id="login-button-desktop" class="btn btn-secondary login-button desktop-only">
      <span>Log in</span>
    </button>
  </header>
`;

export const attachLogoutHandlers = () => {
  const desktopLogoutBtn = document.getElementById("logout-button");
  const mobileLogoutBtn = document.getElementById("logout-button-mobile");

  if (desktopLogoutBtn) {
    desktopLogoutBtn.addEventListener("click", getSignOutUser);
  }

  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener("click", getSignOutUser);
  }
};

export const attachLoginHandlers = () => {
  const loginBtn = document.getElementById("login-button-desktop");

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      window.location.href = "/src/pages/login/";
    });
  }
};

export const loadHeader = (): void => {
  const headerElement = createDomElementFromHtmlString(headerTemplate);

  if (headerElement) {
    document.body.prepend(headerElement);
    attachLogoutHandlers();
  } else {
    console.error("Failed to create header element from template.");
  }
};

export const loadGuestHeader = (): void => {
  const headerElement = createDomElementFromHtmlString(guestHeaderTemplate);

  if (headerElement) {
    document.body.prepend(headerElement);
  } else {
    console.error("Failed to create guest header element from template.");
  }
};

export const loadPublicHeader = (): void => {
  const headerElement = createDomElementFromHtmlString(publicHeaderTemplate);

  if (headerElement) {
    document.body.prepend(headerElement);
    attachLoginHandlers();
  } else {
    console.error("Failed to create public header element from template.");
  }
};

export const loadSmartHeader = (): void => {
  // Remove any existing headers first
  const existingHeaders = document.querySelectorAll("header");
  existingHeaders.forEach((header) => header.remove());

  // Use Firebase auth state observer to get accurate user state
  onUserAuthStateChanged((currentUser) => {
    // Remove any headers that might have been added during the check
    const headers = document.querySelectorAll("header");
    headers.forEach((header) => header.remove());

    if (currentUser) {
      // User is logged in, show full header with logout
      loadHeader();
    } else {
      // User is not logged in, show public header with login button
      loadPublicHeader();
    }
  });
};
