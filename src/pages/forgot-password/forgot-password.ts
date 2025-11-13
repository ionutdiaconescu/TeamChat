import { checkIfUserIsLoggedIn } from "../../services/auth-service/auth.service";
import { loadHeader } from "../../services/page.service";

initializePage();

async function initializePage() {
  loadHeader();
  await checkIfUserIsLoggedIn();
}
