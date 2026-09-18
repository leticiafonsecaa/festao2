import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { ApiError, wrap, parse, shortCode } from '../lib/http.js';
import { requireAuth, requireEventOwner } from '../lib/auth.js';

// mergeParams: true para enxergar o :eventId da rota pai.
const router = Router({ mergeParams: true });
router.use(requireAuth, requireEventOwner);

const guestSchema = z.object({
  name: z.string().min(2, 'Informe o nome do convidado'),
  email: z.string().email('E-mail invalido').optional().or(z.literal('')),
  phone: z.string().optional(),
  rsvp: z.enum(['pending', 'confirmed', 'declined']).default('pending'),
  plusOne: z.boolean().default(false),
  plusOneName: z.string().optional(),
  companions: z.coerce.number().int().min(0).max(20).default(0),
  tableName: z.string().optional(),
  dietaryNotes: z.string().optional(),
  notes: z.string().optional(),
});

async function uniqueInviteToken() {
  for (let i = 0; i < 10; i++) {
    const token = shortCode(10);
    const taken = await prisma.guest.findUnique({ where: { inviteToken: token } });
    if (!taken) return token;
  }
  return shortCode(16);
}

/** Garante que o convidado pertence mesmo ao evento da URL. */
async function findGuestInEvent(guestId, eventId) {
  const guest = await prisma.guest.findUnique({ where: { id: guestId } });
  if (!guest || guest.eventId !== eventId) {
    throw new ApiError(404, 'Convidado nao encontrado neste evento');
  }
  return guest;
}

// GET /api/events/:eventId/guests?rsvp=confirmed&q=maria
router.get(
  '/',
  wrap(async (req, res) => {
    const { rsvp, q } = req.query;

    const where = { eventId: req.event.id };
    if (rsvp && ['pending', 'confirmed', 'declined'].includes(rsvp)) {
      where.rsvp = rsvp;
    }
    if (q) {
      where.OR = [{ name: { contains: q } }, { email: { contains: q } }];
    }

    const guests = await prisma.guest.findMany({ where, orderBy: { name: 'asc' } });

    // Total de pessoas = convidado + acompanhante + criancas, so dos confirmados.
    const confirmed = guests.filter((g) => g.rsvp === 'confirmed');
    const headcount = confirmed.reduce(
      (sum, g) => sum + 1 + (g.plusOne ? 1 : 0) + g.companions,
      0
    );

    res.json({
      guests,
      stats: {
        total: guests.length,
        confirmed: confirmed.length,
        pending: guests.filter((g) => g.rsvp === 'pending').length,
        declined: guests.filter((g) => g.rsvp === 'declined').length,
        checkedIn: guests.filter((g) => g.checkedIn).length,
        headcount,
      },
    });
  })
);

// POST /api/events/:eventId/guests
router.post(
  '/',
  wrap(async (req, res) => {
    const data = parse(guestSchema, req.body);
    const guest = await prisma.guest.create({
      data: {
        ...data,
        email: data.email || null,
        eventId: req.event.id,
        inviteToken: await uniqueInviteToken(),
      },
    });
    res.status(201).json({ guest });
  })
);

// POST /api/events/:eventId/guests/import
// Recebe { guests: [{ name, email, phone }, ...] } — util para colar uma
// lista vinda de planilha. Ignora nomes repetidos que ja existem no evento.
router.post(
  '/import',
  wrap(async (req, res) => {
    const { guests } = parse(
      z.object({
        guests: z
          .array(
            z.object({
              name: z.string().min(2),
              email: z.string().optional(),
              phone: z.string().optional(),
            })
          )
          .min(1, 'Envie ao menos um convidado'),
      }),
      req.body
    );

    const existing = await prisma.guest.findMany({
      where: { eventId: req.event.id },
      select: { name: true },
    });
    const known = new Set(existing.map((g) => g.name.trim().toLowerCase()));

    const created = [];
    const skipped = [];

    for (const row of guests) {
      const key = row.name.trim().toLowerCase();
      if (known.has(key)) {
        skipped.push(row.name);
        continue;
      }
      known.add(key);
      created.push(
        await prisma.guest.create({
          data: {
            name: row.name.trim(),
            email: row.email || null,
            phone: row.phone || null,
            eventId: req.event.id,
            inviteToken: await uniqueInviteToken(),
          },
        })
      );
    }

    res.status(201).json({ created, createdCount: created.length, skipped });
  })
);

// PATCH /api/events/:eventId/guests/:guestId
router.patch(
  '/:guestId',
  wrap(async (req, res) => {
    await findGuestInEvent(req.params.guestId, req.event.id);
    const data = parse(guestSchema.partial(), req.body);
    const guest = await prisma.guest.update({
      where: { id: req.params.guestId },
      data: { ...data, ...(data.email !== undefined ? { email: data.email || null } : {}) },
    });
    res.json({ guest });
  })
);

// POST /api/events/:eventId/guests/:guestId/checkin
router.post(
  '/:guestId/checkin',
  wrap(async (req, res) => {
    const current = await findGuestInEvent(req.params.guestId, req.event.id);
    const guest = await prisma.guest.update({
      where: { id: current.id },
      data: {
        checkedIn: !current.checkedIn,
        checkedInAt: current.checkedIn ? null : new Date(),
      },
    });
    res.json({ guest });
  })
);

// DELETE /api/events/:eventId/guests/:guestId
router.delete(
  '/:guestId',
  wrap(async (req, res) => {
    await findGuestInEvent(req.params.guestId, req.event.id);
    await prisma.guest.delete({ where: { id: req.params.guestId } });
    res.status(204).end();
  })
);

export default router;
