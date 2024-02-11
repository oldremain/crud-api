import path from "node:path";

export const getAbsolutePath = (destPath: string = "") =>
  path.resolve(destPath);
