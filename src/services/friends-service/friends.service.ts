import { getLoggedInUser } from "../auth-service/auth.service";
import { getDbDocs, getSingleDbDoc } from "../db-service/db.service";

export const getFriendsOfCurrentUser = async () => {
  const user = getLoggedInUser();
  if (!user) throw new Error("You are not logged in");

  //  take user + friends array
  const userDoc = await getSingleDbDoc("users", user.uid);
  const friendsIds = userDoc?.friends || [];

  if (!friendsIds.length) return [];

  // take all friends users
  const allUsers = await getDbDocs("users");
  const friends = allUsers.filter((friendDoc: any) =>
    friendsIds.includes(friendDoc.id)
  );

  return friends;
};
