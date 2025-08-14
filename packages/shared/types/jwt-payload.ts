export type JwtPayload = {
  sub: string; // User ID
  username: string; // User's username
  name: string | null; // User's name
  email: string; // User's email
};
