import { getLoggedInUser } from "../auth-service/auth.service";
import {
  addFriendToUser,
  getDbDocs,
  getSingleDbDoc,
  removeFriendFromUser,
} from "../db-service/db.service";

export const addFriendByEmail = async (email: string) => {
  const user = getLoggedInUser();
  if (!user) throw new Error("You are not logged in");
  if (user.email === email) throw new Error("You can't add yourself ");
  //find user by email
  const users = await getDbDocs("users", [["email", "==", email]]);
  if (!users.length) throw new Error("Users not found");
  const friend = users[0];
  const userDoc = await getSingleDbDoc("users", user.uid);
  const friendsArr = Array.isArray(userDoc?.friends) ? userDoc.friends : [];
  if (friendsArr.includes(friend.id)) {
    throw new Error("User is already your friend");
  }
  //Add the friend id in the friends collection
  await addFriendToUser(user.uid, friend.id);
};
export const removeFriendById = async (friendId: string) => {
  const user = getLoggedInUser();
  if (!user) throw new Error("You are not logged in");
  await removeFriendFromUser(user.uid, friendId);
};
