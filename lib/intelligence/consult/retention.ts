/** Calendar anniversaries preserve UTC time and clamp February 29 to February 28. */
export function consultationExpiry(createdAt: string, retention: { retentionDays?: number; retentionCalendarYears?: number }): string {
 const date = new Date(createdAt);
 if (!Number.isFinite(date.getTime())) throw new Error('Invalid consultation submission time.');
 if (retention.retentionCalendarYears !== undefined) {
  const years = retention.retentionCalendarYears;
  if (!Number.isSafeInteger(years) || years < 1 || years > 10 || retention.retentionDays !== undefined) throw new Error('Invalid consultation retention.');
  const month = date.getUTCMonth();
  date.setUTCFullYear(date.getUTCFullYear() + years);
  if (date.getUTCMonth() !== month) date.setUTCDate(0);
  return date.toISOString();
 }
 const days=retention.retentionDays;
 if (!Number.isSafeInteger(days) || !days || days < 1 || days > 3650) throw new Error('Invalid consultation retention.');
 return new Date(date.getTime()+days*86400000).toISOString();
}
