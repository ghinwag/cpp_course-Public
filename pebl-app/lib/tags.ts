import { colors } from './motion';

export const TAG_GROUPS = [
  { name: 'Mood', tint: colors.roseText, tags: ['sad', 'moody', 'irritable', 'anxious', 'teary', 'tired'] },
  { name: 'Body', tint: colors.cherry, tags: ['cramps', 'back pain', 'bloating', 'headache'] },
  { name: 'Skin', tint: colors.cherry, tags: ['breakouts'] },
] as const;

export const PRESET_TAGS: string[] = TAG_GROUPS.flatMap((g) => [...g.tags]);

/** Display form: "back pain" → "Back pain". Tags are stored lowercase. */
export const tagLabel = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export const normaliseTag = (t: string) => t.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 30);
