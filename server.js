import "dotenv/config";
import http from "node:http";
import { validate as validateUuid } from "uuid";
import { readDB, writeDB } from "./fs/index.js";
import {
  HTTP_METHODS,
  stringifyJson,
  parseJson,
  validateUser,
} from "./lib/index.js";

const PORT = process.env.PORT || 4000;

const server = http.createServer();

server.on("request", async (req, res) => {
  const METHOD = req.method;
  const URL = req.url;
  let userId;
  if (URL.startsWith("/api/users")) {
    userId = URL.split("/")[3];
  }
  /* Validate user id */
  if (userId) {
    const isValidId = validateUuid(userId);
    if (!isValidId) {
      res.statusCode = 400;
      res.end(stringifyJson({ message: "Invalid user id" }));
    }
  }

  try {
    switch (METHOD) {
      case HTTP_METHODS.GET:
        if (URL === "/api/users") {
          /* Handle getting user list */
          const data = await readDB();
          if (data?.users) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(stringifyJson(data.users));
          }
        } else if (URL.startsWith("/api/users") && userId) {
          /* Handle getting user bu ID */
          const data = await readDB();
          if (data?.users) {
            const user = data.users.find((it) => it.id === userId);
            if (user) {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(stringifyJson(user));
            } else {
              res.statusCode = 404;
              res.end(stringifyJson({ message: "User not found" }));
            }
          }
        } else {
          /* Resource not found */
          res.statusCode = 404;
          res.end(stringifyJson({ message: "Resource not found" }));
        }
        break;

      case HTTP_METHODS.POST:
        /* Create user */
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
              const newUser = await writeDB(user);
              res.writeHead(201, { "Content-Type": "application/json" });
              res.end(stringifyJson(newUser));
            }
          } catch (e) {
            /* Error parsing user json obj */
            res.statusCode = 500;
            res.end(stringifyJson({ message: e.message }));
          }
        });
        break;
    }
  } catch (e) {
    /* Request processing error */
    res.statusCode = 500;
    res.end(stringifyJson({ message: e.message }));
  }
});

server.listen(PORT, () => {
  console.log(`Starting app on port - ${PORT}`);
});
