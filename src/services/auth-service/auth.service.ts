import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { app } from '../db-service/db.service.ts';
import { renderLoadingSpinner } from '../loading.service.ts';

import { AuthCredentials, LoginCredentials } from './auth.service.types.ts';

const publicPages = [
  '/pages/login',
  '/pages/forgot-password',
  '/pages/register',
  '/src/pages/login',
  '/src/pages/forgot-password',
  '/src/pages/register',
];

const protectedPages = ['/pages/chat', '/src/pages/chat'];

const auth = getAuth(app);

/**
 * Helper function to show loading spinner on the current page body
 */
const showPageLoadingSpinner = () => {
  const bodyElement = document.body;
  if (bodyElement) {
    renderLoadingSpinner(bodyElement);
  }
};

/**
 * register()
 *
 * Create a new account for a user with a given email and password.
 * @param {string} name User's email.
 * @param {string}gender User's gender.
 * @param {string} email User's email.
 * @param {string} password User's password
 */
export const register = async ({
  name,
  gender,
  email,
  password,
}: AuthCredentials) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;

  await updateProfile(user, {
    displayName: name,
    photoURL: '/user-icon.webp',
  });

  return { user, gender, name };
};

/**
 * login()
 *
 * Logs in the user.
 *
 * @param {string} email The user's email
 * @param {string} password The user's password
 */

export const loginUser = async ({ email, password }: LoginCredentials) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'message' in error) {
      console.error((error as { message: string }).message);
    }
    throw new Error('Email or password is incorrect');
  }
};

export const onUserAuthStateChanged = (callback: (user: any) => void) =>
  onAuthStateChanged(auth, callback);

export const handleServerAuthError = (error: any) => {
  const defaultErrorMessage = 'An unknown error occurred. Please try again.';

  if (error?.code) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please log in instead.';
      case 'auth/invalid-email':
        return 'The email address is not valid.';
      case 'auth/weak-password':
        return 'Password is too weak. Try a stronger one.';
      default:
        return defaultErrorMessage;
    }
  }

  return defaultErrorMessage;
};

export const getLoggedInUser = () => {
  return auth.currentUser;
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    window.location.href = '/';
  } catch (error) {
    console.error('Logout error:', error);
  }
};

export const checkIfUserIsLoggedIn = () => {
  return new Promise((resolve) => {
    // Check current auth state immediately first
    const currentUser = auth.currentUser;
    if (currentUser !== null) {
      // User is definitely logged in
      handleUserState(currentUser, resolve);
      return;
    }

    // Wait for Firebase to initialize if no current user
    const unsubscribe = onUserAuthStateChanged((user) => {
      unsubscribe(); // Immediately unsubscribe to prevent multiple calls
      handleUserState(user, resolve);
    });
  });
};

function handleUserState(user: any, resolve: (value: boolean) => void) {
  const currentPath = window.location.pathname;
  const currentHref = window.location.href;

  const isPublicPage = publicPages.some((page) => currentHref.includes(page));
  const isProtectedPage = protectedPages.some((page) =>
    currentHref.includes(page)
  );

  // Check if user is on homepage, index pages, or pages directory listing
  const isHomePage =
    currentPath === '/' ||
    currentPath === '/index.html' ||
    currentPath === '/src/pages/' ||
    currentPath === '/src/pages' ||
    currentPath === '/pages/' ||
    currentPath === '/pages' ||
    currentHref.includes('/pages/index');

  // Redirect logic - only redirect if necessary
  if (user && (isHomePage || isPublicPage)) {
    // Logged in user on public pages -> redirect to chat
    showPageLoadingSpinner();
    setTimeout(() => {
      window.location.href = '/src/pages/chat/';
    }, 300);
    return; // Don't resolve, we're redirecting
  }

  if (!user && isHomePage) {
    // Not logged in user on homepage -> redirect to login
    showPageLoadingSpinner();
    setTimeout(() => {
      window.location.href = '/src/pages/login/';
    }, 300);
    return; // Don't resolve, we're redirecting
  }

  if (!user && isProtectedPage) {
    // Not logged in user on protected page -> redirect to login
    showPageLoadingSpinner();
    setTimeout(() => {
      window.location.href = '/src/pages/login/';
    }, 300);
    return; // Don't resolve, we're redirecting
  }

  // No redirect needed, resolve with user state
  resolve(!!user);
}
