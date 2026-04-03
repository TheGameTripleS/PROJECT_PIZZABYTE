import { neon, Pool } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const { PGUSER, PGPASSWORD, PGHOST, PGDATABASE } = process.env;
const connectionString = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=require&channel_binding=require`;

// creates a sql connection using our env variables and the neon library
export const sql = neon(
    connectionString
);

export const pool = new Pool({
    connectionString,
});
