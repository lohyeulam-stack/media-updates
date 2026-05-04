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
  // Return hardcoded recent weeks for now
  return ['2026-W17', '2026-W16', '2026-W15', '2026-W14', '2026-W13', '2026-W12'];
}

export async function getAvailableMonths(): Promise<string[]> {
  // Return hardcoded recent months for now
  return ['2026-04', '2026-03', '2026-02', '2026-01'];
}
