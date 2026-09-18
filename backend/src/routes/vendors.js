import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { ApiError, wrap, parse, slugify } from '../lib/http.js';
import { requireAuth, optionalAuth, requireVendor } from '../lib/auth.js';

const router = Router();

export const VENDOR_CATEGORIES = [
  'fotografia',
  'filmagem',
  'decoracao',
  'buffet',
  'doces',
  'bolo',
  'musica',
  'maquiagem',
  'espacos',
  'convites',
  'lembrancinhas',
  'outros',
];

const vendorSchema = z.object({
  businessName: z.string().min(2, 'Informe o nome do seu negocio'),
  category: z.enum(VENDOR_CATEGORIES),
  description: z.string().default(''),
  city: z.string().min(2, 'Informe a cidade'),
  state: z.string().default(''),
  servesCities: z.string().default(''),
  priceFrom: z.coerce.number().min(0).nullish(),
  priceUnit: z.enum(['evento', 'pessoa', 'hora', 'diaria']).default('evento'),
  phone: z.string().default(''),
  whatsapp: z.string().default(''),
  instagram: z.string().default(''),
  website: z.string().default(''),
  coverImage: z.string().default(''),
});

const vendorPublicFields = {
  id: true,
  slug: true,
  businessName: true,
  category: true,
  description: true,
  city: true,
  state: true,
  servesCities: true,
  priceFrom: true,
  priceUnit: true,
  instagram: true,
  website: true,
  coverImage: true,
  isFeatured: true,
  ratingAvg: true,
  reviewCount: true,
};

