const ENVIRONMENT = import.meta.env.MODE;
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const validateReceptionistJWT = async () => {
  try {
    const response = await fetch(`${BASE_URL}/receptionist/validate`, {
      method: "GET",
      credentials: "include",
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message);
    }
    return { success: true, user: result.user };
  } catch (error) {
    if (ENVIRONMENT === "development") {
      console.log("Error validating receptionist JWT:", error.message);
    }
    return { success: false };
  }
};
