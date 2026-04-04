import { sql } from "../../Database/db.js";

const syncSequence = async (tableName, columnName) => {
  try {
    // For each table, we'll get the max ID and set the sequence accordingly
    if (tableName === "orders") {
      const result = await sql`SELECT MAX(order_id) as max_id FROM orders`;
      const maxId = result[0]?.max_id || 0;
      await sql`SELECT setval(pg_get_serial_sequence('orders', 'order_id'), ${maxId + 1}, false)`;
      console.log(`✓ Synced orders.order_id sequence to ${maxId + 1}`);
    } else if (tableName === "payment") {
      const result = await sql`SELECT MAX(transaction_id) as max_id FROM payment`;
      const maxId = result[0]?.max_id || 0;
      await sql`SELECT setval(pg_get_serial_sequence('payment', 'transaction_id'), ${maxId + 1}, false)`;
      console.log(`✓ Synced payment.transaction_id sequence to ${maxId + 1}`);
    } else if (tableName === "order_items") {
      const result = await sql`SELECT MAX(row_id) as max_id FROM order_items`;
      const maxId = result[0]?.max_id || 0;
      await sql`SELECT setval(pg_get_serial_sequence('order_items', 'row_id'), ${maxId + 1}, false)`;
      console.log(`✓ Synced order_items.row_id sequence to ${maxId + 1}`);
    } else if (tableName === "stock_log") {
      const result = await sql`SELECT MAX(log_id) as max_id FROM stock_log`;
      const maxId = result[0]?.max_id || 0;
      await sql`SELECT setval(pg_get_serial_sequence('stock_log', 'log_id'), ${maxId + 1}, false)`;
      console.log(`✓ Synced stock_log.log_id sequence to ${maxId + 1}`);
    } else if (tableName === "ingredients") {
      const result = await sql`SELECT MAX(ing_id) as max_id FROM ingredients`;
      const maxId = result[0]?.max_id || 0;
      await sql`SELECT setval(pg_get_serial_sequence('ingredients', 'ing_id'), ${maxId + 1}, false)`;
      console.log(`✓ Synced ingredients.ing_id sequence to ${maxId + 1}`);
    } else if (tableName === "recipe") {
      const result = await sql`SELECT MAX(row_id) as max_id FROM recipe`;
      const maxId = result[0]?.max_id || 0;
      await sql`SELECT setval(pg_get_serial_sequence('recipe', 'row_id'), ${maxId + 1}, false)`;
      console.log(`✓ Synced recipe.row_id sequence to ${maxId + 1}`);
    }
  } catch (error) {
    console.error(`Error syncing ${tableName}.${columnName}:`, error);
  }
};

export const syncIdentitySequences = async () => {
  console.log("🔄 Starting identity sequences synchronization...");
  await syncSequence("orders", "order_id");
  await syncSequence("payment", "transaction_id");
  await syncSequence("order_items", "row_id");
  await syncSequence("stock_log", "log_id");
  await syncSequence("ingredients", "ing_id");
  await syncSequence("recipe", "row_id");
  console.log("✅ Identity sequences synchronized");
};
