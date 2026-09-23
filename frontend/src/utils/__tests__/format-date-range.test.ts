import { formatDateRange } from "../format-date-range";

describe("formatDateRange", () => {
  it("formats a start/end ISO date pair as 'Month - Month Year'", () => {
    expect(formatDateRange("2026-01-01", "2026-03-31")).toBe("January - March 2026");
  });

  it("includes the year only once, on the end month", () => {
    const result = formatDateRange("2026-07-01", "2026-09-30");
    expect(result).toBe("July - September 2026");
    expect(result.match(/2026/g)).toHaveLength(1);
  });

  it("handles a range spanning a year boundary", () => {
    expect(formatDateRange("2026-11-01", "2027-01-31")).toBe("November - January 2027");
  });
});
