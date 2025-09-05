import { getLoggedInUser } from "../auth-service/auth.service";
import {
  addToArrayField,
  getDbDocs,
  getSingleDbDoc,
  removeFromArrayField,
} from "../db-service/db.service";
import { RemoveFriendToUser } from "./friends.service.types";
import {
  getAllUsers,
} from "../user-service/user.service";
import { User } from '../user-service/user.service.types';

export const getFriendsOfCurrentUser = async () => {
  const user = getLoggedInUser();
  if (!user) throw new Error("You are not logged in");

  // take user + friends array
  const userDoc = await getSingleDbDoc("users", user.uid);
  const friendsIds = userDoc?.friends || [];

  if (!friendsIds.length) return [];

  // take all friends users
  const allUsers = await getDbDocs("users");
  const friends = allUsers.filter((userDoc: any) =>
    friendsIds.includes(userDoc.id)
  );

  return friends;
};

export const removeFriendFromUser: RemoveFriendToUser = async (
  userId,
  friendId
) => {
  await removeFromArrayField("users", userId, "friends", friendId);
};

export const addFriendByEmail = async (email: string): Promise<User> => {
  const user = getLoggedInUser();
  if (!user) throw new Error("You are not logged in");
  if (user.email === email) throw new Error("You can't add yourself ");

  //Use local cache instead of searching Firebase every time
  const allUsers = await getAllUsers();
  const friend = allUsers.find((u) => u.email === email);

  if (!friend) throw new Error("Users not found");

  const userDoc = await getSingleDbDoc("users", user.uid);
  const friendsArr = Array.isArray(userDoc?.friends) ? userDoc.friends : [];
  if (friendsArr.includes(friend.id)) {
    throw new Error("User is already your friend");
  }

  //Add the friend id in the friends collection
  await addToArrayField("users", user.uid, "friends", friend.id);
  return friend;
};
