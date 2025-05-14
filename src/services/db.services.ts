import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import config from "./config.ts";

const firebaseConfig = config.firebase;
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
