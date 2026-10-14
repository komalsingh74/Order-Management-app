import { describe, expect, it } from "vitest";
import { validateCheckout } from "./validation";

const valid = { name: "Rahul Sharma", address: "221B MG Road, Bareilly", phone: "+91 98765-43210" };

describe("validateCheckout", () => {
  it("accepts valid details", () => {
    expect(validateCheckout(valid)).toEqual({});
  });

  it("flags every empty field", () => {
    const errors = validateCheckout({ name: "", address: "", phone: "" });
    expect(Object.keys(errors).sort()).toEqual(["address", "name", "phone"]);
  });

  it("trims whitespace before checking length", () => {
    expect(validateCheckout({ ...valid, name: "   a   " }).name).toBeDefined();
  });

  it.each(["abc", "12345", "98765 4321x", "1".repeat(16)])("rejects phone %s", (phone) => {
    expect(validateCheckout({ ...valid, phone }).phone).toBeDefined();
  });

  it("accepts phone with spaces and dashes", () => {
    expect(validateCheckout({ ...valid, phone: "98765-43210" }).phone).toBeUndefined();
  });
});
