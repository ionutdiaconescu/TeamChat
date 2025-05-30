import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { app } from "../services/db.services.ts";

import { AuthCredentials } from "./auth.services.types.ts";
/**
 * register()
 *
 * Create a new account for a user with a given email and password.
 * @param {string} name User's email.
 * @param {string} email User's email.
 * @param {string} password User's password
 */
const auth = getAuth(app);

export const register = async ({ email, password }: AuthCredentials) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;

  await updateProfile(user, {
    photoURL: "/public/user-icon.webp",
  });

  return user;
};

/**
 * login()
 *
 * Logs in the user.
 *
 * @param {string} email The user's email
 * @param {string} password The user's password
 */

export const loginUser = async ({ email, password }: AuthCredentials) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "message" in error) {
      console.error((error as { message: string }).message);
    }
    throw new Error("Email or password is incorrect");
  }
};

export const handleServerAuthError = (error: any) => {
  const defaultErrorMessage = "An unknown error occurred. Please try again.";

  if (error?.code) {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "This email is already registered. Please log in instead.";
      case "auth/invalid-email":
        return "The email address is not valid.";
      case "auth/weak-password":
        return "Password is too weak. Try a stronger one.";
      default:
        return defaultErrorMessage;
    }
  }

  return defaultErrorMessage;
};
