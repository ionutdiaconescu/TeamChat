export type RemoveFriendToUser = (
  userId: string,
  friendId: string
) => Promise<void>;

export type AddFriendToUser = (
  userId: string,
  friendId: string
) => Promise<void>;
