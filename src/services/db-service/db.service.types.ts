import { WhereFilterOp } from "firebase/firestore";

/**firebase single doc return interface */
export interface GetSingleDbDocFn {
  (collectionName: string, id: string): Promise<FirestoreDocument | null>;
}

/** firebase list doc return interface */
export type FirestoreWhereCondition = [string, WhereFilterOp, any];

export interface GetDbDocsFn {
  (
    collectionName: string,
    whereConditions?: FirestoreWhereCondition[]
  ): Promise<FirestoreDocument[]>;
}

export interface UpdateDbDocFn {
  (
    collection: string,
    id: string,
    updatedFields: Record<string, any>
  ): Promise<void>;
}

export interface AddDbDocFn {
  (collectionName: string, data: Record<string, any>): Promise<string>;
}

export interface FirestoreDocument {
  id: string;
  [key: string]: any;
}

export type AddFriendToUser = (
  userId: string,
  friendId: string
) => Promise<void>;

export type RemoveFriendToUser = (
  userId: string,
  friendId: string
) => Promise<void>;
