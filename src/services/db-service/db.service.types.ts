import { WhereFilterOp } from "firebase/firestore";

/**firebase single doc return interface */
export interface GetSingleDbDocFn {
  (collectionName: string, id: string): Promise<FirestoreDocument | null>;
}

/** firebase list doc return interface */
export type FirestoreWhereCondition = [string, WhereFilterOp, any];

export interface FirestoreDocument {
  id: string;
  [key: string]: any;
}

export interface GetDbDocsFn {
  (
    collectionName: string,
    whereConditions?: FirestoreWhereCondition[],
  ): Promise<FirestoreDocument[]>;
}

export interface GetDbDocsWithOrderFn {
  (
    collectionName: string,
    whereConditions?: FirestoreWhereCondition[],
    orderByField?: string,
    orderDirection?: "asc" | "desc",
  ): Promise<FirestoreDocument[]>;
}

export interface UpdateDbDocFn {
  (
    collection: string,
    id: string,
    updatedFields: Record<string, any>,
  ): Promise<void>;
}

export interface AddDbDocFn {
  (collectionName: string, data: Record<string, any>): Promise<string>;
}

export type AddToArrayFieldFn = (
  collection: string,
  id: string,
  arrayField: string,
  itemToAdd: any,
) => Promise<void>;

export type RemoveFromArrayFieldFn = (
  collection: string,
  id: string,
  arrayField: string,
  itemToDelete: any,
) => Promise<void>;
