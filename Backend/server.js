import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

// 1. Import Routes (Notice the .js extensions)
import itemRoutes from "./routes/itemRoutes.js"; // From server.js
import indexRouter from "./routes/index.route.js"; // From index.mjs
import authRoutes from "./routes/authRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import ingredientRoutes from "./routes/ingredientRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";

// 2. Import Database Connection
import { sql } from "../Database/db.js"; // From server.js

dotenv.config();

const app = express();
app.set("trust proxy", 1); // Needed if hosted behind a proxy (from index.mjs)

const PORT = process.env.PORT || 3000;

// 3. Configure CORS (Combining your logic)
const allowedOrigins =
  process.env.NODE_ENV === "production" 
    ? ["https://pizza-time-with-react.vercel.app"] 
    : ["http://localhost:5173", "http://localhost:5174"]; // Added extra local port just in case

// 4. Global Middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // Crucial for cookies to work (from index.mjs)
  })
);
app.use(express.json());
app.use(cookieParser()); // For reading JWT tokens (from index.mjs)
app.use(helmet());       // Security headers (from server.js)
app.use(morgan("dev"));  // Request logging (from server.js)

// 5. Apply Routes
app.use("/api/items", itemRoutes); // Your custom item routes
app.use("/", indexRouter);         // Your users, captcha, and shortener routes
app.use("/api/auth", authRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/ingredients", ingredientRoutes);
app.use("/api/expenses", expenseRoutes);

// 6. Global 404 Handler (from index.mjs)
app.use((req, res) => {
  res.status(404).json({ success: false, message: "404 - Not Found!" });
});

// 7. Database Test Query & Server Initialization (from server.js)
async function testQuery() {
  try {
    const result = await sql`
        SELECT
            o.order_id,
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

    // Only log the first 2 just to show it works without cluttering the terminal
    console.table(result.slice(0, 2)); 
    console.log("Database query successful");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

// Start the server only after attempting the DB connection
testQuery().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
});