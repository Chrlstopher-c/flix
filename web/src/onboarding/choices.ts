/** Réponses rapides du premier lancement et leur traduction en suivi. */
export type Choice = 'adore' | 'aime' | 'bof' | 'a_voir';

export const CHOICES: { value: Choice; label: string; icon: string; status: string; rating: number | null }[] = [
  { value: 'adore', label: 'J’adore', icon: '♥', status: 'vu', rating: 10 },
  { value: 'aime', label: 'Aimé', icon: '＋', status: 'vu', rating: 7 },
  { value: 'bof', label: 'Pas aimé', icon: '−', status: 'vu', rating: 3 },
  { value: 'a_voir', label: 'À voir', icon: '◷', status: 'a_voir', rating: null },
];

export const GOAL = 15;
