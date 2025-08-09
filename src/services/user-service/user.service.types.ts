export interface User {
  id: string;
  name: string;
  email: string;
  status?: "online" | "offline";
  displayName?: string;
  firebaseAuthId?: string;
  gender?: string;
  friends?: string[];
  lastSeen?: string;
}
