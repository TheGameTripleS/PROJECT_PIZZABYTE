import { sql } from "../../Database/db.js";

const syncSequence = async (tableName, columnName) => {
  await sql.query(
    `
      SELECT setval(
        pg_get_serial_sequence($1, $2),
        COALESCE((SELECT MAX(t.${columnName}) FROM ${tableName} AS t), 0) + 1,
        false
      )
    `,
    [tableName, columnName]
  );
};

export const syncIdentitySequences = async () => {
  await syncSequence("orders", "order_id");
  await syncSequence("payment", "transaction_id");
  await syncSequence("order_items", "row_id");
  await syncSequence("stock_log", "log_id");
  console.log("Identity sequences synchronized");
};
