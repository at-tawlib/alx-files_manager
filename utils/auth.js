import dbClient from "./db";
import redisClient from "./redis";

export function getSessionToken(request) {
  const xHeader = request.headers['x-token'];
  if (!xHeader) { return null; }
  return xHeader;
}

export async function getUserFromSession(token) {
  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) { return null; }
  const user = await dbClient.getUserById(userId);
  if (!user) { return null; }
  return { email: user.email, id: user._id };
}

export async function getCurrentUser(request) {
  const token = getSessionToken(request);
  if (!token) { return null; }
  const user = await getUserFromSession(token);
  if (!user) { return null; }
  return user;
}
