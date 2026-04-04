import * as addressServices from "../services/address.service.js";

// Get all addresses
export const getAllAddresses = async (req, res) => {
  try {
    const response = await addressServices.getAllAddresses();
    if (response.success) {
      return res.status(200).json({
        message: "Addresses retrieved successfully",
        addresses: response.addresses,
      });
    }
    return res.status(400).json({ message: "No addresses found" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to retrieve addresses" });
  }
};

// Get address by ID
export const getAddressById = async (req, res) => {
  const { id } = req.params;
  try {
    const response = await addressServices.getAddressById(id);
    if (response.success) {
      return res.status(200).json({
        message: "Address retrieved successfully",
        address: response.address,
      });
    }
    return res.status(404).json({ message: response.message });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to retrieve address" });
  }
};

// Get address by customer ID
export const getAddressByCustomerId = async (req, res) => {
  const { customerId } = req.params;
  try {
    const response = await addressServices.getAddressByCustomerId(customerId);
    if (response.success) {
      return res.status(200).json({
        message: "Customer address retrieved successfully",
        address: response.address,
      });
    }
    return res.status(404).json({ message: response.message });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to retrieve customer address" });
  }
};

// Create new address
export const createAddress = async (req, res) => {
  const { address1, address2, zipcode } = req.body;
  try {
    // Validate at least one field is provided
    if (!address1 && !address2 && !zipcode) {
      return res.status(400).json({ message: "At least one address field is required" });
    }

    const response = await addressServices.createAddress({
      address1,
      address2,
      zipcode,
    });
    if (response.success) {
      return res.status(201).json({
        message: "Address created successfully",
        address: response.address,
      });
    }
    return res.status(400).json({ message: response.message });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to create address" });
  }
};

// Update address by ID
export const updateAddress = async (req, res) => {
  const { id } = req.params;
  const { address1, address2, zipcode } = req.body;
  try {
    // Validate at least one field is provided
    if (!address1 && !address2 && !zipcode) {
      return res.status(400).json({ message: "At least one field must be provided for update" });
    }

    const response = await addressServices.updateAddress(id, {
      address1,
      address2,
      zipcode,
    });
    if (response.success) {
      return res.status(200).json({
        message: "Address updated successfully",
        address: response.address,
      });
    }
    return res.status(404).json({ message: response.message });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to update address" });
  }
};

// Delete address by ID
export const deleteAddress = async (req, res) => {
  const { id } = req.params;
  try {
    const response = await addressServices.deleteAddress(id);
    if (response.success) {
      return res.status(200).json({ message: response.message });
    }
    return res.status(400).json({ message: response.message });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to delete address" });
  }
};

// Unlink address from customer
export const unlinkAddressFromCustomer = async (req, res) => {
  const { customerId } = req.params;
  try {
    const response = await addressServices.unlinkAddressFromCustomer(customerId);
    if (response.success) {
      return res.status(200).json({ message: response.message });
    }
    return res.status(404).json({ message: response.message });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to unlink address" });
  }
};

// Link address to customer
export const linkAddressToCustomer = async (req, res) => {
  const { customerId, addressId } = req.body;
  try {
    // Validate required fields
    if (!customerId || !addressId) {
      return res.status(400).json({ message: "customerId and addressId are required" });
    }

    const response = await addressServices.linkAddressToCustomer(customerId, addressId);
    if (response.success) {
      return res.status(200).json({
        message: response.message,
        data: response.data,
      });
    }
    return res.status(400).json({ message: response.message });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to link address" });
  }
};
