import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  query,
  collection,
  where,
  serverTimestamp,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  GetSingleDbDocFn,
  GetDbDocsFn,
  UpdateDbDocFn,
  AddDbDocFn,
} from "./db.service.types.ts";
import { getAuth } from "firebase/auth";

import config from "../../../config.ts";
import { getLoggedInUser } from "../auth-service/auth.service.ts";

const firebaseConfig = config.firebase;
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const getSingleDbDoc: GetSingleDbDocFn = async (collectionName, id) => {
  const docRef = doc(db, collectionName, id);
  const docSnapshot = await getDoc(docRef);

  if (docSnapshot.exists()) {
    return {
      id: docSnapshot.id,
      ...docSnapshot.data(),
    };
  } else {
    return null;
  }
};

export const getDbDocs: GetDbDocsFn = async (
  collectionName,
  whereConditions = []
) => {
  const conditions = whereConditions.map((cond) => where(...cond));

  const queryResults = query(collection(db, collectionName), ...conditions);

  const response = await getDocs(queryResults);

  return response.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const addDbDoc: AddDbDocFn = async (
  collectionName: string,
  data: Record<string, any>
): Promise<string> => {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    timestamp: serverTimestamp(),
  });
  return docRef.id;
};

export const updateDbDoc: UpdateDbDocFn = async (
  collection,
  id,
  updatedFields
) => {
  const docRef = doc(db, collection, id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    await updateDoc(docRef, { ...updatedFields, timestamp: serverTimestamp() });
  } else {
    await setDoc(docRef, { ...updatedFields, timestamp: serverTimestamp() });
  }
};

export const findUserByEmail = async (
  email: string
): Promise<{ id: string; name: string; email: string }> => {
  const users = await getDbDocs("users", [["email", "==", email]]);
  if (users.length === 0) throw new Error("The user does not exist.");

  const user = users[0];

  if (!user.name || !user.email) {
    throw new Error("User data is incomplete.");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
};

export const getFriendsOfCurrentUser = async () => {
  const user = getLoggedInUser();
  if (!user) throw new Error("You are not logged in");

  // 1. Added friends
  const friendsCol = collection(db, "users", user.uid, "friends");
  const snapshot = await getDocs(friendsCol);
  const friends = snapshot.docs.map((doc) => doc.data());

  // 2. Logged in user (me)
  const self = {
    id: user.uid,
    name: user.displayName || user.email || "Anonim",
    email: user.email,
    status: "online",
  };

  // 3. Return logged in user + added friends
  return [self, ...friends];
};

export const addFriendDoc = async (friend: {
  id: string;
  name: string;
  email: string;
}) => {
  const user = getLoggedInUser();
  if (!user) throw new Error("You are not logged in");

  const friendRef = doc(
    collection(db, "users", user.uid, "friends"),
    friend.id
  );
  await setDoc(friendRef, {
    id: friend.id,
    name: friend.name,
    email: friend.email,
    status: "offline",
  });
};

export const removeFriendDoc = async (friendId: string) => {
  const currentUser = getLoggedInUser();
  if (!currentUser) throw new Error("You are not logged in");
  const ref = doc(db, "users", currentUser.uid, "friends", friendId);
  await deleteDoc(ref);
};
