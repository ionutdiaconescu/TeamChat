import { onUserAuthStateChanged } from "./src/services/auth-service/auth.service";
import {
  renderLoadingSpinner,
  removeLoadingSpinner,
} from "./src/services/loading.service";

initializePage();

async function initializePage() {
  const bodyElement = document.body;
  const landingPage = document.getElementById("landing-page");

  try {
    // Show loading spinner while checking authentication
    renderLoadingSpinner(bodyElement);

    // Use Firebase auth state observer for accurate user detection
    onUserAuthStateChanged((user) => {
      // Remove loading spinner
      removeLoadingSpinner(bodyElement);

      if (user) {
        // User is logged in, redirect to chat
        window.location.href = "/src/pages/chat/";
      } else {
        // User is not logged in, show landing page
        if (landingPage) {
          landingPage.classList.remove("hidden");
        }
      }
    });
  } catch (error) {
    console.error("Error checking auth state:", error);
    // Remove loading spinner on error
    removeLoadingSpinner(bodyElement);

    // Show landing page as fallback
    if (landingPage) {
      landingPage.classList.remove("hidden");
    }
  }
}
