const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { jwt } from "better-auth/plugins";

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db(process.env.DB_NAME);

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true, //defaults to true
  },
  session: {
    cookieCache: {
      enabled: true,
      strategy: "jwt",
      maxAge: 60 * 24 * 60 * 60,
    },
  },
  plugins: [jwt()],

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "developer",
        input: true, // <-- IMPORTANT: allows client to send this on sign up
      },
      targetCareer: {
        type: "string",
        required: false,
        input: true, // <-- IMPORTANT: allows client to send this on sign up
      },
    },
  },
});
