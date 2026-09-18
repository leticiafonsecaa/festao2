import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { ApiError, wrap, parse } from '../lib/http.js';
import { hashPassword, checkPassword, signToken, requireAuth } from '../lib/auth.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('E-mail invalido'),
  password: z.string().min(6, 'A senha precisa ter ao menos 6 caracteres'),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('E-mail invalido'),
  password: z.string().min(1, 'Informe a senha'),
});

// POST /api/auth/register
router.post(
  '/register',
  wrap(async (req, res) => {
    const data = parse(registerSchema, req.body);
    const email = data.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError(409, 'Ja existe uma conta com esse e-mail');

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email,
        phone: data.phone || null,
        passwordHash: await hashPassword(data.password),
      },
      select: { id: true, name: true, email: true, phone: true },
    });

    res.status(201).json({ user, token: signToken(user.id) });
  })
);

// POST /api/auth/login
router.post(
  '/login',
  wrap(async (req, res) => {
    const data = parse(loginSchema, req.body);
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    // Mesma mensagem nos dois casos para nao revelar quais e-mails existem.
    if (!user || !(await checkPassword(data.password, user.passwordHash))) {
      throw new ApiError(401, 'E-mail ou senha incorretos');
    }

    res.json({
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
      token: signToken(user.id),
    });
  })
);

// GET /api/auth/me
router.get(
  '/me',
  requireAuth,
  wrap(async (req, res) => {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.id },
      select: { id: true, businessName: true, slug: true, category: true },
    });
    res.json({ user: req.user, vendor });
  })
);

// PATCH /api/auth/me
router.patch(
  '/me',
  requireAuth,
  wrap(async (req, res) => {
    const data = parse(
      z.object({
        name: z.string().min(2).optional(),
        phone: z.string().optional(),
      }),
      req.body
    );
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, name: true, email: true, phone: true },
    });
    res.json({ user });
  })
);

export default router;
