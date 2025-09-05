import { User } from './user.service.types';
import { getDbDocs } from './../db-service/db.service';
import { getLoggedInUser } from './../auth-service/auth.service';

// Utility: general filter for users
const filterUsers = (
  users: User[],
  searchTerm: string,
  excludeUserId?: string
): User[] => {
  if (!searchTerm.trim()) return users;

  const lowerSearchTerm = searchTerm.toLowerCase();

  return users.filter((user) => {
    // excludes the current user if specified
    if (
      excludeUserId &&
      (user.id === excludeUserId || user.firebaseAuthId === excludeUserId)
    ) {
      return false;
    }

    // search by name and email
    const matchesName = user.name?.toLowerCase().includes(lowerSearchTerm);
    const matchesEmail = user.email?.toLowerCase().includes(lowerSearchTerm);

    return matchesName || matchesEmail;
  });
};

// Utility: get all the users (with cache)
export const getAllUsers = async (): Promise<User[]> => {
  return (await getDbDocs('users')) as User[];
};

/**
 * Filter the users from existing list by searching term
 */
export const filterUsersBySearchTerm = (
  users: User[],
  searchTerm: string
): User[] => {
  return filterUsers(users, searchTerm);
};

/**
 * Search for users in the database with debouncing
 * Exclude current user from results
 */

export const searchUsersInDatabase = async (
  searchTerm: string
): Promise<User[]> => {
  const currentUser = getLoggedInUser();
  if (!currentUser) {
    throw new Error('Nu ești logat');
  }

  const allUsers = await getAllUsers();
  return filterUsers(allUsers, searchTerm, currentUser.uid);
};

/**
 * Get users by specific criteria (reusable)
 */
export const getUsersByCriteria = async (
  searchTerm?: string,
  excludeCurrentUser: boolean = true,
  useCache: boolean = true
): Promise<User[]> => {
  const currentUser = getLoggedInUser();

  // Get users
  const allUsers = useCache
    ? await getAllUsers()
    : ((await getDbDocs('users')) as User[]);

  // Apply filters
  let filteredUsers = allUsers;

  if (searchTerm) {
    filteredUsers = filterUsers(filteredUsers, searchTerm);
  }

  if (excludeCurrentUser && currentUser) {
    filteredUsers = filteredUsers.filter(
      (user) =>
        user.id !== currentUser.uid && user.firebaseAuthId !== currentUser.uid
    );
  }

  return filteredUsers;
};
