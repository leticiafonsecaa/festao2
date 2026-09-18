import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight, Search, Star, MapPin, Camera, Palette,
  UtensilsCrossed, Music, Brush, Building2, Grid3X3,
  Cake, Video, Mail as MailIcon, Gift as GiftIcon, MoreHorizontal,
  Plus, Loader2,
} from 'lucide-react';
import { api, ApiError, type Vendor } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  })
};

const categories: { id: string; label: string; icon: typeof Grid3X3 }[] = [
  { id: 'all', label: 'Todos', icon: Grid3X3 },
  { id: 'fotografia', label: 'Fotografia', icon: Camera },
  { id: 'filmagem', label: 'Filmagem', icon: Video },
  { id: 'decoracao', label: 'Decoração', icon: Palette },
  { id: 'buffet', label: 'Buffet', icon: UtensilsCrossed },
  { id: 'doces', label: 'Doces', icon: Cake },
  { id: 'bolo', label: 'Bolo', icon: Cake },
  { id: 'musica', label: 'Música/DJ', icon: Music },
  { id: 'maquiagem', label: 'Maquiagem', icon: Brush },
  { id: 'espacos', label: 'Espaços', icon: Building2 },
  { id: 'convites', label: 'Convites', icon: MailIcon },
  { id: 'lembrancinhas', label: 'Lembrancinhas', icon: GiftIcon },
  { id: 'outros', label: 'Outros', icon: MoreHorizontal },
];

const categoryIcon = (id: string) => categories.find((c) => c.id === id)?.icon || Grid3X3;

const priceUnitLabel: Record<string, string> = {
  evento: '/evento',
  pessoa: '/pessoa',
  hora: '/hora',
  diaria: '/diária',
};

function formatPrice(vendor: Vendor) {
  if (vendor.priceFrom == null) return 'Sob consulta';
  const value = vendor.priceFrom.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return `A partir de ${value}${priceUnitLabel[vendor.priceUnit] || ''}`;
}

export default function ServicesPage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [city, setCity] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // debounce simples pra nao disparar uma busca a cada tecla digitada
  useEffect(() => {
    setLoading(true);
    setError('');
    const timer = setTimeout(() => {
      api.vendors
        .search({ category: selectedCategory, q: searchQuery || undefined, city: city || undefined, page })
        .then((res) => {
          setVendors(res.vendors);
          setTotal(res.total);
          setPages(res.pages);
        })
        .catch((err) => setError(err instanceof ApiError ? err.message : 'Não foi possível buscar os fornecedores.'))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery, city, page]);

  // volta pra pagina 1 quando o filtro muda
  useEffect(() => setPage(1), [selectedCategory, searchQuery, city]);

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto section-padding">
        {/* Breadcrumb */}
        <motion.div initial="hidden" animate="visible">
          <motion.div custom={0} variants={fadeUp} className="flex items-center gap-2 text-sm text-charcoal-light mb-2">
            <Link to="/" className="hover:text-charcoal transition-colors">Início</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-charcoal">Serviços</span>
          </motion.div>
        </motion.div>

        {/* Header */}
        <motion.div initial="hidden" animate="visible" className="mb-8">
          <motion.div custom={1} variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl lg:text-4xl font-semibold mb-1 tracking-tight">
                Encontre o <span className="italic text-rose">profissional</span> ideal
              </h1>
              <p className="text-charcoal-light text-lg max-w-xl">
                Marketplace de fornecedores para o seu evento. Compare, avalie e peça orçamento.
              </p>
            </div>
            <Link
              to={user ? '/fornecedor' : '/entrar'}
              className="btn-secondary flex items-center justify-center gap-2 text-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Anunciar meu serviço
            </Link>
          </motion.div>
        </motion.div>

        {/* Search + Filters */}
        <motion.div initial="hidden" animate="visible" className="mb-8">
          <motion.div custom={2} variants={fadeUp} className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-light/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome ou descrição..."
                className="w-full bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm border border-charcoal/10
                           outline-none focus:ring-2 focus:ring-blush/30 transition-shadow"
              />
            </div>
            <div className="relative flex-1 max-w-xs">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-light/50" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Cidade"
                className="w-full bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm border border-charcoal/10
                           outline-none focus:ring-2 focus:ring-blush/30 transition-shadow"
              />
            </div>
          </motion.div>

          {/* Category tabs */}
          <motion.div custom={3} variants={fadeUp} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap
                           transition-all duration-200 flex-shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-charcoal text-ivory'
                    : 'bg-white text-charcoal-light border border-charcoal/10 hover:bg-charcoal/5'
                }`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            ))}
          </motion.div>
        </motion.div>

        {/* Results count */}
        <motion.div initial="hidden" animate="visible">
          <motion.p custom={4} variants={fadeUp} className="text-sm text-charcoal-light mb-6">
            {loading ? 'Buscando...' : `${total} fornecedores encontrados`}
          </motion.p>
        </motion.div>

        {error && <p className="text-sm text-rose mb-6">{error}</p>}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-blush animate-spin" />
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-20 text-charcoal-light">
            Nenhum fornecedor encontrado com esses filtros.
          </div>
        ) : (
          <motion.div initial="hidden" animate="visible" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {vendors.map((vendor, i) => {
              const CategoryIcon = categoryIcon(vendor.category);
              const photo = vendor.photos?.[0]?.url;
              return (
                <motion.div key={vendor.id} custom={i + 5} variants={fadeUp}>
                  <Link to={`/profissional/${vendor.slug}`} className="block card-base group">
                    <div className="h-44 -mx-6 -mt-6 mb-4 rounded-t-3xl bg-cream flex items-center justify-center relative overflow-hidden">
                      {photo ? (
                        <img src={photo} alt={vendor.businessName} className="w-full h-full object-cover" />
                      ) : (
                        <CategoryIcon className="w-10 h-10 text-charcoal-light/30" />
                      )}
                      {vendor.isFeatured && (
                        <span className="absolute top-3 left-3 bg-blush text-white text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3 fill-white" />
                          Destaque
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-base font-semibold group-hover:text-rose transition-colors truncate mb-1">
                        {vendor.businessName}
                      </h3>

                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs bg-cream px-2 py-0.5 rounded-md text-charcoal-light flex items-center gap-1">
                          <CategoryIcon className="w-3 h-3" />
                          {categories.find((c) => c.id === vendor.category)?.label || vendor.category}
                        </span>
                        <span className="text-xs text-charcoal-light flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {vendor.city}{vendor.state ? `, ${vendor.state}` : ''}
                        </span>
                      </div>

                      {vendor.description && (
                        <p className="text-xs text-charcoal-light leading-relaxed mb-3 line-clamp-2">
                          {vendor.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-blush fill-blush" />
                          <span className="text-xs font-semibold">
                            {vendor.reviewCount > 0 ? vendor.ratingAvg.toFixed(1) : 'Novo'}
                          </span>
                          {vendor.reviewCount > 0 && (
                            <span className="text-[10px] text-charcoal-light">({vendor.reviewCount})</span>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-sage">{formatPrice(vendor)}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  p === page ? 'bg-charcoal text-ivory' : 'bg-white border border-charcoal/10 hover:bg-charcoal/5'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
