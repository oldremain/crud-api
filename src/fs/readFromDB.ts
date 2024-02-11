import fs from "node:fs";
import { Users, getAbsolutePath, parseJson, stringifyJson } from "../lib/index";

export const readFromDB = async () => {
  const dbTable = getAbsolutePath(process.env.USERS_DB);
  console.log(dbTable);
  const readStream = fs.createReadStream(dbTable, "utf-8");

  let data = "";
  readStream.on("data", (chunk) => {
    data += chunk;
  });

  return new Promise<Users>((res, rej) => {
    readStream.on("end", () => {
      try {
        res(parseJson(data));
      } catch (e: any) {
        rej(e.message);
      }
    });
    readStream.on("error", (e: any) => {
      if (e.code === "ENOENT") {
        const writeStream = fs.createWriteStream(dbTable);
        const newTable = { users: [] };
        writeStream.end(stringifyJson(newTable));
        writeStream.on("finish", () => res(newTable));
        writeStream.on("error", (e) => rej(e.message));
      } else {
        rej(e.message);
      }
    });
  });
};
