import {
  loginUser,
  validateEmailInput,
  validatePasswordInput,
  addLiveAndBlurValidation,
} from "./services/auth.services";
import {
  renderLoadingSpinner,
  removeLoadingSpinner,
} from "./services/loading.service";

import { configureElement } from "./services/dom.services";

const form = document.querySelector("form") as HTMLFormElement;
const emailInput = document.getElementById("email") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;
const rememberMeCheckbox = document.getElementById(
  "remember-me"
) as HTMLInputElement;
const loginButton = document.getElementById("login-btn") as HTMLButtonElement;
const messageBox = document.querySelector(".message-box") as HTMLElement;
initializePage();
function initializePage() {
  loginButton.addEventListener("click", onLoginButtonClick);
  rememberMeCheckbox.addEventListener("change", onRememberMeCheckboxTick);
  addLiveAndBlurValidation(emailInput, validateEmailInput, messageBox);
  addLiveAndBlurValidation(passwordInput, validatePasswordInput, messageBox);
}

async function onLoginButtonClick(e: MouseEvent): Promise<void> {
  e.preventDefault();
  const isValid = validateInputs();
  if (!isValid) return;
  renderLoadingSpinner(form);

  try {
    await loginUser({ email: emailInput.value, password: passwordInput.value });
    configureElement(messageBox, "message-box success", "Login successful");

    setTimeout(() => {
      window.location.href = "/src/pages/chat/index.html";
    }, 1000);
  } catch (error: unknown) {
    configureElement(
      messageBox,
      "message-box error",
      "Email or password is incorrect"
    );
  } finally {
    removeLoadingSpinner(form);
  }
}

function onRememberMeCheckboxTick(e: Event): void {
  const checkbox = e.target as HTMLInputElement;
  const autocompleteValue = checkbox.checked ? "email" : "off";
  emailInput.setAttribute("autocomplete", autocompleteValue);
  passwordInput.setAttribute(
    "autocomplete",
    checkbox.checked ? "current-password" : "off"
  );
}

/** Inputs validation */
function validateInputs(): boolean {
  const emailError = validateEmailInput(emailInput.value);
  const passwordError = validatePasswordInput(passwordInput.value);
  const errorMessage = emailError || passwordError;

  if (errorMessage) {
    configureElement(messageBox, "message-box error", errorMessage);
    return false;
  }

  configureElement(messageBox, "", "");
  return true;
}
