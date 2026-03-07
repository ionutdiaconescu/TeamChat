import {
  checkIfUserIsLoggedIn,
  sendPasswordReset,
} from "../../services/auth-service/auth.service";
import { loadHeader } from "../../services/page.service";

initializePage();

async function initializePage() {
  loadHeader();
  await checkIfUserIsLoggedIn();
  setupEventListeners();
}

function setupEventListeners() {
  const forgotPasswordBtn = document.getElementById(
    "forgot-password-btn",
  ) as HTMLButtonElement;
  const emailInput = document.getElementById("email") as HTMLInputElement;
  const messageBox = document.querySelector(
    ".message-box",
  ) as HTMLParagraphElement;

  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener("click", async () => {
      const email = emailInput.value.trim();

      if (!email) {
        messageBox.textContent = "Please enter your email address.";
        messageBox.className = "message-box error";
        return;
      }

      // Disable button and show loading
      forgotPasswordBtn.disabled = true;
      forgotPasswordBtn.textContent = "Sending...";
      messageBox.textContent = "";

      try {
        const result = await sendPasswordReset(email);
        messageBox.textContent = result;
        messageBox.className = "message-box success";
        emailInput.value = "";
      } catch (error) {
        messageBox.textContent = "An error occurred. Please try again.";
        messageBox.className = "message-box error";
      } finally {
        // Re-enable button
        forgotPasswordBtn.disabled = false;
        forgotPasswordBtn.textContent = "Send reset link";
      }
    });
  }
}
