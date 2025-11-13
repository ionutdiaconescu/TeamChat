import { createDomElementFromHtmlString } from './dom.service';
import {
  signOutUser,
  onUserAuthStateChanged,
} from './auth-service/auth.service';

const menuLinks = [
  { name: 'CHAT', link: '/src/pages/chat/' },
  { name: 'ABOUT', link: '/src/pages/about/' },
  { name: 'CONTACT', link: '/src/pages/contact-us/' },
];

const guestMenuLinks = [
  { name: 'ABOUT', link: '/src/pages/about/' },
  { name: 'CONTACT', link: '/src/pages/contact-us/' },
  { name: 'LOGIN', link: '/src/pages/login/' },
  { name: 'REGISTER', link: '/src/pages/register/' },
];

const createMenuLinks = (isUserLoggedIn: boolean): string => {
  return (
    (isUserLoggedIn ? menuLinks : guestMenuLinks)
      .map((menuLink) => `<a href="${menuLink.link}">${menuLink.name}</a>`)
      .join('\n') +
    (isUserLoggedIn
      ? `
        <button id="logout-button" class="btn btn-link">
          LOG OUT
        </button>
      `
      : '')
  );
};

const headerTemplate = (isUserLoggedIn = false, isLoading = false) => `
  <header id="page-header" class="flex justify-between align-center gap-md border-box sticky-top header">
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
    <nav class="flex nav-bar main-nav">
      ${isLoading ? '' : createMenuLinks(isUserLoggedIn)}
    </nav>
  </header>
`;

export const attachLogoutHandlers = () => {
  const logoutBtn = document.getElementById('logout-button');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', signOutUser);
  }
};

export const attachLoginHandlers = () => {
  const loginBtn = document.getElementById('login-button');

  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      window.location.href = '/src/pages/login/';
    });
  }
};

export const loadHeader = (): void => {
  const loadingHeaderElement = createDomElementFromHtmlString(
    headerTemplate(false, true)
  );
  document.body.prepend(loadingHeaderElement!);

  onUserAuthStateChanged((currentUser) => {
    const existingHeaders = document.getElementById('page-header');

    if (existingHeaders) {
      existingHeaders.remove();
    }

    const headerElement = createDomElementFromHtmlString(
      headerTemplate(!!currentUser)
    );
    document.body.prepend(headerElement!);

    if (currentUser) {
      attachLogoutHandlers();
    } else {
      attachLoginHandlers();
    }
  });
};
