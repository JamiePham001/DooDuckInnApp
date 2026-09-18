export function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${start.toLocaleDateString(undefined, { month: "long" })} - ${end.toLocaleDateString(undefined, { month: "long", year: "numeric" })}`;
}
