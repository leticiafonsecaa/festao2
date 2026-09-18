import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const alphabet = 'abcdefghijkmnopqrstuvwxyz23456789';
const code = (n = 7) =>
  Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');

const slugify = (t) =>
  t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const fornecedores = [
  {
    businessName: 'Luz & Arte Fotografia',
    category: 'fotografia',
    city: 'São Paulo',
    state: 'SP',
    description:
      'Fotografia artística para casamentos e eventos especiais. Trabalhamos com luz natural e um olhar documental, sem poses forçadas.',
    priceFrom: 2500,
    priceUnit: 'evento',
    isFeatured: true,
    instagram: '@luzeartefoto',
  },
  {
    businessName: 'Ateliê Florescer',
    category: 'decoracao',
    city: 'Rio de Janeiro',
    state: 'RJ',
    description:
      'Decorações com flores naturais que transformam qualquer espaço. Projeto personalizado do conceito à montagem.',
    priceFrom: 3000,
    priceUnit: 'evento',
    instagram: '@atelieflorescer',
  },
  {
    businessName: 'Sabor & Arte Buffet',
    category: 'buffet',
    city: 'Belo Horizonte',
    state: 'MG',
    description: 'Buffet completo com cardápio personalizado, equipe de salão e louças inclusas.',
    priceFrom: 180,
    priceUnit: 'pessoa',
    isFeatured: true,
  },
  {
    businessName: 'DJ Pulse Events',
    category: 'musica',
    city: 'Curitiba',
    state: 'PR',
    description: 'DJ e sonorização completa para festas. Iluminação e pista de dança inclusas.',
    priceFrom: 1800,
    priceUnit: 'evento',
  },
  {
    businessName: 'Doce Encanto Confeitaria',
    category: 'doces',
    city: 'Rio de Janeiro',
    state: 'RJ',
    description: 'Mesa de doces finos e bem-casados feitos artesanalmente, com degustação prévia.',
    priceFrom: 6,
    priceUnit: 'pessoa',
  },
  {
    businessName: 'Espaço Jardim das Acácias',
    category: 'espacos',
    city: 'Niterói',
    state: 'RJ',
    description:
      'Espaço ao ar livre para até 250 convidados, com área coberta para chuva e estacionamento próprio.',
    priceFrom: 9000,
    priceUnit: 'diaria',
    isFeatured: true,
  },
  {
    businessName: 'Studio Bella Make',
    category: 'maquiagem',
    city: 'São Paulo',
    state: 'SP',
    description: 'Maquiagem e penteado para noivas e madrinhas, com atendimento a domicílio.',
    priceFrom: 450,
    priceUnit: 'evento',
  },
  {
    businessName: 'Papel & Laço Convites',
    category: 'convites',
    city: 'Porto Alegre',
    state: 'RS',
    description: 'Convites impressos e digitais sob medida, do papel especial ao envelope lacrado.',
    priceFrom: 12,
    priceUnit: 'evento',
  },
];

async function main() {
  console.log('Limpando o banco...');
  // ordem importa por causa das chaves estrangeiras
  await prisma.review.deleteMany();
  await prisma.quoteRequest.deleteMany();
  await prisma.vendorPhoto.deleteMany();
  await prisma.budgetItem.deleteMany();
  await prisma.giftOption.deleteMany();
  await prisma.gift.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.personalization.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  const senha = await bcrypt.hash('123456', 10);

  // ----- organizadora de exemplo -----
  const leticia = await prisma.user.create({
    data: {
      name: 'Letícia Fonseca',
      email: 'leticia@festao.com',
      passwordHash: senha,
      phone: '(21) 99999-0000',
    },
  });

  // ----- fornecedores -----
  console.log('Criando fornecedores...');
  for (const [i, f] of fornecedores.entries()) {
    const user = await prisma.user.create({
      data: {
        name: f.businessName,
        email: `${slugify(f.businessName)}@festao.com`,
        passwordHash: senha,
      },
    });

    await prisma.vendor.create({
      data: {
        ...f,
        userId: user.id,
        slug: slugify(f.businessName),
        servesCities: f.city,
        phone: `(11) 9${1000 + i}-0000`,
        whatsapp: `(11) 9${1000 + i}-0000`,
        ratingAvg: Number((4.5 + Math.random() * 0.5).toFixed(1)),
        reviewCount: 20 + Math.floor(Math.random() * 180),
      },
    });
  }

  // ----- evento de exemplo -----
  console.log('Criando evento de exemplo...');
  const casamento = await prisma.event.create({
    data: {
      ownerId: leticia.id,
      publicCode: code(),
      name: 'Casamento Letícia & Rafael',
      type: 'casamento',
      date: new Date('2026-11-14T00:00:00.000Z'),
      time: '17:00',
      venue: 'Espaço Jardim das Acácias',
      address: 'Estrada da Serra, 1200',
      city: 'Niterói',
      hosts: 'Letícia e Rafael',
      description: 'Vamos casar e queremos você com a gente nesse dia.',
      isPublished: true,
      personalization: { create: { tagline: 'Faltam poucos dias para o nosso sim' } },
    },
  });

  const convidados = [
    { name: 'Ana Paula Ribeiro', rsvp: 'confirmed', plusOne: true, plusOneName: 'Carlos Ribeiro' },
    { name: 'Bruno Machado', rsvp: 'confirmed' },
    { name: 'Carla Menezes', rsvp: 'pending' },
    { name: 'Diego Salles', rsvp: 'declined' },
    { name: 'Elisa Tavares', rsvp: 'confirmed', companions: 2, dietaryNotes: 'Sem lactose' },
    { name: 'Fernando Lopes', rsvp: 'pending' },
  ];

  for (const c of convidados) {
    await prisma.guest.create({
      data: {
        ...c,
        eventId: casamento.id,
        inviteToken: code(10),
        respondedAt: c.rsvp === 'pending' ? null : new Date(),
      },
    });
  }

  const presentes = [
    {
      name: 'Jogo de panelas',
      category: 'Cozinha',
      options: [
        { store: 'Loja A', price: 899.9, url: 'https://exemplo.com/panelas' },
        { store: 'Loja B', price: 949.0, url: 'https://exemplo.com/panelas-b' },
      ],
    },
    {
      name: 'Jogo de cama queen',
      category: 'Quarto',
      options: [{ store: 'Loja A', price: 420, url: 'https://exemplo.com/cama' }],
    },
    {
      name: 'Liquidificador',
      category: 'Cozinha',
      options: [{ store: 'Loja C', price: 310, url: 'https://exemplo.com/liquidificador' }],
    },
    {
      name: 'Cota lua de mel',
      category: 'Viagem',
      options: [{ store: 'Pix', price: 200, url: '' }],
    },
  ];

  for (const p of presentes) {
    await prisma.gift.create({
      data: {
        name: p.name,
        category: p.category,
        eventId: casamento.id,
        options: { create: p.options },
      },
    });
  }

  await prisma.budgetItem.createMany({
    data: [
      { eventId: casamento.id, title: 'Buffet', category: 'buffet', estimatedCost: 18000, status: 'contratado', actualCost: 17500 },
      { eventId: casamento.id, title: 'Fotografia', category: 'fotografia', estimatedCost: 4000, status: 'previsto' },
      { eventId: casamento.id, title: 'Decoração', category: 'decoracao', estimatedCost: 6500, status: 'previsto' },
    ],
  });

  console.log('\nPronto!');
  console.log('Login de teste:  leticia@festao.com  /  123456');
  console.log(`Link publico do evento: /convite/${casamento.publicCode}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
