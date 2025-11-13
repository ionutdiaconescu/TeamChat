import {
  loginUser,
  checkIfUserIsLoggedIn,
} from "./../../services/auth-service/auth.service.ts";
import {
  addInputValidation,
  validateEmailInput,
  validatePasswordInput,
} from "./../../services/validation-service/validation.service.ts";
import {
  renderLoadingSpinner,
  removeLoadingSpinner,
} from "./../../services/loading.service.ts";

import { configureElement } from "./../../services/dom.service.ts";
import { updateDbDoc } from "./../../services/db-service/db.service.ts";
import { loadHeader } from "./../../services/page.service.ts";

const form = document.querySelector("form")!;
const emailInput = document.getElementById("email")! as HTMLInputElement;
const passwordInput = document.getElementById("password")! as HTMLInputElement;
const rememberMeCheckbox = document.getElementById("remember-me")!;
const loginButton = document.getElementById("login-btn")!;
const messageBox = document.querySelector(".message-box")! as HTMLElement;
const emailError = document.getElementById("login-email-error")!;
const passwordError = document.getElementById("login-password-error")!;

initializePage();

async function initializePage() {
  loadHeader();
  await checkIfUserIsLoggedIn();
  loginButton.addEventListener("click", onLoginButtonClick);
  rememberMeCheckbox.addEventListener("change", onRememberMeCheckboxTick);
  addInputValidation(emailInput, validateEmailInput, emailError);
  addInputValidation(passwordInput, validatePasswordInput, passwordError);
}

async function onLoginButtonClick(e: MouseEvent): Promise<void> {
  e.preventDefault();
  const isValid = validateInputs();
  if (!isValid) return;
  renderLoadingSpinner(form);

  try {
    const user = await loginUser({
      email: emailInput.value,
      password: passwordInput.value,
    });

    await updateDbDoc("users", user.uid, {
      status: "online",
    });

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

function onRememberMeCheckboxTick(e: Event) {
  const target = e.target;

  if (target instanceof HTMLInputElement && target.type === "checkbox") {
    if (target.checked) {
      emailInput.setAttribute("autocomplete", "email");
      passwordInput.setAttribute("autocomplete", "current-password");
    } else {
      emailInput.setAttribute("autocomplete", "off");
      passwordInput.setAttribute("autocomplete", "off");
    }
  }
}

/** Inputs validation */
function validateInputs(): boolean {
  const emailErrorMessage = validateEmailInput(emailInput.value);
  const passwordErrorMessage = validatePasswordInput(passwordInput.value);

  configureElement(emailError, "message-box error", emailErrorMessage);
  configureElement(passwordError, "message-box error", passwordErrorMessage);
  return !(emailErrorMessage || passwordErrorMessage);
}
