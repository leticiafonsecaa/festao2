// Fake do @prisma/client, em memoria, so para o smoke test local.
// Suporta o suficiente de select/include/nested create para exercitar
// as rotas de verdade. Nao faz parte do servidor.

let seq = 0;
const id = () => `id${++seq}`;

const db = new Map();
const table = (name) => {
  if (!db.has(name)) db.set(name, []);
  return db.get(name);
};

// Mapa de relacoes, no lugar dos metadados que o Prisma real tem.
// fk   = a chave estrangeira mora nesta linha (belongsTo)
// via  = a chave estrangeira mora na outra tabela (hasMany / hasOne)
const REL = {
  events: { table: 'event', via: 'ownerId', list: true },
  guests: { table: 'guest', via: 'eventId', list: true },
  gifts: { table: 'gift', via: 'eventId', list: true },
  budgetItems: { table: 'budgetItem', via: 'eventId', list: true },
  options: { table: 'giftOption', via: 'giftId', list: true },
  photos: { table: 'vendorPhoto', via: 'vendorId', list: true },
  reviews: { table: 'review', via: 'vendorId', list: true },
  quoteRequests: { table: 'quoteRequest', via: 'vendorId', list: true },
  personalization: { table: 'personalization', via: 'eventId', list: false },
  vendor: { table: 'vendor', fk: 'vendorId', via: 'userId', list: false },
  event: { table: 'event', fk: 'eventId', list: false },
  owner: { table: 'user', fk: 'ownerId', list: false },
  user: { table: 'user', fk: 'userId', list: false },
  author: { table: 'user', fk: 'authorId', list: false },
  requester: { table: 'user', fk: 'requesterId', list: false },
  reservedByGuest: { table: 'guest', fk: 'reservedByGuestId', list: false },
};

// Espelha os @default() do schema.prisma, que o Prisma real aplica sozinho.
const DEFAULTS = {
  event: { time: '19:00', venue: '', address: '', city: '', description: '', hosts: '', coverImage: '', isPublished: false },
  personalization: {
    primaryColor: '#D4A89C',
    secondaryColor: '#C47D6B',
    heroImage: '',
    tagline: 'Celebre conosco este momento especial',
    showGuestCount: true,
    showGiftList: true,
    showRsvp: true,
    showCountdown: true,
  },
  guest: { rsvp: 'pending', plusOne: false, companions: 0, checkedIn: false },
  gift: { category: 'Geral', image: '', description: '', received: false },
  giftOption: { url: '' },
  budgetItem: { category: 'outros', estimatedCost: 0, actualCost: 0, status: 'previsto', notes: '' },
  vendor: {
    description: '',
    state: '',
    servesCities: '',
    priceUnit: 'evento',
    phone: '',
    whatsapp: '',
    instagram: '',
    website: '',
    coverImage: '',
    isActive: true,
    isFeatured: false,
    ratingAvg: 0,
    reviewCount: 0,
  },
  vendorPhoto: { caption: '', position: 0 },
  quoteRequest: { phone: '', eventType: '', city: '', message: '', status: 'pendente', vendorReply: '' },
  review: { comment: '' },
};

const withDefaults = (name, data) => ({ ...(DEFAULTS[name] || {}), ...data });

const clone = (r) => (r === null || r === undefined ? r : JSON.parse(JSON.stringify(r)));

function matches(row, where) {
  if (!where) return true;
  for (const [key, value] of Object.entries(where)) {
    if (key === 'OR') {
      if (!value.some((w) => matches(row, w))) return false;
    } else if (key === 'AND') {
      if (!value.every((w) => matches(row, w))) return false;
    } else if (value && typeof value === 'object' && !(value instanceof Date)) {
      if ('contains' in value) {
        if (!String(row[key] ?? '').toLowerCase().includes(String(value.contains).toLowerCase()))
          return false;
      } else {
        // chave composta, ex: vendorId_authorId: { vendorId, authorId }
        if (!Object.entries(value).every(([k, v]) => row[k] === v)) return false;
      }
    } else if (row[key] !== value) {
      return false;
    }
  }
  return true;
}

/** Resolve uma relacao a partir de uma linha. */
function resolveRelation(row, key, opts = {}) {
  const rel = REL[key];
  if (!rel) return undefined;

  // belongsTo: a fk esta nesta linha
  if (rel.fk && row[rel.fk] !== undefined && row[rel.fk] !== null) {
    const found = table(rel.table).find((r) => r.id === row[rel.fk]);
    return found ? shape(found, rel.table, opts) : null;
  }

  // hasMany / hasOne
  if (rel.via) {
    let children = table(rel.table).filter((r) => r[rel.via] === row.id);
    if (opts.where) children = children.filter((r) => matches(r, opts.where));
    if (opts.take) children = children.slice(0, opts.take);
    const shaped = children.map((c) => shape(c, rel.table, opts));
    return rel.list ? shaped : shaped[0] ?? null;
  }

  return rel.list ? [] : null;
}

/** Aplica select / include a uma linha, devolvendo uma copia. */
function shape(row, modelName, opts = {}) {
  const { select, include } = opts;
  let out;

  if (select) {
    out = {};
    for (const [key, value] of Object.entries(select)) {
      if (!value) continue;
      if (key === '_count') {
        out._count = countRelations(row, value.select);
      } else if (REL[key]) {
        out[key] = resolveRelation(row, key, typeof value === 'object' ? value : {});
      } else {
        out[key] = clone(row[key]);
      }
    }
    return out;
  }

  out = clone(row);
  if (include) {
    for (const [key, value] of Object.entries(include)) {
      if (!value) continue;
      if (key === '_count') {
        out._count = countRelations(row, value.select);
      } else {
        out[key] = resolveRelation(row, key, typeof value === 'object' ? value : {});
      }
    }
  }
  return out;
}

