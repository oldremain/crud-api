import { type User, USER_PROP } from "./types";

export const validateUser = (user: User) => {
  /* Check required prop */
  const hasRequiredProps =
    Object.keys(USER_PROP).length === Object.keys(user).length;
  if (!hasRequiredProps) return false;

  /* Validate existent props in user */
  let isValidUser;
  for (const prop in user) {
    switch (prop) {
      case USER_PROP.username:
        isValidUser =
          typeof user.username === "string" && Boolean(user.username?.trim());
        break;
      case USER_PROP.age:
        isValidUser = typeof user.age === "number" && user.age && user.age > 0;
        break;
      case USER_PROP.hobbies:
        if (!Array.isArray(user.hobbies)) {
          isValidUser = false;
        } else {
          isValidUser =
            !user.hobbies.length ||
            user.hobbies.every((it) => typeof it === "string");
        }
        break;
      default:
        /* Unknown property */
        isValidUser = false;
    }
    if (!isValidUser) return false;
  }
  return isValidUser;
};
