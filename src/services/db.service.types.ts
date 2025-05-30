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
export interface FirestoreDocument {
  id: string;
  [key: string]: any;
}
