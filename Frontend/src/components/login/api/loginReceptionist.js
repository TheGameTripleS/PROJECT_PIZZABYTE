const ENVIRONMENT = import.meta.env.MODE;
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const RECEPTIONIST_LOGIN_URL = `${BASE_URL}/receptionist/login`;

export const loginReceptionist = async (email, password) => {
  try {
    if (ENVIRONMENT === "development") {
      console.log("🔓 Receptionist Login - Calling:", RECEPTIONIST_LOGIN_URL);
      console.log("📧 Email:", email);
    }

    const response = await fetch(RECEPTIONIST_LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    
    if (ENVIRONMENT === "development") {
      console.log("✅ Response Status:", response.status);
    }

    const result = await response.json();

    if (!response.ok) {
      if (ENVIRONMENT === "development") {
        console.log("❌ Login Error:", result.message);
      }
      throw new Error(result.message);
    }
    
    if (ENVIRONMENT === "development") {
      console.log("✅ Login Successful:", result.user);
    }
    
    return { success: true, user: result.user };
  } catch (error) {
    if (ENVIRONMENT === "development")
      console.log("Error in loginReceptionist:", error.message);
    return {
      success: false,
      message: error.message || "Server error: failed to login. Please try again later.",
    };
  }
};
