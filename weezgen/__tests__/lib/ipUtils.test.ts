import {
  isValidIPAddress,
  normalizeIPAddress,
  isWithinRetentionPeriod,
  getClientIP,
} from "@/lib/ipUtils";

describe("IP Utils", () => {
  describe("isValidIPAddress", () => {
    it("validates IPv4 addresses correctly", () => {
      expect(isValidIPAddress("192.168.1.1")).toBe(true);
      expect(isValidIPAddress("10.0.0.1")).toBe(true);
      expect(isValidIPAddress("172.16.0.1")).toBe(true);
      expect(isValidIPAddress("256.1.2.3")).toBe(false);
      expect(isValidIPAddress("192.168.1")).toBe(false);
      expect(isValidIPAddress("invalid")).toBe(false);
    });

    it("validates IPv6 addresses correctly", () => {
      expect(isValidIPAddress("2001:db8::1")).toBe(true);
      expect(isValidIPAddress("::1")).toBe(true);
      expect(isValidIPAddress("2001:db8::1:2:3:4")).toBe(true);
      expect(isValidIPAddress("2001:db8::1:2:3:4:5:6:7:8")).toBe(false);
    });
  });

  describe("normalizeIPAddress", () => {
    it("normalizes IP addresses correctly", () => {
      expect(normalizeIPAddress("192.168.001.001")).toBe("192.168.1.1");
      expect(
        normalizeIPAddress("2001:0db8:0000:0000:0000:0000:0000:0001")
      ).toBe("2001:db8::1");
    });
  });

  describe("isWithinRetentionPeriod", () => {
    it("returns true for recent dates", () => {
      const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      expect(isWithinRetentionPeriod(recentDate)).toBe(true);
    });

    it("returns false for old dates", () => {
      const oldDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000); // 20 days ago
      expect(isWithinRetentionPeriod(oldDate)).toBe(false);
    });
  });

  describe("getClientIP", () => {
    it("extracts IP from headers correctly", () => {
      const headers = new Headers({
        "x-forwarded-for": "192.168.1.1, 10.0.0.1",
        "x-real-ip": "192.168.1.2",
      });

      expect(getClientIP(headers)).toBe("192.168.1.1");
    });

    it("falls back to x-real-ip when x-forwarded-for is not available", () => {
      const headers = new Headers({
        "x-real-ip": "192.168.1.2",
      });

      expect(getClientIP(headers)).toBe("192.168.1.2");
    });

    it("returns null when no IP headers are found", () => {
      const headers = new Headers();
      expect(getClientIP(headers)).toBe(null);
    });
  });
});
