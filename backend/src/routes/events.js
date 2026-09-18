import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { wrap, parse, shortCode } from '../lib/http.js';
import { requireAuth, requireEventOwner } from '../lib/auth.js';

const router = Router();
router.use(requireAuth);

export const EVENT_TYPES = [
  'casamento',
  'aniversario',
  '15anos',
  'formatura',
  'cha-de-bebe',
  'cha-de-panela',
  'batizado',
  'corporativo',
  'outro',
];

/**
 * Quais recursos cada tipo de evento usa. E isso que faz a tela do
 * casamento ser diferente da tela da formatura.
 */
export const FEATURES_BY_TYPE = {
  casamento: ['convidados', 'presentes', 'mesas', 'orcamento', 'padrinhos'],
  aniversario: ['convidados', 'presentes', 'orcamento'],
  '15anos': ['convidados', 'presentes', 'mesas', 'orcamento'],
  formatura: ['convidados', 'mesas', 'orcamento', 'ingressos'],
  'cha-de-bebe': ['convidados', 'presentes'],
  'cha-de-panela': ['convidados', 'presentes'],
  batizado: ['convidados', 'presentes'],
  corporativo: ['convidados', 'mesas', 'orcamento', 'credenciamento'],
  outro: ['convidados', 'orcamento'],
};

const eventSchema = z.object({
  name: z.string().min(2, 'Dê um nome ao evento'),
  type: z.enum(EVENT_TYPES),
  date: z.coerce.date({ invalid_type_error: 'Data invalida' }),
  time: z.string().default('19:00'),
  venue: z.string().default(''),
  address: z.string().default(''),
  city: z.string().default(''),
  description: z.string().default(''),
  hosts: z.string().default(''),
  coverImage: z.string().default(''),
});

async function generateUniqueCode() {
  for (let i = 0; i < 10; i++) {
    const code = shortCode();
    const taken = await prisma.event.findUnique({ where: { publicCode: code } });
    if (!taken) return code;
  }
  return shortCode(12);
}

/** Monta o resumo de convidados/presentes que o dashboard mostra. */
async function buildSummary(eventId) {
  const [guests, giftTotal, giftReceived, budget] = await Promise.all([
    prisma.guest.groupBy({
      by: ['rsvp'],
      where: { eventId },
      _count: { _all: true },
    }),
    prisma.gift.count({ where: { eventId } }),
    prisma.gift.count({ where: { eventId, received: true } }),
    prisma.budgetItem.aggregate({
      where: { eventId },
      _sum: { estimatedCost: true, actualCost: true },
    }),
  ]);

  const byStatus = { pending: 0, confirmed: 0, declined: 0 };
  for (const row of guests) byStatus[row.rsvp] = row._count._all;

  return {
    guests: {
      ...byStatus,
      total: byStatus.pending + byStatus.confirmed + byStatus.declined,
    },
    gifts: { total: giftTotal, received: giftReceived },
    budget: {
      estimated: budget._sum.estimatedCost || 0,
      actual: budget._sum.actualCost || 0,
    },
  };
}

// GET /api/events  -> lista os eventos do usuario logado
router.get(
  '/',
  wrap(async (req, res) => {
    const events = await prisma.event.findMany({
      where: { ownerId: req.user.id },
      orderBy: { date: 'asc' },
      include: {
        personalization: true,
        _count: { select: { guests: true, gifts: true } },
      },
    });
    res.json({
      events: events.map((e) => ({ ...e, features: FEATURES_BY_TYPE[e.type] || [] })),
    });
  })
);

// POST /api/events
router.post(
  '/',
  wrap(async (req, res) => {
    const data = parse(eventSchema, req.body);
    const event = await prisma.event.create({
      data: {
        ...data,
        ownerId: req.user.id,
        publicCode: await generateUniqueCode(),
        personalization: { create: {} }, // usa os defaults do schema
      },
      include: { personalization: true },
    });
    res.status(201).json({ event: { ...event, features: FEATURES_BY_TYPE[event.type] } });
  })
);

// GET /api/events/:id
router.get(
  '/:id',
  requireEventOwner,
  wrap(async (req, res) => {
    const event = await prisma.event.findUnique({
      where: { id: req.event.id },
      include: { personalization: true },
    });
    res.json({
      event: { ...event, features: FEATURES_BY_TYPE[event.type] || [] },
      summary: await buildSummary(event.id),
    });
  })
);

// PATCH /api/events/:id
router.patch(
  '/:id',
  requireEventOwner,
  wrap(async (req, res) => {
    const data = parse(eventSchema.partial().extend({ isPublished: z.boolean().optional() }), req.body);
    const event = await prisma.event.update({
      where: { id: req.event.id },
      data,
      include: { personalization: true },
    });
    res.json({ event: { ...event, features: FEATURES_BY_TYPE[event.type] || [] } });
  })
);

// DELETE /api/events/:id
router.delete(
  '/:id',
  requireEventOwner,
  wrap(async (req, res) => {
    await prisma.event.delete({ where: { id: req.event.id } });
    res.status(204).end();
  })
);

// PATCH /api/events/:id/personalization
router.patch(
  '/:id/personalization',
  requireEventOwner,
  wrap(async (req, res) => {
    const data = parse(
      z.object({
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        heroImage: z.string().optional(),
        tagline: z.string().optional(),
        showGuestCount: z.boolean().optional(),
        showGiftList: z.boolean().optional(),
        showRsvp: z.boolean().optional(),
        showCountdown: z.boolean().optional(),
      }),
      req.body
    );

    const personalization = await prisma.personalization.upsert({
      where: { eventId: req.event.id },
      update: data,
      create: { eventId: req.event.id, ...data },
    });
    res.json({ personalization });
  })
);

// ---------------------------------------------------------------
// Orcamento do evento
// ---------------------------------------------------------------

const budgetSchema = z.object({
  title: z.string().min(1, 'Informe o item'),
  category: z.string().default('outros'),
  estimatedCost: z.coerce.number().min(0).default(0),
  actualCost: z.coerce.number().min(0).default(0),
  status: z.enum(['previsto', 'contratado', 'pago']).default('previsto'),
  vendorId: z.string().nullish(),
  notes: z.string().default(''),
});

// GET /api/events/:id/budget
router.get(
  '/:id/budget',
  requireEventOwner,
  wrap(async (req, res) => {
    const items = await prisma.budgetItem.findMany({
      where: { eventId: req.event.id },
      orderBy: { createdAt: 'asc' },
      include: { vendor: { select: { id: true, businessName: true, category: true } } },
    });
    res.json({ items });
  })
);

// POST /api/events/:id/budget
router.post(
  '/:id/budget',
  requireEventOwner,
  wrap(async (req, res) => {
    const data = parse(budgetSchema, req.body);
    const item = await prisma.budgetItem.create({
      data: { ...data, vendorId: data.vendorId || null, eventId: req.event.id },
    });
    res.status(201).json({ item });
  })
);

// PATCH /api/events/:id/budget/:itemId
router.patch(
  '/:id/budget/:itemId',
  requireEventOwner,
  wrap(async (req, res) => {
    const data = parse(budgetSchema.partial(), req.body);
    const item = await prisma.budgetItem.update({
      where: { id: req.params.itemId },
      data,
    });
    res.json({ item });
  })
);

// DELETE /api/events/:id/budget/:itemId
router.delete(
  '/:id/budget/:itemId',
  requireEventOwner,
  wrap(async (req, res) => {
    await prisma.budgetItem.delete({ where: { id: req.params.itemId } });
    res.status(204).end();
  })
);

export default router;
