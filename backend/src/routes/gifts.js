import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { ApiError, wrap, parse } from '../lib/http.js';
import { requireAuth, requireEventOwner } from '../lib/auth.js';

const router = Router({ mergeParams: true });
router.use(requireAuth, requireEventOwner);

const optionSchema = z.object({
  store: z.string().min(1, 'Informe a loja'),
  price: z.coerce.number().min(0),
  url: z.string().default(''),
});

const giftSchema = z.object({
  name: z.string().min(2, 'Informe o nome do presente'),
  category: z.string().default('Geral'),
  image: z.string().default(''),
  description: z.string().default(''),
  options: z.array(optionSchema).default([]),
});

async function findGiftInEvent(giftId, eventId) {
  const gift = await prisma.gift.findUnique({ where: { id: giftId } });
  if (!gift || gift.eventId !== eventId) {
    throw new ApiError(404, 'Presente nao encontrado neste evento');
  }
  return gift;
}

// GET /api/events/:eventId/gifts
router.get(
  '/',
  wrap(async (req, res) => {
    const gifts = await prisma.gift.findMany({
      where: { eventId: req.event.id },
      orderBy: { createdAt: 'asc' },
      include: {
        options: { orderBy: { price: 'asc' } },
        reservedByGuest: { select: { id: true, name: true } },
      },
    });

    res.json({
      gifts,
      stats: {
        total: gifts.length,
        received: gifts.filter((g) => g.received).length,
        reserved: gifts.filter((g) => g.reservedByGuestId || g.reservedByName).length,
      },
    });
  })
);

// POST /api/events/:eventId/gifts
router.post(
  '/',
  wrap(async (req, res) => {
    const { options, ...data } = parse(giftSchema, req.body);
    const gift = await prisma.gift.create({
      data: {
        ...data,
        eventId: req.event.id,
        options: { create: options },
      },
      include: { options: true },
    });
    res.status(201).json({ gift });
  })
);

// PATCH /api/events/:eventId/gifts/:giftId
// Se "options" vier no corpo, substitui a lista inteira de opcoes.
router.patch(
  '/:giftId',
  wrap(async (req, res) => {
    await findGiftInEvent(req.params.giftId, req.event.id);
    const { options, ...data } = parse(giftSchema.partial(), req.body);

    if (options) {
      await prisma.giftOption.deleteMany({ where: { giftId: req.params.giftId } });
    }

    const gift = await prisma.gift.update({
      where: { id: req.params.giftId },
      data: { ...data, ...(options ? { options: { create: options } } : {}) },
      include: { options: true },
    });
    res.json({ gift });
  })
);

// POST /api/events/:eventId/gifts/:giftId/received
// Marca/desmarca como recebido. Corpo opcional: { receivedBy: "Tia Ana" }
router.post(
  '/:giftId/received',
  wrap(async (req, res) => {
    const current = await findGiftInEvent(req.params.giftId, req.event.id);
    const { receivedBy } = parse(
      z.object({ receivedBy: z.string().optional() }),
      req.body || {}
    );

    const gift = await prisma.gift.update({
      where: { id: current.id },
      data: {
        received: !current.received,
        receivedBy: current.received ? null : receivedBy || current.reservedByName || null,
      },
      include: { options: true },
    });
    res.json({ gift });
  })
);

// DELETE /api/events/:eventId/gifts/:giftId/reservation
// O dono do evento pode liberar uma reserva feita por engano.
router.delete(
  '/:giftId/reservation',
  wrap(async (req, res) => {
    await findGiftInEvent(req.params.giftId, req.event.id);
    const gift = await prisma.gift.update({
      where: { id: req.params.giftId },
      data: { reservedByGuestId: null, reservedByName: null, reservedAt: null },
      include: { options: true },
    });
    res.json({ gift });
  })
);

// DELETE /api/events/:eventId/gifts/:giftId
router.delete(
  '/:giftId',
  wrap(async (req, res) => {
    await findGiftInEvent(req.params.giftId, req.event.id);
    await prisma.gift.delete({ where: { id: req.params.giftId } });
    res.status(204).end();
  })
);

export default router;
