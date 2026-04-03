const ENVIRONMENT = import.meta.env.MODE;

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const ORDERS_API = `${BASE_URL}/api/orders`;

const parseResponse = async (response) => {
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Checkout request failed");
  }

  return result;
};

export const calculateCheckoutTotal = async ({ items, couponCode }) => {
  try {
    const response = await fetch(`${ORDERS_API}/calculate-total`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        items,
        coupon_code: couponCode?.trim() || null,
      }),
    });

    const result = await parseResponse(response);

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    if (ENVIRONMENT === "development") {
      console.log("Error in calculateCheckoutTotal:", error.message);
    }

    return {
      success: false,
      message: error.message || "Failed to calculate checkout total",
    };
  }
};

export const createCheckoutOrder = async ({ order, items, payment }) => {
  try {
    const response = await fetch(ORDERS_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        order,
        items,
        payment,
      }),
    });

    const result = await parseResponse(response);

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    if (ENVIRONMENT === "development") {
      console.log("Error in createCheckoutOrder:", error.message);
    }

    return {
      success: false,
      message: error.message || "Failed to create order",
    };
  }
};
