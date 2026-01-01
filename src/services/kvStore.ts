import { db } from '../database/db';

// Simple key-value store backed by settings table
export async function kvGet<T = unknown>(key: string, defaultValue: T): Promise<T> {
  const row = await db.settings.where('key').equals(key).first();
  if (!row || !row.value) return defaultValue;
  try { return JSON.parse(row.value) as T; } catch { return defaultValue; }
}

export async function kvSet<T = unknown>(key: string, value: T, description?: string): Promise<void> {
  await db.settings.put({ key, value: JSON.stringify(value), description });
}

export function toCSV<T>(data: T[], headers: string[]): string {
  const rows = [headers.join(',')];
  for (const item of data) {
    const rec = item as unknown as Record<string, unknown>;
    const cols = headers.map(h => {
      const raw = rec[h] ?? '';
      const val = String(raw).replace(/"/g, '""');
      return /[,\n\r]/.test(val) ? `"${val}"` : val;
    });
    rows.push(cols.join(','));
  }
  return rows.join('\n');
}
