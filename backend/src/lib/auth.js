import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma.js';
import { ApiError, wrap } from './http.js';

const JWT_SECRET = process.env.JWT_SECRET || 'segredo-de-desenvolvimento';
const TOKEN_EXPIRES_IN = '7d';

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function checkPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
}

function readToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

/**
 * Exige login. Coloca o usuario em req.user.
 */
export const requireAuth = wrap(async (req, _res, next) => {
  const token = readToken(req);
  if (!token) throw new ApiError(401, 'Voce precisa estar logado');

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Sessao expirada ou invalida');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, name: true, email: true, phone: true },
  });
  if (!user) throw new ApiError(401, 'Usuario nao encontrado');

  req.user = user;
  next();
});

/**
 * Login opcional: se houver token valido preenche req.user, senao segue.
 * Usado em rotas publicas que se comportam um pouco diferente para quem
 * ja esta logado (ex: pedir orcamento ja vinculado ao evento da pessoa).
 */
export const optionalAuth = wrap(async (req, _res, next) => {
  const token = readToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, phone: true },
    });
  } catch {
    // token ruim em rota publica: apenas ignora
  }
  next();
});

/**
 * Carrega o evento de :eventId (ou :id) e garante que ele pertence ao
 * usuario logado. Coloca em req.event.
 */
export const requireEventOwner = wrap(async (req, _res, next) => {
  const eventId = req.params.eventId || req.params.id;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new ApiError(404, 'Evento nao encontrado');
  if (event.ownerId !== req.user.id) {
    throw new ApiError(403, 'Este evento nao e seu');
  }
  req.event = event;
  next();
});

/**
 * Carrega o perfil de fornecedor do usuario logado em req.vendor.
 */
export const requireVendor = wrap(async (req, _res, next) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } });
  if (!vendor) throw new ApiError(404, 'Voce ainda nao tem perfil de fornecedor');
  req.vendor = vendor;
  next();
});
