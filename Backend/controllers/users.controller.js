import * as userServices from "../services/users.service.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
const secret = process.env.JWT_SECRET;
const expires = process.env.JWT_EXPIRES_IN;

// Helper function to format user data consistently
const formatUserData = (dbUser) => {
  return {
    id: dbUser.cust_id,
    email: dbUser.email,
    fullname: `${dbUser.first_name || ""} ${dbUser.last_name || ""}`.trim(),
    number: dbUser.phone,
    address1: dbUser.address1 || "",
    address2: dbUser.address2 || "",
    zipcode: dbUser.zipcode || "",
    role: dbUser.role || "customer",
  };
};

export const authToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "No token found" });
  }
  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    console.log(error);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
export const authUser = async (req, res) => {
  const userEmail = req.user.email;
  const userRole = req.user.role;

  try {
    if (userEmail === process.env.ADMIN_EMAIL && userRole === "admin") {
      return res.status(200).json({
        message: "Authenticated as Admin",
        user: { 
          id: "admin-1", 
          email: process.env.ADMIN_EMAIL, 
          fullname: "System Admin", 
          role: "admin" 
        },
      });
    }

    const response = await userServices.getUserByEmail(userEmail);
    if (!response.success) {
      return res.status(400).json({ message: "User doesn't exist" });
    }
    const dbUser = response.user;
    const formattedUser = formatUserData(dbUser);
    return res.status(200).json({
      message: "Authenticated",
      user: formattedUser,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Something went wrong with user authentication" });
  }
};
export const logoutUser = (_, res) => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 0,
    });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Something went wrong during logout" });
  }
};
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const adminUser = {
        id: "admin-1", // Fake ID for the frontend
        email: process.env.ADMIN_EMAIL,
        fullname: "System Admin",
        role: "admin", // <-- THIS IS CRUCIAL
      };

      // Sign JWT for Admin
      const token = jwt.sign(
        { email: adminUser.email, id: adminUser.id, role: "admin" },
        secret,
        { expiresIn: expires }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        message: "Admin Login successful",
        user: adminUser,
      });
    }

    const response = await userServices.getUserByEmail(email);
    if (!response.success) {
      return res.status(400).json({ message: "User doesn't exist" });
    }
    const dbUser = response.user;
    const isValid = await bcrypt.compare(password, dbUser.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const formattedUser = formatUserData(dbUser);
    const token = jwt.sign(
      { email: formattedUser.email, id: formattedUser.id, role: formattedUser.role },
      secret,
      {
        expiresIn: expires || "1d",
      },
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      message: "Login successful",
      user: formattedUser,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Something went wrong during login" });
  }
};
export const createUser = async (req, res) => {
  const user = req.body;
  const { email, password } = req.body;
  try {
    const response = await userServices.getUserEmail(email);
    if (response.success) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    delete user.password;
    const userWithHash = { ...user, hashed_password: hashedPassword, id: id };
    const newUser = await userServices.createUser(userWithHash);
    if (newUser.success) {
      return res.status(200).json({ message: "User created successfully" });
    }
    return res.status(400).json({ message: "User could not be created" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Something went wrong during user creation" });
  }
};

export const updateUser = async (req, res) => {
  const user = req.body;
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "No token found" });
  }
  try {
    const decoded = jwt.verify(token, secret);
    const targetEmail = decoded.email;
    if (user.password) {
      const hashed = await bcrypt.hash(user.password, 10);
      user.hashed_password = hashed;
      delete user.password;
    }
    const response = await userServices.updateUser(targetEmail, user);
    if (response.success) {
      const formattedUser = formatUserData(response.user);
      if (targetEmail !== formattedUser.email) {
        const updatedToken = jwt.sign({ id: formattedUser.id, email: formattedUser.email }, secret, {
          expiresIn: expires || "1d",
        });
        res.cookie("token", updatedToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          maxAge: 24 * 60 * 60 * 1000,
        });
      }
      return res.status(200).json({
        message: "User updated successfully",
        data: formattedUser,
      });
    }
    return res.status(400).json({ message: "User couldn't be updated" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Something went wrong during user update" });
  }
};
export const deleteUser = async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "No token found" });
  }
  const { id } = req.params;
  try {
    const decoded = jwt.verify(token, secret);
    const targetId = decoded.id;
    if (targetId !== id) {
      return res
        .status(403)
        .json({ message: "You can only delete your own account" });
    }
    const response = await userServices.deleteUser(id);
    if (response.success) {
      res.cookie("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 0,
      });
      return res.status(200).json({
        message: "User deleted",
      });
    }
    return res.status(400).json({ message: "User couldn't be deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete the user" });
  }
};

export const deleteUserAddress = async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "No token found" });
  }

  try {
    const decoded = jwt.verify(token, secret);
    const targetEmail = decoded.email;

    const response = await userServices.deleteUserAddress(targetEmail);
    if (response.success) {
      const formattedUser = response.user ? formatUserData(response.user) : null;
      return res.status(200).json({
        message: response.message,
        user: formattedUser,
      });
    }
    return res.status(400).json({ message: response.message });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to delete address" });
  }
};

export const getStatistics = async (req, res) => {
  try {
    console.log("Fetching customer and staff statistics...");
    
    const customerResponse = await userServices.getAllCustomers();
    console.log("Customer rows:", customerResponse);
    
    const staffResponse = await userServices.getAllStaff();
    console.log("Staff rows:", staffResponse);
    
    const customerCount = customerResponse?.length || 0;
    const staffCount = staffResponse?.length || 0;
    
    const stats = {
      customers: customerCount,
      staff: staffCount,
    };
    
    console.log("Final stats:", stats);
    
    return res.status(200).json({
      message: "Statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to fetch statistics" });
  }
};
