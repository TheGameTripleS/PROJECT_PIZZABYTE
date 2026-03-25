import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";

import itemRoutes from "./routes/itemRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import { sql } from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const SERVER_RUN_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.get("/api/meta/run-id", (_req, res) => {
  res.status(200).json({ success: true, runId: SERVER_RUN_ID });
});

app.use("/api/items", itemRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/staff", staffRoutes);

async function testQuery() {
  try {
    const result = await sql`
        SELECT
            o.order_id,
            oi.total_cost,
            oi.item_quantity,
            i.category,
            i.item_name,
            o.created_at,
            a.address1,
            a.address2,
            a.zipcode,
            o.service_type
        FROM
            orders o
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            LEFT JOIN item i ON oi.item_id = i.item_id
            LEFT JOIN address a ON o.add_id = a.add_id;
    `;

    console.table(result.slice(0, 10));
    console.log("Database query successful");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

testQuery().then(() => {
    app.listen(PORT, () => {
        console.log("Server is running on port " + PORT);
    });
});
