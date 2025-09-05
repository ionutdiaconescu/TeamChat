export type RemoveFriendToUser = (
  userId: string,
  friendId: string
) => Promise<void>;
