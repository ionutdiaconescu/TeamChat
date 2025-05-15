import { register } from "../../services/auth.services.ts";
import {
  validateEmailInput,
  validatePasswordInput,
  validateConfirmPassword,
  addInputValidation,
} from "../../services/validation.service.ts";
import { configureElement } from "../../services/dom.services";
import {
  renderLoadingSpinner,
  removeLoadingSpinner,
} from "../../services/loading.service";
import { DualFieldValidator, RegisterElements } from "../../utils/types";
import { updateDbDoc } from "../../services/db.services.ts";

const elements: RegisterElements = {
  emailInput: document.getElementById("email") as HTMLInputElement,
  passwordInput: document.getElementById("password") as HTMLInputElement,
  confirmPasswordInput: document.getElementById(
    "confirm-password"
  ) as HTMLInputElement,
  registerBtn: document.getElementById("registerBtn") as HTMLButtonElement,
  messageBox: document.querySelector(".message-box") as HTMLDivElement,
  form: document.querySelector(".auth-form") as HTMLFormElement,
  emailError: document.getElementById("register-email-error") as HTMLElement,
  passwordError: document.getElementById(
    "register-password-error"
  ) as HTMLElement,
  confirmPasswordError: document.getElementById(
    "register-confirm-password-error"
  ) as HTMLElement,
  formSection: document.querySelector(".auth-form") as HTMLElement,
};

initializePage();

function initializePage() {
  initializeInputValidation();
  elements.registerBtn?.addEventListener("click", onSubmit);
}
function initializeInputValidation() {
  addInputValidation(
    elements.emailInput,
    validateEmailInput,
    elements.emailError
  );
  addInputValidation(
    elements.passwordInput,
    validatePasswordInput,
    elements.passwordError
  );
  addInputValidation(
    elements.confirmPasswordInput,
    (value) => validateConfirmPassword(value, elements.passwordInput.value),
    elements.confirmPasswordError
  );
}

function onSubmit(e: Event) {
  e.preventDefault();
  if (!validateInputs()) {
    return;
  }
  registerUser();
}

function validateInputs(): boolean {
  const emailErrorMessage = validateEmailInput(elements.emailInput.value);
  const passwordErrorMessage = validatePasswordInput(
    elements.passwordInput.value
  );
  const confirmPasswordErrorMessage = validateConfirmPassword(
    elements.confirmPasswordInput.value,
    elements.passwordInput.value
  );
  const hasErrorMessages =
    emailErrorMessage || passwordErrorMessage || confirmPasswordErrorMessage;

  configureElement(elements.emailError, "message-box", emailErrorMessage);
  configureElement(elements.passwordError, "message-box", passwordErrorMessage);
  configureElement(
    elements.confirmPasswordError,
    "message-box",
    confirmPasswordErrorMessage
  );
  return !hasErrorMessages;
}

async function registerUser() {
  renderLoadingSpinner(elements.formSection);

  try {
    const user = await register({
      email: elements.emailInput.value,
      password: elements.passwordInput.value,
    });
    // await updateUserProfile(user)
    await updateDbDoc("users", user.uid, {
      firebaseAuthId: user.uid,
      email: elements.emailInput.value,
    });
    configureElement(
      elements.messageBox,
      "message-box success",
      "Registration successful"
    );
    // Redirect after 1.5 sec
    setTimeout(() => {
      window.location.href = "/src/pages/chat/index.html";
    }, 1000);
  } catch (error: any) {
    console.error("Error during registration process:", error);
    let errorMessage = "Registration failed. Try again.";

    //  Check if there is already an account created with this email
    if (error?.code) {
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage =
            "This email is already registered. Please log in instead.";
          break;
        case "auth/invalid-email":
          errorMessage = "The email address is not valid.";
          break;
        case "auth/weak-password":
          errorMessage = "Password is too weak. Try a stronger one.";
          break;
      }
    }
    configureElement(elements.messageBox, "message-box error", errorMessage);
  } finally {
    removeLoadingSpinner(elements.formSection); // remove loading spinner}
  }
}
