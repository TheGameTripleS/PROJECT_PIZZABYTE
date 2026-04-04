import { Router } from "express";
import {
  getAllAddresses,
  getAddressById,
  getAddressByCustomerId,
  createAddress,
  updateAddress,
  deleteAddress,
  unlinkAddressFromCustomer,
  linkAddressToCustomer,
} from "../controllers/address.controller.js";

const addressRouter = Router();

// Get all addresses
addressRouter.get("/", getAllAddresses);

// Get address by ID
addressRouter.get("/:id", getAddressById);

// Get address by customer ID
addressRouter.get("/customer/:customerId", getAddressByCustomerId);

// Create new address
addressRouter.post("/", createAddress);

// Update address by ID
addressRouter.put("/:id", updateAddress);

// Delete address by ID
addressRouter.delete("/:id", deleteAddress);

// Link address to customer
addressRouter.post("/link", linkAddressToCustomer);

// Unlink address from customer
addressRouter.delete("/unlink/:customerId", unlinkAddressFromCustomer);

export default addressRouter;
