import fs from "node:fs";
import { v4 as generateUuid } from "uuid";
import { readFromDB } from "./readFromDB";
import { User, getAbsolutePath, stringifyJson } from "../lib/index";

export const insertToDB = async (user: Omit<User, "id">) => {
  const newUser = {
    id: generateUuid(),
    ...user,
  } as User;
  const filePath = getAbsolutePath(process.env.USERS_DB);
  const data = await readFromDB();
  if (data.users) data.users.push(newUser);

  const writeStream = fs.createWriteStream(filePath);
  writeStream.end(stringifyJson(data));

  return new Promise<User>((res, rej) => {
    writeStream.on("finish", () => res(newUser));
    writeStream.on("error", (e) => rej(e));
  });
};
