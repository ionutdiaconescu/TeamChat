import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { app } from "../services/db.services.ts";
import validator from "validator";
import { configureElement } from "./dom.services.ts";
import { AuthCredentials } from "../utils/types.ts";
/**
 * register()
 *
 * Create a new account for a user with a given email and password.
 * @param {string} name User's email.
 * @param {string} email User's email.
 * @param {string} password User's password
 */
const auth = getAuth(app);

export const registerUser = async ({ email, password }: AuthCredentials) => {
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

// ---------------- VALIDATION HELPERS ----------------
export const validateEmailInput = (email: string): string => {
  if (!validator.isEmail(email.trim())) {
    return "Please enter a valid email address";
  }
  return "";
};

export const validatePasswordInput = (password: string): string => {
  if (validator.isEmpty(password)) {
    return "Password cannot be empty";
  }
  if (!validator.isLength(password, { min: 6 })) {
    return "Password must be at least 6 characters long";
  }
  return "";
};

export const addLiveAndBlurValidation = (
  inputElement: HTMLInputElement,
  validatorFn: (value: string) => string,
  messageBox: HTMLElement
) => {
  const handler = () => {
    const error = validatorFn(inputElement.value);
    configureElement(
      messageBox,
      error ? "message-box error" : "message-box",
      error
    );
  };
  inputElement.addEventListener("blur", handler);
  inputElement.addEventListener("input", handler);
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
