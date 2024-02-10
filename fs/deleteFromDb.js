import fs from "node:fs";
import { readFromDB } from "./readFromDB.js";
import { getAbsolutePath } from "../lib/index.js";
import { stringifyJson } from "../lib/index.js";

export const deleteFromDB = async (userId) => {
  let deletedUser;
  const filePath = getAbsolutePath(process.env.USER_DB);
  const data = await readFromDB(filePath);
  const idx = data.users?.findIndex((it) => it.id === userId);
  if (idx >= 0) {
    deletedUser = data.users[idx];
    data.users.splice(idx, 1);
    const writeStream = fs.createWriteStream(filePath);
    writeStream.end(stringifyJson(data));

    return new Promise((res, rej) => {
      writeStream.on("finish", () => res(deletedUser));
      writeStream.on("error", (e) => rej(e));
    });
  }

  return Promise.reject("User not found");
};
