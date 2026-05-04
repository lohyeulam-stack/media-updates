/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Platform, PlatformGroup } from './types';

export const PLATFORMS: Record<Platform, { label: string; color: string; group: PlatformGroup }> = {
  tiktok:    { label: 'TikTok',    color: '#000000', group: 'social' },
  meta:      { label: 'Meta',      color: '#0668E1', group: 'social' },
  snapchat:  { label: 'Snapchat',  color: '#FFFC00', group: 'social' },
  pinterest: { label: 'Pinterest', color: '#BD081C', group: 'social' },
  x:         { label: 'X',         color: '#000000', group: 'social' },
  linkedin:  { label: 'LinkedIn',  color: '#0077B5', group: 'social' },
  google:    { label: 'Google',    color: '#4285F4', group: 'search' },
  apple:     { label: 'Apple',     color: '#000000', group: 'search' },
  youtube:   { label: 'YouTube',   color: '#FF0000', group: 'video' },
  spotify:   { label: 'Spotify',   color: '#1DB954', group: 'video' },
  kuaishou:  { label: 'Kuaishou',  color: '#FF4D1C', group: 'asia' },
  line:      { label: 'LINE',      color: '#00C300', group: 'asia' },
  naver:     { label: 'Naver',     color: '#03C75A', group: 'asia' },
  kakao:     { label: 'Kakao',     color: '#FEE500', group: 'asia' },
  dv360:     { label: 'DV360',     color: '#4285F4', group: 'programmatic' },
  applovin:  { label: 'AppLovin',  color: '#053C5E', group: 'programmatic' },
  ironsource:{ label: 'ironSource',color: '#00BAA5', group: 'programmatic' },
  mintegral: { label: 'Mintegral', color: '#00CCFF', group: 'programmatic' },
  pangle:    { label: 'Pangle',    color: '#3142FF', group: 'programmatic' },
  amazon:    { label: 'Amazon',    color: '#FF9900', group: 'programmatic' },
  huawei:    { label: 'Huawei',    color: '#FF0000', group: 'domestic' },
  xiaomi:    { label: 'Xiaomi',    color: '#FF6700', group: 'domestic' },
  oppo:      { label: 'OPPO',      color: '#008459', group: 'domestic' },
  vivo:      { label: 'vivo',      color: '#415FFF', group: 'domestic' },
};

export const GROUP_LABELS: Record<PlatformGroup, string> = {
  social:       'Social / Short Video',
  search:       'Search / App Store',
  video:        'Video / Audio',
  asia:         'Asia Regional',
  programmatic: 'Programmatic / DSP',
  domestic:     'Domestic Manufacturers',
};

export const GROUP_ORDER: PlatformGroup[] = ['social', 'search', 'video', 'asia', 'programmatic', 'domestic'];

export const CATEGORIES = [
  'All',
  'Ad Product',
  'API Change',
  'Policy',
  'Creative Tool',
  'Measurement',
  'Targeting',
  'Automation',
] as const;

export type CategoryFilter = typeof CATEGORIES[number];

export const PLATFORM_LIST = Object.keys(PLATFORMS) as Platform[];
