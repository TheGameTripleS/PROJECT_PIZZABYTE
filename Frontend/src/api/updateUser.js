const ENVIRONMENT = import.meta.env.MODE;
import { UPDATE_URL, USERS_URL } from "../data/constants";

export const updateUser = async (user) => {
  try {
    const response = await fetch(UPDATE_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(user),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message);
    }
    return { success: true, user: result.data };
  } catch (error) {
    if (ENVIRONMENT === "development") console.log("Error in updateUser:", error.message);
    return { success: false, message: "Server error: failed to update profile. Please try again later." };
  }
};

export const deleteUserAddress = async () => {
  try {
    const response = await fetch(`${USERS_URL}/address/delete`, {
      method: "DELETE",
      credentials: "include",
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message);
    }
    return { success: true, message: result.message, user: result.user };
  } catch (error) {
    if (ENVIRONMENT === "development") console.log("Error in deleteUserAddress:", error.message);
    return { success: false, message: "Server error: failed to delete address. Please try again later." };
  }
};

export const getStatistics = async () => {
  try {
    const response = await fetch(`${USERS_URL}/stats/get`, {
      method: "GET",
      credentials: "include",
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message);
    }
    return { success: true, data: result.data };
  } catch (error) {
    if (ENVIRONMENT === "development") console.log("Error in getStatistics:", error.message);
    return { success: false, message: "Server error: failed to fetch statistics. Please try again later." };
  }
};
