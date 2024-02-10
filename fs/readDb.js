import fs from "node:fs";
import { getAbsolutePath } from "../lib/index.js";
import { parseJson } from "../lib/index.js";

export const readDB = async () => {
  const dbTable = getAbsolutePath(process.env.USER_DB);
  const readStream = fs.createReadStream(dbTable, "utf-8");

  let data = "";
  readStream.on("data", (chunk) => {
    data += chunk;
  });

  return new Promise((res, rej) => {
    readStream.on("end", () => {
      try {
        res(parseJson(data));
      } catch (e) {
        rej(e.message);
      }
    });
    readStream.on("error", (e) => rej(e));
  });
};
