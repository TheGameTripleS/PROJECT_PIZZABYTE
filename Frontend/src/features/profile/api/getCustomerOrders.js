const ENVIRONMENT = import.meta.env.MODE;
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const getCustomerOrders = async (customerId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/orders/customer/${customerId}`, {
      method: "GET",
      credentials: "include",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch order history");
    }

    return {
      success: true,
      data: result.data || [],
    };
  } catch (error) {
    if (ENVIRONMENT === "development") {
      console.log("Error in getCustomerOrders:", error.message);
    }

    return {
      success: false,
      message: error.message || "Failed to fetch order history",
    };
  }
};
