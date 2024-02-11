import "dotenv/config";
import http from "node:http";
import { validate as validateUuid } from "uuid";
import { readFromDB, insertToDB, deleteFromDB } from "./fs/index";
import {
  HTTP_METHODS,
  stringifyJson,
  parseJson,
  validateUser,
  sendInvalidUserIdError,
} from "./lib/index";

const PORT = process.env.PORT;

const server = http.createServer();

server.on("request", async (req, res) => {
  const METHOD = req.method as keyof typeof HTTP_METHODS;
  const URL = req.url as string;

  let userId: string | undefined;
  let isValidUserId: boolean | undefined;
  if (URL.startsWith("/api/users")) {
    userId = URL.split("/")[3];
    if (userId) {
      isValidUserId = validateUuid(userId);
    }
  }

  try {
    if (URL.startsWith("/api/users")) {
      /* Get user list */
      if (METHOD === HTTP_METHODS.GET && URL === "/api/users") {
        const data = await readFromDB();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(stringifyJson(data.users));
        return;
      }

      /* Get user by ID */
      if (METHOD === HTTP_METHODS.GET && userId) {
        if (!isValidUserId) {
          sendInvalidUserIdError(res);
          return;
        }
        const data = await readFromDB();
        const user = data.users.find((it) => it.id === userId);
        if (user) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(stringifyJson(user));
        } else {
          res.statusCode = 404;
          res.end(stringifyJson({ message: "User not found" }));
        }
        return;
      }

      /* Create user */
      if (METHOD === HTTP_METHODS.POST && URL === "/api/users") {
        let data = "";
        req.on("data", (chunk) => {
          data += chunk;
        });
        req.on("end", async () => {
          try {
            const user = parseJson(data);
            if (!validateUser(user)) {
              res.statusCode = 400;
              res.end(stringifyJson({ message: "Invalid user data" }));
            } else {
              const newUser = await insertToDB(user);
              res.writeHead(201, { "Content-Type": "application/json" });
              res.end(stringifyJson(newUser));
            }
          } catch (e: any) {
            /* Error parsing user json obj */
            res.statusCode = 500;
            res.end(stringifyJson({ message: e.message }));
          }
        });
        return;
      }

      /* Change user */
      if (METHOD === HTTP_METHODS.PUT && userId) {
        if (!isValidUserId) {
          sendInvalidUserIdError(res);
          return;
        }
        let data = "";
        req.on("data", (chunk) => {
          data += chunk;
        });
        req.on("end", async () => {
          try {
            const updatedUser = parseJson(data);
            /* So all fields are required we should validate user fields */
            if (!validateUser(updatedUser)) {
              res.statusCode = 400;
              res.end(stringifyJson({ message: "Invalid user data" }));
            } else {
              const data = await readFromDB();
              const user = data.users.find((it) => it.id === userId);
              if (user) {
                const deletedUser = await deleteFromDB(user.id);
                const updatedData = {
                  ...deletedUser,
                  ...updatedUser,
                };
                const newUserData = await insertToDB(updatedData);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(stringifyJson(newUserData));
              } else {
                res.statusCode = 404;
                res.end(stringifyJson({ message: "User not found" }));
              }
            }
          } catch (e: any) {
            /* Error parsing user json obj */
            res.statusCode = 500;
            res.end(stringifyJson({ message: e.message }));
          }
        });
        return;
      }
    }

    /* Delete user */
    if (METHOD === HTTP_METHODS.DELETE && userId) {
      if (!isValidUserId) {
        sendInvalidUserIdError(res);
        return;
      }
      const data = await readFromDB();
      const user = data.users.find((it) => it.id === userId);
      if (user) {
        await deleteFromDB(user.id);
        res.statusCode = 204;
        res.end();
      } else {
        res.statusCode = 404;
        res.end(stringifyJson({ message: "User not found" }));
      }
      return;
    }

    /* Resource not found */
    res.statusCode = 404;
    res.end(stringifyJson({ message: "Resource not found" }));
  } catch (e: any) {
    /* Request processing error */
    res.statusCode = 500;
    res.end(stringifyJson({ message: e.message }));
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port - ${PORT}`);
});
