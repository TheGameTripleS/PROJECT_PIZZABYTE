import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sql }  from "../../Database/db.js";

const secret = process.env.JWT_SECRET;
const expires = process.env.JWT_EXPIRES_IN;

// Helper function to format receptionist data
const formatReceptionistData = (staff) => {
  return {
    id: staff.staff_id,
    staff_id: staff.staff_id,
    email: staff.email,
    fullname: `${staff.first_name || ""} ${staff.last_name || ""}`.trim(),
    position: staff.position,
    role: "receptionist",
  };
};

export const loginReceptionist = async (req, res) => {
  const { email, password } = req.body;

  console.log("🔓 Receptionist Login Request - Email:", email);

  try {
    if (!email || !password) {
      console.log("❌ Missing email or password");
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    // Query the staff table for receptionists with matching email
    const staff = await sql`
      SELECT staff_id, first_name, last_name, email, password, position 
      FROM staff 
      WHERE email = ${email} AND position = 'receptionist'
    `;

    console.log("📊 Staff Query Result - Found:", staff.length, "record(s)");

    if (staff.length === 0) {
      console.log("❌ Receptionist account not found for email:", email);
      return res
        .status(400)
        .json({ success: false, message: "Receptionist account not found" });
    }

    const staffMember = staff[0];

    // Verify password
    const isValid = await bcrypt.compare(password, staffMember.password);
    if (!isValid) {
      console.log("❌ Invalid password for email:", email);
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    console.log("✅ Password verified successfully");

    // Format receptionist data
    const formattedReceptionist = formatReceptionistData(staffMember);

    // Sign JWT token
    const token = jwt.sign(
      {
        email: formattedReceptionist.email,
        id: formattedReceptionist.id,
        role: "receptionist",
      },
      secret,
      { expiresIn: expires || "1d" }
    );

    // Set httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    console.log("✅ Receptionist login successful for:", email);

    return res.status(200).json({
      success: true,
      message: "Receptionist login successful",
      user: formattedReceptionist,
    });
  } catch (error) {
    console.error("❌ Error in loginReceptionist:", error);
    return res.status(500).json({
      success: false,
      message: "Server error: failed to login. Please try again later.",
    });
  }
};
