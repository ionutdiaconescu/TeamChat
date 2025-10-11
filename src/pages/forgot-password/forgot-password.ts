import { checkIfUserIsLoggedIn } from "../../services/auth-service/auth.service";
import { loadGuestHeader } from "../../services/page.service";

initializePage();

async function initializePage() {
  loadGuestHeader();
  await checkIfUserIsLoggedIn();
}
