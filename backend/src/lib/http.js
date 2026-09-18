// Utilitarios usados por todas as rotas.

export class ApiError extends Error {
  constructor(status, message, details = undefined) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/**
 * Envolve um handler async para que qualquer erro caia no middleware
 * de erro do Express em vez de derrubar o processo.
 */
export const wrap = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

/**
 * Valida um objeto com zod. Se falhar, devolve 400 com a lista de campos.
 */
export function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      campo: issue.path.join('.') || '(raiz)',
      erro: issue.message,
    }));
    throw new ApiError(400, 'Dados invalidos', details);
  }
  return result.data;
}

/** Gera um codigo curto e legivel para links publicos (ex: "k3f9qz"). */
export function shortCode(length = 7) {
  const alphabet = 'abcdefghijkmnopqrstuvwxyz23456789'; // sem l, 0, 1
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/** Transforma "Ateliê Florescer" em "atelie-florescer". */
export function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
