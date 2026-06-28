import { orderStatuses, paymentMethods } from "./constants.js";

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export function required(value, label) {
  if (String(value || "").trim()) return "";
  return `${label} is required.`;
}

export function validateEmail(value) {
  if (!String(value || "").trim()) return "Email is required.";
  if (!isEmail(value)) return "Enter a valid email address.";
  return "";
}

export function validatePassword(value, label = "Password") {
  if (!value) return `${label} is required.`;
  if (String(value).length < 6) return `${label} must be at least 6 characters.`;
  return "";
}

export function validateRegister(values) {
  const errors = {};
  const nameError = required(values.fullName, "Full name");
  if (nameError) errors.fullName = nameError;
  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;
  const passwordError = validatePassword(values.password);
  if (passwordError) errors.password = passwordError;
  if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Confirm password must match password.";
  }
  return errors;
}

export function validateLogin(values) {
  const errors = {};
  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;
  if (!values.password) errors.password = "Password is required.";
  return errors;
}

export function validatePasswordChange(values) {
  const errors = {};
  if (!values.currentPassword) errors.currentPassword = "Current password is required.";
  const newPasswordError = validatePassword(values.newPassword, "New password");
  if (newPasswordError) errors.newPassword = newPasswordError;
  if (values.newPassword !== values.confirmPassword) {
    errors.confirmPassword = "Confirm password must match new password.";
  }
  if (values.currentPassword && values.currentPassword === values.newPassword) {
    errors.newPassword = "New password must be different from current password.";
  }
  return errors;
}

export function validateQuantity(value, max) {
  const quantity = Number(value);
  if (!Number.isInteger(quantity)) return "Quantity must be a whole number.";
  if (quantity < 1) return "Quantity must be at least 1.";
  if (Number.isFinite(Number(max)) && quantity > Number(max)) {
    return `Only ${max} available in stock.`;
  }
  return "";
}

export function validateStock(value) {
  const quantity = Number(value);
  if (!Number.isInteger(quantity)) return "Stock must be a whole number.";
  if (quantity < 0) return "Stock cannot be negative.";
  return "";
}

export function validatePrice(value) {
  const price = Number(value);
  if (Number.isNaN(price)) return "Price must be a number.";
  if (price < 0) return "Price cannot be negative.";
  return "";
}

export function validateProduct(values) {
  const errors = {};
  const nameError = required(values.name, "Product name");
  if (nameError) errors.name = nameError;
  const categoryError = required(values.categoryId, "Category");
  if (categoryError) errors.categoryId = categoryError;
  const priceError = validatePrice(values.unitPrice);
  if (priceError) errors.unitPrice = priceError;
  const stockError = validateStock(values.quantity);
  if (stockError) errors.quantity = stockError;
  if (values.imageUrl && !/^https?:\/\/.+/i.test(values.imageUrl)) {
    errors.imageUrl = "Image URL must start with http or https.";
  }
  return errors;
}

export function validateCategory(values) {
  const errors = {};
  const nameError = required(values.name, "Category name");
  if (nameError) errors.name = nameError;
  return errors;
}

export function validateCheckout(values) {
  const errors = {};
  const recipientNameError = required(values.recipientName, "Recipient name");
  if (recipientNameError) errors.recipientName = recipientNameError;
  const recipientPhoneError = required(values.recipientPhone, "Recipient phone");
  if (recipientPhoneError) errors.recipientPhone = recipientPhoneError;
  const stateError = required(values.state, "State");
  if (stateError) errors.state = stateError;
  const cityError = required(values.city, "City");
  if (cityError) errors.city = cityError;
  const streetError = required(values.street, "Street");
  if (streetError) errors.street = streetError;
  const buildingNumberError = required(values.buildingNumber, "Building number");
  if (buildingNumberError) errors.buildingNumber = buildingNumberError;
  if (!paymentMethods.includes(values.paymentMethod)) {
    errors.paymentMethod = "Choose a payment method.";
  }
  if (values.giftMessage && values.giftMessage.length > 240) {
    errors.giftMessage = "Gift message must be 240 characters or fewer.";
  }
  if (values.voucherCode && values.voucherCode.length > 50) {
    errors.voucherCode = "Voucher code must be 50 characters or fewer.";
  }
  return errors;
}

export function validateOrderStatus(value) {
  if (!orderStatuses.includes(value)) return "Choose a valid order status.";
  return "";
}

const allowedOrderStatusTransitions = {
  pending: ["placed", "paid", "cancelled"],
  placed: ["paid", "cancelled"],
  paid: ["completed", "cancelled"],
  cancelled: [],
  completed: [],
};

export function validateOrderStatusTransition(currentStatus, nextStatus) {
  const statusMessage = validateOrderStatus(nextStatus);
  if (statusMessage) return statusMessage;
  if (currentStatus === nextStatus) return "";
  if ((allowedOrderStatusTransitions[currentStatus] || []).includes(nextStatus)) return "";
  return `Cannot change order status from ${currentStatus} to ${nextStatus}.`;
}
