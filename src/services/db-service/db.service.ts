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
  arrayRemove,
  arrayUnion,
  orderBy,
} from "firebase/firestore";
import {
  GetSingleDbDocFn,
  GetDbDocsFn,
  UpdateDbDocFn,
  AddDbDocFn,
  AddToArrayFieldFn,
  RemoveFromArrayFieldFn,
  FirestoreWhereCondition,
  FirestoreDocument,
} from "./db.service.types.ts";
import { getAuth } from "firebase/auth";

import config from "../../../config.ts";

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
  whereConditions = [],
) => {
  const conditions = whereConditions.map((cond) => where(...cond));

  const queryResults = query(collection(db, collectionName), ...conditions);

  const response = await getDocs(queryResults);

  return response.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const getDbDocsWithOrder = async (
  collectionName: string,
  whereConditions: FirestoreWhereCondition[] = [],
  orderByField: string = "timestamp",
  orderDirection: "asc" | "desc" = "asc",
): Promise<FirestoreDocument[]> => {
  const conditions = whereConditions.map((cond) => where(...cond));
  const orderByClause = orderBy(orderByField, orderDirection);

  const queryResults = query(
    collection(db, collectionName),
    ...conditions,
    orderByClause,
  );

  const response = await getDocs(queryResults);

  return response.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const addDbDoc: AddDbDocFn = async (
  collectionName: string,
  data: Record<string, any>,
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
  updatedFields,
) => {
  const docRef = doc(db, collection, id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    await updateDoc(docRef, { ...updatedFields, timestamp: serverTimestamp() });
  } else {
    await setDoc(docRef, { ...updatedFields, timestamp: serverTimestamp() });
  }
};

export const addToArrayField: AddToArrayFieldFn = async (
  collection,
  id,
  arrayField,
  itemToAdd,
) => {
  const docRef = doc(db, collection, id);
  await updateDoc(docRef, {
    [arrayField]: arrayUnion(itemToAdd),
    timestamp: serverTimestamp(),
  });
};

export const removeFromArrayField: RemoveFromArrayFieldFn = async (
  collection,
  id,
  arrayField,
  itemToDelete,
) => {
  const docRef = doc(db, collection, id);
  await updateDoc(docRef, {
    [arrayField]: arrayRemove(itemToDelete),
  });
};
