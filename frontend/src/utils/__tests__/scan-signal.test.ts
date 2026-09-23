import {
  consumePendingScannedTransactionId,
  setPendingScannedTransactionId,
} from "../scan-signal";

describe("scan-signal", () => {
  it("returns null when nothing has been set", () => {
    expect(consumePendingScannedTransactionId()).toBeNull();
  });

  it("hands back the id that was set", () => {
    setPendingScannedTransactionId(42);
    expect(consumePendingScannedTransactionId()).toBe(42);
  });

  it("is one-shot — a second consume returns null", () => {
    setPendingScannedTransactionId(7);
    consumePendingScannedTransactionId();
    expect(consumePendingScannedTransactionId()).toBeNull();
  });

  it("the latest set wins over an earlier unconsumed one", () => {
    setPendingScannedTransactionId(1);
    setPendingScannedTransactionId(2);
    expect(consumePendingScannedTransactionId()).toBe(2);
  });
});
