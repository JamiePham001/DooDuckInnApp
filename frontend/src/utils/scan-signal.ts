// A one-shot, in-memory handoff for the id of a transaction just created by an
// image scan, from camera.tsx to the report editor it navigates back to. Both
// screens live in the same navigator stack instance (going back just pops
// camera.tsx off, it doesn't remount the editor), so a plain module-level
// variable is enough — no global state library or persistence needed for
// something this short-lived and single-consumer.
let pendingScannedTransactionId: number | null = null;

export function setPendingScannedTransactionId(id: number) {
  pendingScannedTransactionId = id;
}

export function consumePendingScannedTransactionId(): number | null {
  const id = pendingScannedTransactionId;
  pendingScannedTransactionId = null;
  return id;
}
