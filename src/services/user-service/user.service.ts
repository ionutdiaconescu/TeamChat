import { User } from './user.service.types';
import { getDbDocs } from './../db-service/db.service';
import { getLoggedInUser } from './../auth-service/auth.service';

// global cache for users
// const userCache = {
//   data: [] as User[],
//   timestamp: 0,
//   duration: 30000,
// };

// Utility: Verify if cache-ul is valid
// const isCacheValid = (): boolean => {
//   return (
//     userCache.data.length > 0 &&
//     Date.now() - userCache.timestamp < userCache.duration
//   );
// };

// Utility: Update cache
// const updateCache = (users: User[]): void => {
//   userCache.data = users;
//   userCache.timestamp = Date.now();
// };

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
  // if (isCacheValid()) {
  //   return userCache.data;
  // }

  const allUsers = (await getDbDocs('users')) as User[];
  // updateCache(allUsers);
  return allUsers;
};

//create debounce function

/**
 * Preload cache with all users at login
 * Improves the performance of subsequent searches
 */

// NOTE: THIS TYPE OF CACHING SHOULD RESIDE IN THE BACK-END, NOT FRONT-END
// export const preloadUsersCache = async (): Promise<void> => {
//   try {
//     console.log(' Pre-loading users cache...');
//     const allUsers = (await getDbDocs('users')) as User[];
//     updateCache(allUsers);
//     console.log(` Cached ${allUsers.length} users`);
//   } catch (error) {
//     console.error(' Failed to preload users cache:', error);
//   }
// };

/**
 *filter the users from existing list by searching term
 */
export const filterUsersBySearchTerm = async (
  users: User[],
  searchTerm: string
): Promise<User[]> => {
  return filterUsers(users, searchTerm);
};

/**
 *Search for users in the database with debouncing
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
 * Invalidate cache for users
 */
// export const invalidateUsersCache = (): void => {
//   userCache.data = [];
//   userCache.timestamp = 0;
// };

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
