import http from "node:http";
import { stringifyJson } from "./json";

export const sendInvalidUserIdError = (res: http.ServerResponse) => {
  res.statusCode = 400;
  res.end(stringifyJson({ message: "Invalid user id" }));
};
