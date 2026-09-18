import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { ApiError, wrap, parse } from '../lib/http.js';

// Nenhuma rota aqui exige login: e o que o convidado acessa pelo link.
const router = Router();

/** Remove do presente os campos que so o organizador deve ver. */
function publicGift(gift) {
  return {
    id: gift.id,
    name: gift.name,
    category: gift.category,
    image: gift.image,
    description: gift.description,
    options: gift.options,
    // o convidado ve que ja foi escolhido, mas nao por quem
    taken: gift.received || Boolean(gift.reservedByGuestId || gift.reservedByName),
  };
}

// GET /api/public/events/:publicCode
// Pagina publica do evento (sem a lista de convidados).
router.get(
  '/events/:publicCode',
  wrap(async (req, res) => {
    const event = await prisma.event.findUnique({
      where: { publicCode: req.params.publicCode },
      include: {
        personalization: true,
        gifts: { include: { options: { orderBy: { price: 'asc' } } } },
      },
    });

    if (!event) throw new ApiError(404, 'Evento nao encontrado');
    if (!event.isPublished) {
      throw new ApiError(404, 'Este evento ainda nao foi publicado');
    }

    const p = event.personalization;
    const confirmedCount = p?.showGuestCount
      ? await prisma.guest.count({ where: { eventId: event.id, rsvp: 'confirmed' } })
      : null;

    res.json({
      event: {
        id: event.id,
        publicCode: event.publicCode,
        name: event.name,
        type: event.type,
        date: event.date,
        time: event.time,
        venue: event.venue,
        address: event.address,
        city: event.city,
        description: event.description,
        hosts: event.hosts,
        coverImage: event.coverImage,
        personalization: p,
      },
      gifts: p?.showGiftList ? event.gifts.map(publicGift) : [],
      confirmedCount,
    });
  })
);

// GET /api/public/invite/:inviteToken
// Convite individual: o convidado abre e ja ve o proprio nome.
router.get(
  '/invite/:inviteToken',
  wrap(async (req, res) => {
    const guest = await prisma.guest.findUnique({
      where: { inviteToken: req.params.inviteToken },
      include: {
        event: {
          include: {
            personalization: true,
            gifts: { include: { options: { orderBy: { price: 'asc' } } } },
          },
        },
      },
    });

    if (!guest) throw new ApiError(404, 'Convite nao encontrado');

    const { event } = guest;
    const p = event.personalization;

    res.json({
      guest: {
        id: guest.id,
        name: guest.name,
        rsvp: guest.rsvp,
        plusOne: guest.plusOne,
        plusOneName: guest.plusOneName,
        companions: guest.companions,
        dietaryNotes: guest.dietaryNotes,
        tableName: guest.tableName,
        respondedAt: guest.respondedAt,
      },
      event: {
        id: event.id,
        publicCode: event.publicCode,
        name: event.name,
        type: event.type,
        date: event.date,
        time: event.time,
        venue: event.venue,
        address: event.address,
        city: event.city,
        description: event.description,
        hosts: event.hosts,
        coverImage: event.coverImage,
        personalization: p,
      },
      gifts: p?.showGiftList ? event.gifts.map(publicGift) : [],
    });
  })
);

// POST /api/public/invite/:inviteToken/rsvp
router.post(
  '/invite/:inviteToken/rsvp',
  wrap(async (req, res) => {
    const guest = await prisma.guest.findUnique({
      where: { inviteToken: req.params.inviteToken },
      include: { event: { include: { personalization: true } } },
    });
    if (!guest) throw new ApiError(404, 'Convite nao encontrado');
    if (guest.event.personalization?.showRsvp === false) {
      throw new ApiError(403, 'As confirmacoes estao fechadas para este evento');
    }

    const data = parse(
      z.object({
        rsvp: z.enum(['confirmed', 'declined']),
        plusOne: z.boolean().optional(),
        plusOneName: z.string().optional(),
        companions: z.coerce.number().int().min(0).max(20).optional(),
        dietaryNotes: z.string().optional(),
        phone: z.string().optional(),
      }),
      req.body
    );

    const updated = await prisma.guest.update({
      where: { id: guest.id },
      data: {
        ...data,
        // quem recusou nao leva acompanhante
        ...(data.rsvp === 'declined' ? { plusOne: false, companions: 0 } : {}),
        respondedAt: new Date(),
      },
    });

    res.json({
      guest: {
        id: updated.id,
        name: updated.name,
        rsvp: updated.rsvp,
        plusOne: updated.plusOne,
        plusOneName: updated.plusOneName,
        companions: updated.companions,
        respondedAt: updated.respondedAt,
      },
    });
  })
);

// POST /api/public/gifts/:giftId/reserve
// O convidado reserva um presente para ninguem mais comprar igual.
// Corpo: { inviteToken?, name? } — um dos dois identifica quem reservou.
router.post(
  '/gifts/:giftId/reserve',
  wrap(async (req, res) => {
    const data = parse(
      z.object({
        inviteToken: z.string().optional(),
        name: z.string().optional(),
      }),
      req.body || {}
    );

    const gift = await prisma.gift.findUnique({ where: { id: req.params.giftId } });
    if (!gift) throw new ApiError(404, 'Presente nao encontrado');
    if (gift.received || gift.reservedByGuestId || gift.reservedByName) {
      throw new ApiError(409, 'Esse presente ja foi escolhido por outra pessoa');
    }

    let guestId = null;
    let name = data.name?.trim() || null;

    if (data.inviteToken) {
      const guest = await prisma.guest.findUnique({
        where: { inviteToken: data.inviteToken },
      });
      if (!guest || guest.eventId !== gift.eventId) {
        throw new ApiError(403, 'Convite invalido para este evento');
      }
      guestId = guest.id;
      name = name || guest.name;
    }

    if (!guestId && !name) {
      throw new ApiError(400, 'Informe seu nome para reservar o presente');
    }

    const updated = await prisma.gift.update({
      where: { id: gift.id },
      data: { reservedByGuestId: guestId, reservedByName: name, reservedAt: new Date() },
      include: { options: true },
    });

    res.json({ gift: publicGift(updated) });
  })
);

export default router;
