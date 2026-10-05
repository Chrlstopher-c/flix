/** Variables d'environnement validées au démarrage. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`);
  return value;
}

export const ENV = {
  port: Number(process.env.PORT ?? 8490),
  tmdbKey: required('TMDB_API_KEY'),
  users: process.env.FLUXTUBE_USERS ?? '',
  dataDir: process.env.DATA_DIR || `${import.meta.dir}/../../data`,
};
