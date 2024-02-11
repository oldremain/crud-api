import fs from "node:fs";
import { readFromDB } from "./readFromDB";
import { getAbsolutePath, stringifyJson, type User } from "../lib/index";

export const deleteFromDB = async (userId: string) => {
  let deletedUser: User | undefined;
  const filePath = getAbsolutePath(process.env.USERS_DB);
  const data = await readFromDB();
  const idx = data.users?.findIndex((it) => it.id === userId);
  if (idx >= 0) {
    deletedUser = data.users[idx];
    data.users.splice(idx, 1);
    const writeStream = fs.createWriteStream(filePath);
    writeStream.end(stringifyJson(data));

    return new Promise<User | undefined>((res, rej) => {
      writeStream.on("finish", () => res(deletedUser));
      writeStream.on("error", (e) => rej(e));
    });
  }

  return Promise.reject("User not found");
};
