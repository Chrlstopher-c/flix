/** Bibliothèque commune, chargée une fois et partagée par les pages. */
import { useApi, type ApiState } from './use-api';
import type { LibraryTitle, Tag } from './types';

export function useLibrary(): ApiState<{ titles: LibraryTitle[]; tags: Tag[] }> {
  return useApi<{ titles: LibraryTitle[]; tags: Tag[] }>('/api/library');
}
