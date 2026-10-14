import type { CustomerDetails } from "./types";

export type CheckoutErrors = Partial<Record<keyof CustomerDetails, string>>;

/** Mirrors the backend rules so users get instant feedback. */
export function validateCheckout(values: CustomerDetails): CheckoutErrors {
  const errors: CheckoutErrors = {};
  const name = values.name.trim();
  const address = values.address.trim();
  const phone = values.phone.replace(/[\s-]/g, "");

  if (name.length < 2) errors.name = "Enter your full name (at least 2 characters).";
  else if (name.length > 60) errors.name = "Name is too long (max 60 characters).";

  if (address.length < 5) errors.address = "Enter your full delivery address.";
  else if (address.length > 200) errors.address = "Address is too long (max 200 characters).";

  if (!/^\+?\d{10,15}$/.test(phone)) errors.phone = "Enter a valid phone number (10 to 15 digits).";

  return errors;
}
