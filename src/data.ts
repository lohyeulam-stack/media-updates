/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { MediaUpdate } from './types';

const BASE = '/data';

export async function getUpdates(): Promise<MediaUpdate[]> {
  try {
    const res = await fetch(`${BASE}/updates.json`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function getWeeklyData(week: string): Promise<MediaUpdate[]> {
  try {
    const res = await fetch(`${BASE}/weekly/${week}.json`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function getMonthlyReport(month: string): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/monthly/${month}.md`);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function getAvailableWeeks(): Promise<string[]> {
  // Extract unique weeks from updates.json
  const updates = await getUpdates();
  const weeks = [...new Set(updates.map((u) => u.week))];
  return weeks.sort().reverse().slice(0, 12);
}

export async function getAvailableMonths(): Promise<string[]> {
  // Extract unique months from updates.json
  const updates = await getUpdates();
  const months = [...new Set(updates.map((u) => u.month))];
  return months.sort().reverse().slice(0, 12);
}