function countRelations(row, selectObj) {
  const counts = {};
  for (const key of Object.keys(selectObj || {})) {
    const rel = REL[key];
    counts[key] = rel?.via ? table(rel.table).filter((r) => r[rel.via] === row.id).length : 0;
  }
  return counts;
}

/** Executa writes aninhados ({ create: ... }) depois que a linha pai existe. */
function runNestedWrites(row, data) {
  for (const [key, value] of Object.entries(data)) {
    const rel = REL[key];
    if (!rel || !value || typeof value !== 'object' || !('create' in value)) continue;
    delete row[key];
    const payload = Array.isArray(value.create) ? value.create : [value.create];
    for (const child of payload) {
      table(rel.table).push({
        id: id(),
        createdAt: new Date(),
        ...withDefaults(rel.table, child),
        [rel.via]: row.id,
      });
    }
  }
}

/** Remove chaves de relacao do objeto salvo (o stub nao guarda objetos aninhados). */
function stripRelations(row) {
  for (const [k, v] of Object.entries(row)) {
    if (REL[k] && v && typeof v === 'object' && !(v instanceof Date)) delete row[k];
  }
}

function model(name) {
  const rows = () => table(name);

  return {
    findUnique: async ({ where, select, include }) => {
      const row = rows().find((r) => matches(r, where));
      return row ? shape(row, name, { select, include }) : null;
    },
    findFirst: async ({ where, select, include }) => {
      const row = rows().find((r) => matches(r, where));
      return row ? shape(row, name, { select, include }) : null;
    },
    findMany: async ({ where, select, include, skip = 0, take } = {}) => {
      let out = rows().filter((r) => matches(r, where));
      out = take ? out.slice(skip, skip + take) : out.slice(skip);
      return out.map((r) => shape(r, name, { select, include }));
    },
    count: async ({ where } = {}) => rows().filter((r) => matches(r, where)).length,

    create: async ({ data, select, include }) => {
      const row = { id: id(), createdAt: new Date(), ...withDefaults(name, data) };
      runNestedWrites(row, data);
      stripRelations(row);
      rows().push(row);
      return shape(row, name, { select, include });
    },
    createMany: async ({ data }) => {
      for (const d of data) rows().push({ id: id(), createdAt: new Date(), ...withDefaults(name, d) });
      return { count: data.length };
    },
    update: async ({ where, data, select, include }) => {
      const row = rows().find((r) => matches(r, where));
      if (!row) throw Object.assign(new Error('not found'), { code: 'P2025' });
      for (const [k, v] of Object.entries(data)) {
        if (REL[k] && v && typeof v === 'object' && 'create' in v) {
          runNestedWrites({ id: row.id }, { [k]: v });
          continue;
        }
        row[k] = v;
      }
      return shape(row, name, { select, include });
    },
    upsert: async ({ where, create, update, select, include }) => {
      const row = rows().find((r) => matches(r, where));
      if (row) {
        Object.assign(row, update);
        return shape(row, name, { select, include });
      }
      const created = { id: id(), createdAt: new Date(), ...withDefaults(name, create) };
      rows().push(created);
      return shape(created, name, { select, include });
    },
    delete: async ({ where }) => {
      const i = rows().findIndex((r) => matches(r, where));
      if (i === -1) throw Object.assign(new Error('not found'), { code: 'P2025' });
      return clone(rows().splice(i, 1)[0]);
    },
    deleteMany: async ({ where } = {}) => {
      const keep = rows().filter((r) => !matches(r, where));
      const count = rows().length - keep.length;
      db.set(name, keep);
      return { count };
    },
    groupBy: async ({ by, where }) => {
      const out = new Map();
      for (const r of rows().filter((x) => matches(x, where))) {
        const key = by.map((b) => r[b]).join('|');
        out.set(key, (out.get(key) || 0) + 1);
      }
      return [...out.entries()].map(([key, n]) => {
        const obj = { _count: { _all: n } };
        by.forEach((b, i) => (obj[b] = key.split('|')[i]));
        return obj;
      });
    },
    aggregate: async ({ where, _sum = {}, _avg = {}, _count }) => {
      const list = rows().filter((r) => matches(r, where));
      const res = {};
      if (Object.keys(_sum).length) {
        res._sum = {};
        for (const f of Object.keys(_sum)) res._sum[f] = list.reduce((s, r) => s + (r[f] || 0), 0);
      }
      if (Object.keys(_avg).length) {
        res._avg = {};
        for (const f of Object.keys(_avg))
          res._avg[f] = list.length ? list.reduce((s, r) => s + (r[f] || 0), 0) / list.length : 0;
      }
      if (_count) res._count = { _all: list.length };
      return res;
    },
  };
}

const MODELS = [
  'user',
  'event',
  'personalization',
  'guest',
  'gift',
  'giftOption',
  'budgetItem',
  'vendor',
  'vendorPhoto',
  'quoteRequest',
  'review',
];

export class PrismaClient {
  constructor() {
    for (const m of MODELS) this[m] = model(m);
  }
  async $disconnect() {}
}
