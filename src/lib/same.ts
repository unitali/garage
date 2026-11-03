// Evita gravar o que já está no banco: salvar sem mudar nada não vira escrita no Firestore.

/** JSON com chaves em ordem e sem campos undefined (o Firestore não grava undefined). */
function stable(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(stable);
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.keys(v)
        .filter((k) => (v as Record<string, unknown>)[k] !== undefined)
        .sort()
        .map((k) => [k, stable((v as Record<string, unknown>)[k])]),
    );
  }
  return v;
}

/**
 * O documento gravado (`prev`, como veio do Firestore, com `id`) já tem esses dados?
 * `merge`: só os campos enviados contam (setDoc com merge); sem ele, o documento inteiro.
 */
export function sameDoc(prev: object | null | undefined, next: object, merge = false): boolean {
  if (!prev) return false;
  const { id: _id, ...saved } = prev as Record<string, unknown>;
  const base = merge ? Object.fromEntries(Object.keys(next).map((k) => [k, saved[k]])) : saved;
  return JSON.stringify(stable(base)) === JSON.stringify(stable(next));
}
