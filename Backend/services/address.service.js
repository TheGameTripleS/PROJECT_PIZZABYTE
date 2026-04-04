import { sql } from "../../Database/db.js";

// Get all addresses
export const getAllAddresses = async () => {
  try {
    const rows = await sql`SELECT * FROM address ORDER BY add_id DESC`;
    return { success: true, addresses: rows };
  } catch (error) {
    console.log("Error in getAllAddresses:", error);
    throw new Error("Database query failed while fetching addresses");
  }
};

// Get address by ID
export const getAddressById = async (addressId) => {
  try {
    const rows = await sql`SELECT * FROM address WHERE add_id = ${addressId}`;
    if (rows.length > 0) {
      return { success: true, address: rows[0] };
    }
    return { success: false, message: "Address not found" };
  } catch (error) {
    console.log("Error in getAddressById:", error);
    throw new Error("Database query failed while fetching address");
  }
};

// Get addresses by customer ID
export const getAddressByCustomerId = async (customerId) => {
  try {
    const rows = await sql`
      SELECT a.* FROM address a
      JOIN customers c ON a.add_id = c.add_id
      WHERE c.cust_id = ${customerId}
    `;
    if (rows.length > 0) {
      return { success: true, address: rows[0] };
    }
    return { success: false, message: "Address not found for this customer" };
  } catch (error) {
    console.log("Error in getAddressByCustomerId:", error);
    throw new Error("Database query failed while fetching customer address");
  }
};

// Create new address
export const createAddress = async (address) => {
  try {
    const { address1, address2, zipcode } = address;
    const rows = await sql`
      INSERT INTO address (address1, address2, zipcode)
      VALUES (${address1 || null}, ${address2 || null}, ${zipcode || null})
      RETURNING *
    `;
    if (rows.length > 0) {
      return { success: true, address: rows[0] };
    }
    return { success: false, message: "Failed to create address" };
  } catch (error) {
    console.log("Error in createAddress:", error);
    throw new Error("Database query failed while creating address");
  }
};

// Update address by ID
export const updateAddress = async (addressId, address) => {
  try {
    const { address1, address2, zipcode } = address;
    const rows = await sql`
      UPDATE address
      SET 
        address1 = COALESCE(${address1 || null}, address1),
        address2 = COALESCE(${address2 || null}, address2),
        zipcode = COALESCE(${zipcode || null}, zipcode)
      WHERE add_id = ${addressId}
      RETURNING *
    `;
    if (rows.length > 0) {
      return { success: true, address: rows[0] };
    }
    return { success: false, message: "Address not found" };
  } catch (error) {
    console.log("Error in updateAddress:", error);
    throw new Error("Database query failed while updating address");
  }
};

// Delete address by ID
export const deleteAddress = async (addressId) => {
  try {
    // Check if address is linked to any customer
    const customers = await sql`SELECT cust_id FROM customers WHERE add_id = ${addressId}`;
    if (customers.length > 0) {
      return { success: false, message: "Cannot delete address linked to customers. Unlink from customers first." };
    }

    const rows = await sql`DELETE FROM address WHERE add_id = ${addressId} RETURNING *`;
    if (rows.length > 0) {
      return { success: true, message: "Address deleted successfully" };
    }
    return { success: false, message: "Address not found" };
  } catch (error) {
    console.log("Error in deleteAddress:", error);
    throw new Error("Database query failed while deleting address");
  }
};

// Unlink address from customer (set customer's add_id to null)
export const unlinkAddressFromCustomer = async (customerId) => {
  try {
    const rows = await sql`
      UPDATE customers
      SET add_id = NULL
      WHERE cust_id = ${customerId}
      RETURNING cust_id
    `;
    if (rows.length > 0) {
      return { success: true, message: "Address unlinked from customer" };
    }
    return { success: false, message: "Customer not found" };
  } catch (error) {
    console.log("Error in unlinkAddressFromCustomer:", error);
    throw new Error("Database query failed while unlinking address");
  }
};

// Link address to customer
export const linkAddressToCustomer = async (customerId, addressId) => {
  try {
    // Verify address exists
    const addressCheck = await sql`SELECT add_id FROM address WHERE add_id = ${addressId}`;
    if (addressCheck.length === 0) {
      return { success: false, message: "Address not found" };
    }

    // Verify customer exists
    const customerCheck = await sql`SELECT cust_id FROM customers WHERE cust_id = ${customerId}`;
    if (customerCheck.length === 0) {
      return { success: false, message: "Customer not found" };
    }

    const rows = await sql`
      UPDATE customers
      SET add_id = ${addressId}
      WHERE cust_id = ${customerId}
      RETURNING cust_id, add_id
    `;
    if (rows.length > 0) {
      return { success: true, message: "Address linked to customer", data: rows[0] };
    }
    return { success: false, message: "Failed to link address" };
  } catch (error) {
    console.log("Error in linkAddressToCustomer:", error);
    throw new Error("Database query failed while linking address");
  }
};
