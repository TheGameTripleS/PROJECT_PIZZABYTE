import { sql } from "../../Database/db.js"; // Adjust the path to your db.js

export const getUserByEmail = async (email) => {
  try {
    // JOIN customers with address to get the full profile
    const rows = await sql`
      SELECT c.*, a.address1, a.address2, a.zipcode 
      FROM customers c
      LEFT JOIN address a ON c.add_id = a.add_id
      WHERE c.email = ${email}
    `;
    if (rows.length > 0) {
      return { success: true, user: rows[0] };
    }
    return { success: false };
  } catch (error) {
    console.log("Error in getUserByEmail:", error);
    throw new Error("Database query failed while fetching user by email");
  }
};

export const getUserEmail = async (email) => {
  try {
    const rows = await sql`SELECT * FROM customers WHERE email = ${email}`;
    if (rows.length > 0) return { success: true };
    return { success: false };
  } catch (error) {
    console.log("Error in getUserEmail:", error);
    throw new Error("Database query failed while fetching user's email");
  }
};

export const createUser = async (user) => {
  try {
    // Note: If your frontend sends "fullname", we split it for your DB.
    const [firstName, ...lastNameArr] = user.fullname ? user.fullname.split(' ') : ["", ""];
    const lastName = lastNameArr.join(' ');

    // Create address record if address data is provided
    let addId = null;
    if (user.address1 || user.address2 || user.zipcode) {
      const addressRows = await sql`
        INSERT INTO address (address1, address2, zipcode)
        VALUES (${user.address1 || null}, ${user.address2 || null}, ${user.zipcode || null})
        RETURNING add_id
      `;
      if (addressRows.length > 0) {
        addId = addressRows[0].add_id;
      }
    }

    // Create customer with address reference
    await sql`
      INSERT INTO customers (first_name, last_name, email, phone, password, add_id)
      VALUES (${firstName}, ${lastName}, ${user.email}, ${user.number}, ${user.hashed_password}, ${addId})
    `;
    console.log("User created successfully");
    return { success: true };
  } catch (error) {
    console.log("Error in createUser:", error);
    throw new Error("Database query failed while creating the user");
  }
};

export const deleteUser = async (id) => {
  try {
    const rows = await sql`DELETE FROM customers WHERE cust_id = ${id} RETURNING *`;
    if (rows.length > 0) return { success: true };
    return { success: false };
  } catch (error) {
    console.log("Error in deleteUser:", error);
    throw new Error("Database query failed while deleting user");
  }
};

export const updateUser = async (targetEmail, user) => {
    // Updating data when tables are normalized (separated) is complex. 
    try {
      const [firstName, ...lastNameArr] = user.fullname ? user.fullname.split(' ') : [null, null];
      const lastName = lastNameArr.length ? lastNameArr.join(' ') : null;

      // First, get the customer to check if they have an address
      const customerRows = await sql`
        SELECT cust_id, add_id FROM customers WHERE email = ${targetEmail}
      `;

      if (customerRows.length === 0) {
        return { success: false };
      }

      const custId = customerRows[0].cust_id;
      let currentAddId = customerRows[0].add_id;

      // Handle address update/creation
      if (user.address1 || user.address2 || user.zipcode) {
        if (currentAddId) {
          // Update existing address
          await sql`
            UPDATE address 
            SET 
              address1 = COALESCE(${user.address1 || null}, address1),
              address2 = COALESCE(${user.address2 || null}, address2),
              zipcode = COALESCE(${user.zipcode || null}, zipcode)
            WHERE add_id = ${currentAddId}
          `;
        } else {
          // Create new address
          const addressRows = await sql`
            INSERT INTO address (address1, address2, zipcode)
            VALUES (${user.address1 || null}, ${user.address2 || null}, ${user.zipcode || null})
            RETURNING add_id
          `;
          if (addressRows.length > 0) {
            currentAddId = addressRows[0].add_id;
          }
        }
      }

      // Update customer info
      const rows = await sql`
        UPDATE customers 
        SET 
          first_name = COALESCE(${firstName}, first_name),
          last_name = COALESCE(${lastName}, last_name),
          phone = COALESCE(${user.number}, phone),
          add_id = COALESCE(${currentAddId}, add_id)
        WHERE email = ${targetEmail}
        RETURNING *
      `;
      
      if (rows.length > 0) {
        // Fetch the full user data with address joined
        const fullUserRows = await sql`
          SELECT c.*, a.address1, a.address2, a.zipcode 
          FROM customers c
          LEFT JOIN address a ON c.add_id = a.add_id
          WHERE c.cust_id = ${custId}
        `;
        if (fullUserRows.length > 0) {
          return { success: true, user: fullUserRows[0] };
        }
        return { success: true, user: rows[0] };
      }
      return { success: false };
    } catch (error) {
      console.log("Error in updateUser:", error);
      throw new Error("Database query failed while updating the user");
    }
};

// Delete user's address by email
export const deleteUserAddress = async (targetEmail) => {
  try {
    // Get the customer and their address ID
    const customerRows = await sql`
      SELECT cust_id, add_id FROM customers WHERE email = ${targetEmail}
    `;

    if (customerRows.length === 0) {
      return { success: false, message: "User not found" };
    }

    const custId = customerRows[0].cust_id;
    const addId = customerRows[0].add_id;

    // If no address exists, return success
    if (!addId) {
      return { success: true, message: "No address to delete" };
    }

    // Unlink address from customer
    await sql`
      UPDATE customers
      SET add_id = NULL
      WHERE cust_id = ${custId}
    `;

    // Delete the address record if it's not linked to any other customer
    const linkedCustomers = await sql`
      SELECT COUNT(*) as count FROM customers WHERE add_id = ${addId}
    `;

    if (linkedCustomers[0].count === 0) {
      await sql`DELETE FROM address WHERE add_id = ${addId}`;
    }

    // Fetch updated user data
    const fullUserRows = await sql`
      SELECT c.*, a.address1, a.address2, a.zipcode 
      FROM customers c
      LEFT JOIN address a ON c.add_id = a.add_id
      WHERE c.cust_id = ${custId}
    `;

    if (fullUserRows.length > 0) {
      return { success: true, message: "Address deleted successfully", user: fullUserRows[0] };
    }

    return { success: true, message: "Address deleted successfully" };
  } catch (error) {
    console.log("Error in deleteUserAddress:", error);
    throw new Error("Database query failed while deleting user address");
  }
};

export const getAllCustomers = async () => {
  try {
    const rows = await sql`SELECT * FROM customers`;
    return rows;
  } catch (error) {
    console.log("Error in getAllCustomers:", error);
    throw new Error("Database query failed while fetching customers");
  }
};

export const getAllStaff = async () => {
  try {
    const rows = await sql`SELECT * FROM staff`;
    return rows;
  } catch (error) {
    console.log("Error in getAllStaff:", error);
    throw new Error("Database query failed while fetching staff");
  }
};
