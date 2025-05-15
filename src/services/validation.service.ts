import validator from "validator";
import { configureElement } from "./dom.services.ts";
import { InputValidator, DualFieldValidator } from "../utils/types.ts";

// ---------------- VALIDATION HELPERS ----------------

export const addInputValidation = (
  inputElement: HTMLInputElement,
  validatorFn: InputValidator,
  messageBox: HTMLElement
): void => {
  const handler = (): void => {
    const error = validatorFn(inputElement.value);
    configureElement(messageBox, error ? "message-box error" : "", error);
  };
  inputElement.addEventListener("blur", handler);
};

export const validateNameInput: InputValidator = (name) => {
  name = name?.trim() || "";

  if (validator.isEmpty(name)) {
    return "Name cannot be empty";
  }

  if (!validator.isLength(name, { min: 3 })) {
    return "Name must be at least 3 characters long";
  }

  return "";
};

export const validateEmailInput: InputValidator = (email) => {
  if (!validator.isEmail(email.trim())) {
    return "Please enter a valid email address";
  }

  return "";
};

export const validatePasswordInput: InputValidator = (password) => {
  password = password?.trim() || "";

  if (validator.isEmpty(password)) {
    return "Password cannot be empty";
  }

  if (!validator.isLength(password, { min: 6 })) {
    return "Password must be at least 6 characters long";
  }

  return "";
};

export const validateNewPassword: DualFieldValidator = (value, oldPassword) => {
  const baseError = validatePasswordInput(value);
  if (baseError) return baseError;

  if (value?.trim() === oldPassword?.trim() && value) {
    return "New password must be different from the old password";
  }
  return "";
};

export const validateConfirmPassword: DualFieldValidator = (
  value,
  newPassword
) => {
  const baseError = validatePasswordInput(value);
  if (baseError) return baseError;

  if (value?.trim() !== newPassword?.trim()) {
    return "Passwords do not match";
  }
  return "";
};
