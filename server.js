import "dotenv/config";
import http from "node:http";
import { validate as validateUuid } from "uuid";
import { readFromDB, insertToDB } from "./fs/index.js";
import {
  HTTP_METHODS,
  stringifyJson,
  parseJson,
  validateUser,
} from "./lib/index.js";
import { deleteFromDB } from "./fs/deleteFromDb.js";

const PORT = process.env.PORT || 4000;

const server = http.createServer();

server.on("request", async (req, res) => {
  const METHOD = req.method;
  const URL = req.url;
  let userId;
  let isValidUserId;
  if (URL.startsWith("/api/users")) {
    userId = URL.split("/")[3];
    if (userId) {
      isValidUserId = validateUuid(userId);
    }
  }
  //TODO check if it needed handle parsing user id before handle routing to avoid repet code
  /* Validate user id */
  // if (userId) {
  //   const isValidId = validateUuid(userId);
  //   if (!isValidId) {
  //     res.statusCode = 400;
  //     res.end(stringifyJson({ message: "Invalid user id" }));
  //     return;
  //   }
  // }

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
          res.statusCode = 400;
          res.end(stringifyJson({ message: "Invalid user id" }));
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
          } catch (e) {
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
          res.statusCode = 400;
          res.end(stringifyJson({ message: "Invalid user id" }));
          return;
        }
        let data = "";
        req.on("data", (chunk) => {
          data += chunk;
        });
        req.on("end", async () => {
          try {
            const updatedUser = parseJson(data);
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
                const newUser = await insertToDB(updatedData);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(stringifyJson(newUser));
              } else {
                res.statusCode = 404;
                res.end(stringifyJson({ message: "User not found" }));
              }
            }
          } catch (e) {
            /* Error parsing user json obj */
            res.statusCode = 500;
            res.end(stringifyJson({ message: e.message }));
          }
        });
        return;
      }
    }

    /* Resource not found */
    res.statusCode = 404;
    res.end(stringifyJson({ message: "Resource not found" }));
  } catch (e) {
    /* Request processing error */
    res.statusCode = 500;
    res.end(stringifyJson({ message: e.message }));
  }
});

server.listen(PORT, () => {
  console.log(`Starting app on port - ${PORT}`);
});
