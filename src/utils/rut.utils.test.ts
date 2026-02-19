import { describe, it, expect } from "vitest";
import { formatRut, validateRut } from "./rut.utils";

describe("rut.utils", () => {
  describe("formatRut", () => {
    it("should format a clean RUT correctly", () => {
      expect(formatRut("123456789")).toBe("12.345.678-9");
    });

    it("should handle alphanumeric input", () => {
      expect(formatRut("12.345.678-9")).toBe("12.345.678-9");
    });

    it("should return empty string for empty input", () => {
      expect(formatRut("")).toBe("");
    });
  });

  describe("validateRut", () => {
    it("should return true for a valid RUT", () => {
      // Example valid RUT: 11.111.111-1
      expect(validateRut("111111111")).toBe(true);
      expect(validateRut("11.111.111-1")).toBe(true);
    });

    it("should return false for an invalid RUT", () => {
      expect(validateRut("12345678-9")).toBe(false);
    });

    it("should return true for empty or undefined", () => {
      expect(validateRut("")).toBe(true);
      expect(validateRut(undefined)).toBe(true);
    });
  });
});
