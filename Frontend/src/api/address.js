const ENVIRONMENT = import.meta.env.MODE;
import { BASE_URL } from "../data/constants";

const ADDRESSES_API = `${BASE_URL}/addresses`;

// Get all addresses (admin only typically)
export const getAllAddresses = async () => {
  try {
    const response = await fetch(ADDRESSES_API, {
      method: "GET",
      credentials: "include",
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message);
    }
    return { success: true, addresses: result.addresses };
  } catch (error) {
    if (ENVIRONMENT === "development") console.log("Error in getAllAddresses:", error.message);
    return { success: false, message: "Failed to fetch addresses" };
  }
};

// Get single address by ID
export const getAddressById = async (addressId) => {
  try {
    const response = await fetch(`${ADDRESSES_API}/${addressId}`, {
      method: "GET",
      credentials: "include",
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message);
    }
    return { success: true, address: result.address };
  } catch (error) {
    if (ENVIRONMENT === "development") console.log("Error in getAddressById:", error.message);
    return { success: false, message: "Failed to fetch address" };
  }
};

// Get address by customer ID
export const getAddressByCustomerId = async (customerId) => {
  try {
    const response = await fetch(`${ADDRESSES_API}/customer/${customerId}`, {
      method: "GET",
      credentials: "include",
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message);
    }
    return { success: true, address: result.address };
  } catch (error) {
    if (ENVIRONMENT === "development") console.log("Error in getAddressByCustomerId:", error.message);
    return { success: false, message: "Failed to fetch customer address" };
  }
};

// Create new address
export const createAddress = async (addressData) => {
  try {
    const response = await fetch(ADDRESSES_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(addressData),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message);
    }
    return { success: true, address: result.address };
  } catch (error) {
    if (ENVIRONMENT === "development") console.log("Error in createAddress:", error.message);
    return { success: false, message: "Failed to create address" };
  }
};

// Update address
export const updateAddress = async (addressId, addressData) => {
  try {
    const response = await fetch(`${ADDRESSES_API}/${addressId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(addressData),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message);
    }
    return { success: true, address: result.address };
  } catch (error) {
    if (ENVIRONMENT === "development") console.log("Error in updateAddress:", error.message);
    return { success: false, message: "Failed to update address" };
  }
};

// Delete address
export const deleteAddress = async (addressId) => {
  try {
    const response = await fetch(`${ADDRESSES_API}/${addressId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message);
    }
    return { success: true, message: result.message };
  } catch (error) {
    if (ENVIRONMENT === "development") console.log("Error in deleteAddress:", error.message);
    return { success: false, message: "Failed to delete address" };
  }
};

// Link address to customer
export const linkAddressToCustomer = async (customerId, addressId) => {
  try {
    const response = await fetch(`${ADDRESSES_API}/link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ customerId, addressId }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message);
    }
    return { success: true, message: result.message, data: result.data };
  } catch (error) {
    if (ENVIRONMENT === "development") console.log("Error in linkAddressToCustomer:", error.message);
    return { success: false, message: "Failed to link address to customer" };
  }
};

// Unlink address from customer
export const unlinkAddressFromCustomer = async (customerId) => {
  try {
    const response = await fetch(`${ADDRESSES_API}/unlink/${customerId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message);
    }
    return { success: true, message: result.message };
  } catch (error) {
    if (ENVIRONMENT === "development") console.log("Error in unlinkAddressFromCustomer:", error.message);
    return { success: false, message: "Failed to unlink address from customer" };
  }
};
