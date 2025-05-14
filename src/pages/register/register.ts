import {
  registerUser,
  validateEmailInput,
  validatePasswordInput,
  addLiveAndBlurValidation,
} from "../../services/auth.services";
import { configureElement } from "../../services/dom.services";
import {
  renderLoadingSpinner,
  removeLoadingSpinner,
} from "../../services/loading.service";
import { RegisterElements } from "../../utils/types";

// Inițializare
const elements: RegisterElements = {
  emailInput: document.querySelector("#email")!,
  passwordInput: document.querySelector("#password")!,
  confirmPasswordInput: document.querySelector("#confirm-password")!,
  registerBtn: document.querySelector("#registerBtn")!,
  messageBox: document.createElement("div"),
  form: document.querySelector(".auth-form")!,
};

// Set class for error boxes
elements.messageBox.className = "message-box";
elements.registerBtn.insertAdjacentElement("beforebegin", elements.messageBox);

// Add live validation
addLiveAndBlurValidation(
  elements.emailInput,
  validateEmailInput,
  elements.messageBox
);
addLiveAndBlurValidation(
  elements.passwordInput,
  validatePasswordInput,
  elements.messageBox
);

// Validation password
const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): string => {
  if (password !== confirmPassword) {
    return "Passwords do not match";
  }
  return "";
};

// Register
const handleRegister = async (): Promise<void> => {
  const email = elements.emailInput.value.trim();
  const password = elements.passwordInput.value.trim();
  const confirmPassword = elements.confirmPasswordInput.value.trim();

  const emailError = validateEmailInput(email);
  const passwordError = validatePasswordInput(password);
  const confirmError = validateConfirmPassword(password, confirmPassword);

  if (emailError || passwordError || confirmError) {
    configureElement(
      elements.messageBox,
      "message-box error",
      emailError || passwordError || confirmError
    );
    return;
  }

  renderLoadingSpinner(elements.form);
  try {
    // Acum trimitem doar email și parola
    const user = await registerUser({
      email,
      password,
    });
    configureElement(
      elements.messageBox,
      "message-box success",
      `Welcome, you have been registered.`
    );
    elements.form.reset();
  } catch (err) {
    configureElement(
      elements.messageBox,
      "message-box error",
      err instanceof Error ? err.message : "Registration failed"
    );
  } finally {
    removeLoadingSpinner(elements.form);
  }
};

elements.registerBtn.addEventListener("click", handleRegister);
