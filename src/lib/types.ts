export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
} as const;

export type User = {
  id: string;
  username: string;
  age: number;
  hobbies: string[] | [];
};

export type Users = {
  users: User[];
};

export const USER_PROP = {
  username: "username",
  age: "age",
  hobbies: "hobbies",
} as const;
