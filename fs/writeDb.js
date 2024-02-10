import fs from "node:fs";
import { v4 as generateUuid } from "uuid";
import { readDB } from "./readDb.js";
import { getAbsolutePath } from "../lib/index.js";
import { stringifyJson } from "../lib/index.js";

export const writeDB = async (user) => {
  const newUser = {
    id: generateUuid(),
    ...user,
  };
  const filePath = getAbsolutePath(process.env.USER_DB);
  const data = await readDB(filePath);
  if (data.users) data.users?.push(newUser);

  const writeStream = fs.createWriteStream(filePath);
  writeStream.end(stringifyJson(data));

  return new Promise((res, rej) => {
    writeStream.on("finish", () => res(newUser));
    writeStream.on("error", (e) => rej(e));
  });
};
