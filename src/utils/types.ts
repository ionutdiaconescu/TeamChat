import { WhereFilterOp } from "firebase/firestore";

export type InputValidator = (value: string) => string;

export type DualFieldValidator = (value: string, compareTo: string) => string;

export interface RegisterElements {
  emailInput: HTMLInputElement;
  passwordInput: HTMLInputElement;
  confirmPasswordInput: HTMLInputElement;
  registerBtn: HTMLButtonElement;
  messageBox: HTMLDivElement;
  form: HTMLFormElement;
  formSection: HTMLElement;
  emailError: HTMLElement;
  passwordError: HTMLElement;
  confirmPasswordError: HTMLElement;
}
export interface AuthCredentials {
  email: string;
  password: string;
}

export interface FirestoreDocument {
  id: string;
  [key: string]: any;
}

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
