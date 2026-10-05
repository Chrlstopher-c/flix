/** Variables d'environnement validées au démarrage. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`);
  return value;
}

export const ENV = {
  port: Number(process.env.PORT ?? 8490),
  tmdbKey: required('TMDB_API_KEY'),
  users: process.env.FLIX_USERS ?? process.env.FLUXTUBE_USERS ?? '',
  /** Adresse principale, et anciennes adresses redirigées vers elle (virgules). Vides = aucune redirection. */
  canonicalHost: process.env.CANONICAL_HOST ?? '',
  redirectHosts: (process.env.REDIRECT_HOSTS ?? '').split(',').map((h) => h.trim()).filter(Boolean),
  dataDir: process.env.DATA_DIR || `${import.meta.dir}/../../data`,
};
