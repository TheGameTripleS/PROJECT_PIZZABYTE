// Capitalizes the first letter of EVERY word (e.g., "pepperoni pizza" -> "Pepperoni Pizza")
export const formatTitleCase = (val) => {
  if (!val) return "";
  return val
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// Enforces UPPERCASE, numbers, and dashes only
export const formatSKUBase = (val) => {
  if (!val) return "";
  return val.toUpperCase().replace(/[^A-Z0-9-]/g, "");
};

// Checks if the SKU matches the 3-part structure and the size rule
export const isSKUValid = (sku, size) => {
  if (!sku) return false;
  const parts = sku.split("-");
  
  // Must be exactly 3 parts
  if (parts.length !== 3) return false;
  
  // If no size is typed yet, we consider it valid enough to not block typing
  if (!size) return true; 
  
  const firstLetterOfSize = size.charAt(0).toUpperCase();
  return parts[2] === firstLetterOfSize;
};