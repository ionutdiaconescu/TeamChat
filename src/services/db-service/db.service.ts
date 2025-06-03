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
} from "firebase/firestore";
import {
  GetSingleDbDocFn,
  GetDbDocsFn,
  UpdateDbDocFn,
} from "./db.service.types.ts";

import config from "../../../config.ts";

const firebaseConfig = config.firebase;
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

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

  const q = query(collection(db, collectionName), ...conditions);

  const response = await getDocs(q);

  return response.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
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
