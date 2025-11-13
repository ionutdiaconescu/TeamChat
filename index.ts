import { onUserAuthStateChanged } from './src/services/auth-service/auth.service';
import { loadHeader } from './src/services/page.service';
import {
  renderLoadingSpinner,
  removeLoadingSpinner,
} from './src/services/loading.service';

initializePage();

function initializePage() {
  loadHeader();
  redirectLoggedInUser();
}

function redirectLoggedInUser(): void {
  const bodyElement = document.body;

  try {
    // Show loading spinner while checking authentication
    renderLoadingSpinner(bodyElement, true);

    // Use Firebase auth state observer for accurate user detection
    onUserAuthStateChanged((user) => {
      // Remove loading spinner
      removeLoadingSpinner(bodyElement);

      if (user) {
        // User is logged in, redirect to chat
        window.location.href = '/src/pages/chat/';
      }
    });
  } catch (error) {
    console.error('Error checking auth state:', error);
    // Remove loading spinner on error
    removeLoadingSpinner(bodyElement);
  }
}
