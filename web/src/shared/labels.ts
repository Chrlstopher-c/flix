/** Libellés affichés pour les statuts et les types de titres. */
import type { Kind, Status } from './types';

export const STATUS_LABEL: Record<Status, string> = {
  a_voir: 'À voir',
  en_cours: 'En cours',
  vu: 'Vu',
  abandonne: 'Abandonné',
};
export const STATUS_ORDER: Status[] = ['a_voir', 'en_cours', 'vu', 'abandonne'];

export const KIND_LABEL: Record<Kind, string> = { film: 'Film', serie: 'Série', anime: 'Animé' };
export const KIND_PLURAL: Record<Kind, string> = { film: 'Films', serie: 'Séries', anime: 'Animés' };

export function formatTime(seconds: number | null): string {
  if (seconds === null) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

export function parseTime(text: string): number | null {
  const parts = text.trim().split(':').map(Number);
  if (!text.trim() || parts.some((p) => !Number.isFinite(p))) return null;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}
