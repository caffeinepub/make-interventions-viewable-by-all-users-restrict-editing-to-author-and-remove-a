/**
 * Returns the ISO week number for a given date.
 */
export function getISOWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Returns the ISO week year for a given date.
 * This can differ from the calendar year near Jan 1.
 */
export function getISOWeekYear(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

/**
 * Returns the Monday (start) of the ISO week for given weekNumber and weekYear.
 */
export function getWeekStart(weekNumber: number, weekYear: number): Date {
  const jan4 = new Date(Date.UTC(weekYear, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const weekStart = new Date(jan4);
  weekStart.setUTCDate(
    jan4.getUTCDate() - dayOfWeek + 1 + (weekNumber - 1) * 7,
  );
  return weekStart;
}

/**
 * Format a date as dd/MM/yyyy.
 */
export function formatDate(date: Date): string {
  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`;
}

export const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven"];
export const DAY_NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
