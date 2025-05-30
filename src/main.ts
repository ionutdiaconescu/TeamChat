import { loginUser } from "./services/auth.services";
import {
  addInputValidation,
  validateEmailInput,
  validatePasswordInput,
} from "./services/validation.service";
import {
  renderLoadingSpinner,
  removeLoadingSpinner,
} from "./services/loading.service";

import { configureElement } from "./services/dom.service";
import { getDbDocs, updateDbDoc } from "./services/db.services";
import { createFriendItem } from "./pages/chat/chatTemplates";

const form = document.querySelector("form")!;
const emailInput = document.getElementById("email")! as HTMLInputElement;
const passwordInput = document.getElementById("password")! as HTMLInputElement;
const rememberMeCheckbox = document.getElementById("remember-me")!;
const loginButton = document.getElementById("login-btn")!;
const messageBox = document.querySelector(".message-box")! as HTMLElement;
const emailError = document.getElementById("login-email-error")!;
const passwordError = document.getElementById("login-password-error")!;
const friendList = document.querySelector(".friend-list")!;

initializePage();
function initializePage() {
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

async function loadFriends() {
  const users = await getDbDocs("users");

  users.forEach((user) => {
    if (!user.email) return;
    const friendItem = createFriendItem(user.email, user.status || "offline");
    friendList.appendChild(friendItem);
  });
}

loadFriends();