async function uniqueSlug(businessName) {
  const base = slugify(businessName) || 'fornecedor';
  let candidate = base;
  let n = 1;
  while (await prisma.vendor.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${++n}`;
  }
  return candidate;
}

// ---------------------------------------------------------------
// Busca publica
// ---------------------------------------------------------------

// GET /api/vendors?category=buffet&city=Rio&q=doce&page=1
router.get(
  '/',
  wrap(async (req, res) => {
    const { category, city, q } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const perPage = Math.min(48, Number(req.query.perPage) || 12);

    const where = { isActive: true };
    if (category && category !== 'all') where.category = category;
    if (city) {
      where.OR = [{ city: { contains: city } }, { servesCities: { contains: city } }];
    }
    if (q) {
      where.AND = [
        {
          OR: [
            { businessName: { contains: q } },
            { description: { contains: q } },
          ],
        },
      ];
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        select: {
          ...vendorPublicFields,
          photos: { take: 1, orderBy: { position: 'asc' }, select: { url: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { ratingAvg: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.vendor.count({ where }),
    ]);

    res.json({ vendors, total, page, perPage, pages: Math.ceil(total / perPage) });
  })
);

// GET /api/vendors/categories
router.get('/categories', (_req, res) => {
  res.json({ categories: VENDOR_CATEGORIES });
});

// ---------------------------------------------------------------
// Perfil do fornecedor logado  (precisa vir ANTES de /:idOrSlug)
// ---------------------------------------------------------------

// GET /api/vendors/me
router.get(
  '/me',
  requireAuth,
  requireVendor,
  wrap(async (req, res) => {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.vendor.id },
      include: {
        photos: { orderBy: { position: 'asc' } },
        _count: { select: { quoteRequests: true, reviews: true } },
      },
    });
    res.json({ vendor });
  })
);

// POST /api/vendors  -> cria o perfil de fornecedor do usuario logado
router.post(
  '/',
  requireAuth,
  wrap(async (req, res) => {
    const existing = await prisma.vendor.findUnique({ where: { userId: req.user.id } });
    if (existing) throw new ApiError(409, 'Voce ja tem um perfil de fornecedor');

    const data = parse(vendorSchema, req.body);
    const vendor = await prisma.vendor.create({
      data: {
        ...data,
        priceFrom: data.priceFrom ?? null,
        userId: req.user.id,
        slug: await uniqueSlug(data.businessName),
      },
    });
    res.status(201).json({ vendor });
  })
);

// PATCH /api/vendors/me
router.patch(
  '/me',
  requireAuth,
  requireVendor,
  wrap(async (req, res) => {
    const data = parse(
      vendorSchema.partial().extend({ isActive: z.boolean().optional() }),
      req.body
    );
    const vendor = await prisma.vendor.update({
      where: { id: req.vendor.id },
      data,
      include: { photos: { orderBy: { position: 'asc' } } },
    });
    res.json({ vendor });
  })
);

// POST /api/vendors/me/photos   { url, caption? }
router.post(
  '/me/photos',
  requireAuth,
  requireVendor,
  wrap(async (req, res) => {
    const data = parse(
      z.object({ url: z.string().min(1, 'Informe a URL da foto'), caption: z.string().default('') }),
      req.body
    );
    const count = await prisma.vendorPhoto.count({ where: { vendorId: req.vendor.id } });
    if (count >= 20) throw new ApiError(400, 'Limite de 20 fotos no portfolio');

    const photo = await prisma.vendorPhoto.create({
      data: { ...data, vendorId: req.vendor.id, position: count },
    });
    res.status(201).json({ photo });
  })
);

// DELETE /api/vendors/me/photos/:photoId
router.delete(
  '/me/photos/:photoId',
  requireAuth,
  requireVendor,
  wrap(async (req, res) => {
    const photo = await prisma.vendorPhoto.findUnique({ where: { id: req.params.photoId } });
    if (!photo || photo.vendorId !== req.vendor.id) {
      throw new ApiError(404, 'Foto nao encontrada');
    }
    await prisma.vendorPhoto.delete({ where: { id: photo.id } });
    res.status(204).end();
  })
);

// GET /api/vendors/me/quotes  -> orcamentos que pediram para mim
router.get(
  '/me/quotes',
  requireAuth,
  requireVendor,
  wrap(async (req, res) => {
    const quotes = await prisma.quoteRequest.findMany({
      where: { vendorId: req.vendor.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ quotes });
  })
);

// PATCH /api/vendors/me/quotes/:quoteId  -> responder o orcamento
router.patch(
  '/me/quotes/:quoteId',
  requireAuth,
  requireVendor,
  wrap(async (req, res) => {
    const quote = await prisma.quoteRequest.findUnique({ where: { id: req.params.quoteId } });
    if (!quote || quote.vendorId !== req.vendor.id) {
      throw new ApiError(404, 'Pedido de orcamento nao encontrado');
    }

    const data = parse(
      z.object({
        status: z.enum(['pendente', 'respondido', 'aceito', 'recusado']).optional(),
        vendorReply: z.string().optional(),
        quotedPrice: z.coerce.number().min(0).nullish(),
      }),
      req.body
    );

    const updated = await prisma.quoteRequest.update({
      where: { id: quote.id },
      data: {
        ...data,
        status: data.status || (data.vendorReply ? 'respondido' : quote.status),
        repliedAt: data.vendorReply ? new Date() : quote.repliedAt,
      },
    });
    res.json({ quote: updated });
  })
);

// ---------------------------------------------------------------
// Perfil publico de um fornecedor
// ---------------------------------------------------------------

// GET /api/vendors/:idOrSlug
router.get(
  '/:idOrSlug',
  wrap(async (req, res) => {
    const key = req.params.idOrSlug;
    const vendor = await prisma.vendor.findFirst({
      where: { OR: [{ id: key }, { slug: key }], isActive: true },
      select: {
        ...vendorPublicFields,
        phone: true,
        whatsapp: true,
        photos: { orderBy: { position: 'asc' } },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            author: { select: { name: true } },
          },
        },
      },
    });

    if (!vendor) throw new ApiError(404, 'Fornecedor nao encontrado');
    res.json({ vendor });
  })
);

// POST /api/vendors/:idOrSlug/quotes  -> pedir orcamento (nao exige login)
router.post(
  '/:idOrSlug/quotes',
  optionalAuth,
  wrap(async (req, res) => {
    const key = req.params.idOrSlug;
    const vendor = await prisma.vendor.findFirst({
      where: { OR: [{ id: key }, { slug: key }], isActive: true },
    });
    if (!vendor) throw new ApiError(404, 'Fornecedor nao encontrado');

    const data = parse(
      z.object({
        name: z.string().min(2, 'Informe seu nome'),
        email: z.string().email('E-mail invalido'),
        phone: z.string().default(''),
        eventType: z.string().default(''),
        eventDate: z.coerce.date().optional(),
        guestCount: z.coerce.number().int().min(0).nullish(),
        city: z.string().default(''),
        message: z.string().default(''),
        eventId: z.string().optional(),
      }),
      req.body
    );

    // So aceita vincular a um evento se ele for mesmo de quem esta logado.
    let eventId = null;
    if (data.eventId && req.user) {
      const event = await prisma.event.findUnique({ where: { id: data.eventId } });
      if (event && event.ownerId === req.user.id) eventId = event.id;
    }

    const quote = await prisma.quoteRequest.create({
      data: {
        ...data,
        guestCount: data.guestCount ?? null,
        eventDate: data.eventDate ?? null,
        eventId,
        vendorId: vendor.id,
        requesterId: req.user?.id ?? null,
      },
    });

    res.status(201).json({ quote });
  })
);

// POST /api/vendors/:idOrSlug/reviews  -> avaliar (exige login)
router.post(
  '/:idOrSlug/reviews',
  requireAuth,
  wrap(async (req, res) => {
    const key = req.params.idOrSlug;
    const vendor = await prisma.vendor.findFirst({
      where: { OR: [{ id: key }, { slug: key }] },
    });
    if (!vendor) throw new ApiError(404, 'Fornecedor nao encontrado');
    if (vendor.userId === req.user.id) {
      throw new ApiError(403, 'Voce nao pode avaliar o proprio perfil');
    }

    const data = parse(
      z.object({
        rating: z.coerce.number().int().min(1).max(5),
        comment: z.string().default(''),
      }),
      req.body
    );

    // upsert: cada pessoa tem uma avaliacao por fornecedor
    await prisma.review.upsert({
      where: { vendorId_authorId: { vendorId: vendor.id, authorId: req.user.id } },
      update: data,
      create: { ...data, vendorId: vendor.id, authorId: req.user.id },
    });

    // recalcula a media
    const agg = await prisma.review.aggregate({
      where: { vendorId: vendor.id },
      _avg: { rating: true },
      _count: { _all: true },
    });

    const updated = await prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        ratingAvg: Number((agg._avg.rating || 0).toFixed(2)),
        reviewCount: agg._count._all,
      },
      select: { id: true, ratingAvg: true, reviewCount: true },
    });

    res.status(201).json({ vendor: updated });
  })
);

export default router;
