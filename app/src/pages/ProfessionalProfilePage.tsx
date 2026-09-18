import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight, Star, MapPin, Phone, Instagram, ExternalLink, MessageCircle,
  Calendar, CheckCircle2, ChevronLeft, Loader2, AlertCircle, Send,
} from 'lucide-react';
import { api, ApiError, type Vendor } from '../lib/api';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  })
};

const categoryLabel: Record<string, string> = {
  fotografia: 'Fotografia',
  filmagem: 'Filmagem',
  decoracao: 'Decoração',
  buffet: 'Buffet',
  doces: 'Doces',
  bolo: 'Bolo',
  musica: 'Música/DJ',
  maquiagem: 'Maquiagem',
  espacos: 'Espaços',
  convites: 'Convites',
  lembrancinhas: 'Lembrancinhas',
  outros: 'Outros',
};

const priceUnitLabel: Record<string, string> = {
  evento: '/evento',
  pessoa: '/pessoa',
  hora: '/hora',
  diaria: '/diária',
};

export default function ProfessionalProfilePage() {
  const { id: slug } = useParams<{ id: string }>();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteSent, setQuoteSent] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [sending, setSending] = useState(false);
  const [quote, setQuote] = useState({ name: '', email: '', phone: '', eventDate: '', guestCount: '', message: '' });

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.vendors
      .get(slug)
      .then(({ vendor }) => setVendor(vendor))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Fornecedor não encontrado.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const submitQuote = async (e: FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    setQuoteError('');
    setSending(true);
    try {
      await api.vendors.requestQuote(slug, {
        name: quote.name,
        email: quote.email,
        phone: quote.phone,
        eventDate: quote.eventDate || undefined,
        guestCount: quote.guestCount ? Number(quote.guestCount) : undefined,
        message: quote.message,
      });
      setQuoteSent(true);
    } catch (err) {
      setQuoteError(err instanceof ApiError ? err.message : 'Não foi possível enviar. Tente de novo.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blush animate-spin" />
      </main>
    );
  }

  if (error || !vendor) {
    return (
      <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm section-padding">
          <AlertCircle className="w-10 h-10 text-rose mx-auto mb-3" />
          <p className="text-charcoal-light mb-4">{error || 'Fornecedor não encontrado.'}</p>
          <Link to="/servicos" className="text-blush text-sm font-medium hover:underline">
            Voltar para serviços
          </Link>
        </div>
      </main>
    );
  }

  const photos = vendor.photos || [];
  const coverPhoto = vendor.coverImage || photos[0]?.url;

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto section-padding">
        <motion.div initial="hidden" animate="visible">
          <motion.div custom={0} variants={fadeUp} className="flex items-center gap-2 text-sm text-charcoal-light mb-6">
            <Link to="/" className="hover:text-charcoal transition-colors">Início</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/servicos" className="hover:text-charcoal transition-colors">Serviços</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-charcoal">{vendor.businessName}</span>
          </motion.div>
        </motion.div>

        <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
          <Link to="/servicos" className="inline-flex items-center gap-1.5 text-sm text-charcoal-light hover:text-charcoal transition-colors mb-6">
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div initial="hidden" animate="visible">
              <motion.div custom={1} variants={fadeUp} className="card-base overflow-hidden mb-6">
                <div className="h-64 sm:h-80 bg-cream rounded-2xl flex items-center justify-center mb-6 overflow-hidden">
                  {coverPhoto ? (
                    <img src={coverPhoto} alt={vendor.businessName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl opacity-30">✨</span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                  <div>
                    <h1 className="font-display text-2xl lg:text-3xl font-semibold mb-2">{vendor.businessName}</h1>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm bg-cream px-3 py-1 rounded-xl">
                        {categoryLabel[vendor.category] || vendor.category}
                      </span>
                      <span className="text-sm text-charcoal-light flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {vendor.city}{vendor.state ? `, ${vendor.state}` : ''}
                      </span>
                      <span className="text-sm flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-blush fill-blush" />
                        <strong>{vendor.reviewCount > 0 ? vendor.ratingAvg.toFixed(1) : 'Novo'}</strong>
                        {vendor.reviewCount > 0 && (
                          <span className="text-charcoal-light">({vendor.reviewCount} avaliações)</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-semibold text-sage">
                      {vendor.priceFrom != null
                        ? `A partir de ${vendor.priceFrom.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}${priceUnitLabel[vendor.priceUnit] || ''}`
                        : 'Sob consulta'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowQuoteForm((v) => !v)}
                  className="btn-blush w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Solicitar orçamento
                </button>
              </motion.div>
            </motion.div>

            {vendor.description && (
              <motion.div initial="hidden" animate="visible">
                <motion.div custom={2} variants={fadeUp} className="card-base mb-6">
                  <h2 className="font-display text-lg font-semibold mb-3">Sobre</h2>
                  <p className="text-sm text-charcoal-light leading-relaxed">{vendor.description}</p>
                </motion.div>
              </motion.div>
            )}

            {photos.length > 0 && (
              <motion.div initial="hidden" animate="visible">
                <motion.div custom={3} variants={fadeUp} className="card-base mb-6">
                  <h2 className="font-display text-lg font-semibold mb-4">Portfólio</h2>
                  <div className="grid grid-cols-3 gap-3">
                    {photos.map((photo, i) => (
                      <div key={photo.id || i} className="aspect-square bg-cream rounded-2xl overflow-hidden">
                        <img src={photo.url} alt={photo.caption || ''} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}

            <motion.div initial="hidden" animate="visible">
              <motion.div custom={4} variants={fadeUp} className="card-base">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-semibold">Avaliações</h2>
                  {vendor.reviewCount > 0 && (
                    <div className="flex items-center gap-1.5 bg-cream px-3 py-1.5 rounded-xl">
                      <Star className="w-4 h-4 text-blush fill-blush" />
                      <span className="font-semibold text-sm">{vendor.ratingAvg.toFixed(1)}</span>
                      <span className="text-xs text-charcoal-light">({vendor.reviewCount})</span>
                    </div>
                  )}
                </div>
                {!vendor.reviews || vendor.reviews.length === 0 ? (
                  <p className="text-sm text-charcoal-light">Este fornecedor ainda não tem avaliações.</p>
                ) : (
                  <div className="space-y-4">
                    {vendor.reviews.map((review) => (
                      <div key={review.id} className="pb-4 border-b border-charcoal/5 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blush/10 rounded-full flex items-center justify-center">
                              <span className="text-xs font-semibold text-blush-dark">{review.author.name.charAt(0)}</span>
                            </div>
                            <span className="text-sm font-medium">{review.author.name}</span>
                          </div>
                          <span className="text-xs text-charcoal-light">
                            {new Date(review.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 mb-1.5">
                          {Array.from({ length: review.rating }).map((_, j) => (
                            <Star key={j} className="w-3 h-3 text-blush fill-blush" />
                          ))}
                        </div>
                        {review.comment && <p className="text-sm text-charcoal-light leading-relaxed">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div>
            <motion.div initial="hidden" animate="visible">
              <motion.div custom={2} variants={fadeUp} className="card-base mb-6 sticky top-24">
                {showQuoteForm && !quoteSent ? (
                  <>
                    <h3 className="font-display font-semibold mb-4">Solicitar orçamento</h3>
                    <form onSubmit={submitQuote} className="space-y-3">
                      {quoteError && (
                        <div className="flex items-start gap-2 bg-rose/10 text-rose text-xs rounded-xl p-2.5">
                          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <span>{quoteError}</span>
                        </div>
                      )}
                      <input
                        type="text" required placeholder="Seu nome"
                        value={quote.name} onChange={(e) => setQuote((q) => ({ ...q, name: e.target.value }))}
                        className="w-full bg-white rounded-xl px-3.5 py-2.5 text-sm border border-charcoal/10 outline-none focus:ring-2 focus:ring-blush/30"
                      />
                      <input
                        type="email" required placeholder="Seu e-mail"
                        value={quote.email} onChange={(e) => setQuote((q) => ({ ...q, email: e.target.value }))}
                        className="w-full bg-white rounded-xl px-3.5 py-2.5 text-sm border border-charcoal/10 outline-none focus:ring-2 focus:ring-blush/30"
                      />
                      <input
                        type="text" placeholder="Telefone (opcional)"
                        value={quote.phone} onChange={(e) => setQuote((q) => ({ ...q, phone: e.target.value }))}
                        className="w-full bg-white rounded-xl px-3.5 py-2.5 text-sm border border-charcoal/10 outline-none focus:ring-2 focus:ring-blush/30"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={quote.eventDate} onChange={(e) => setQuote((q) => ({ ...q, eventDate: e.target.value }))}
                          className="w-full bg-white rounded-xl px-3 py-2.5 text-sm border border-charcoal/10 outline-none focus:ring-2 focus:ring-blush/30"
                        />
                        <input
                          type="number" min={0} placeholder="Nº convidados"
                          value={quote.guestCount} onChange={(e) => setQuote((q) => ({ ...q, guestCount: e.target.value }))}
                          className="w-full bg-white rounded-xl px-3 py-2.5 text-sm border border-charcoal/10 outline-none focus:ring-2 focus:ring-blush/30"
                        />
                      </div>
                      <textarea
                        placeholder="Conte um pouco sobre o seu evento"
                        rows={3}
                        value={quote.message} onChange={(e) => setQuote((q) => ({ ...q, message: e.target.value }))}
                        className="w-full bg-white rounded-xl px-3.5 py-2.5 text-sm border border-charcoal/10 outline-none focus:ring-2 focus:ring-blush/30 resize-none"
                      />
                      <button type="submit" disabled={sending} className="btn-blush w-full flex items-center justify-center gap-2 text-sm disabled:opacity-60">
                        <Send className="w-4 h-4" />
                        {sending ? 'Enviando...' : 'Enviar pedido'}
                      </button>
                    </form>
                  </>
                ) : showQuoteForm && quoteSent ? (
                  <div className="text-center py-4">
                    <CheckCircle2 className="w-10 h-10 text-sage mx-auto mb-3" />
                    <p className="font-medium text-sm mb-1">Pedido enviado!</p>
                    <p className="text-xs text-charcoal-light">
                      {vendor.businessName} vai receber sua mensagem e pode te responder pelo e-mail informado.
                    </p>
                  </div>
                ) : (
                  <>
                    <h3 className="font-display font-semibold mb-4">Contato</h3>
                    <div className="space-y-3">
                      {vendor.phone && (
                        <div className="flex items-center gap-3 p-3 rounded-xl">
                          <div className="w-10 h-10 bg-blush/10 rounded-xl flex items-center justify-center">
                            <Phone className="w-5 h-5 text-blush" />
                          </div>
                          <div>
                            <p className="text-xs text-charcoal-light">Telefone</p>
                            <p className="text-sm font-medium">{vendor.phone}</p>
                          </div>
                        </div>
                      )}
                      {vendor.instagram && (
                        <a
                          href={`https://instagram.com/${vendor.instagram.replace('@', '')}`}
                          target="_blank" rel="noreferrer"
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-cream transition-colors group"
                        >
                          <div className="w-10 h-10 bg-rose/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Instagram className="w-5 h-5 text-rose" />
                          </div>
                          <div>
                            <p className="text-xs text-charcoal-light">Instagram</p>
                            <p className="text-sm font-medium">{vendor.instagram}</p>
                          </div>
                        </a>
                      )}
                      {vendor.website && (
                        <a
                          href={vendor.website} target="_blank" rel="noreferrer"
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-cream transition-colors group"
                        >
                          <div className="w-10 h-10 bg-sage/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ExternalLink className="w-5 h-5 text-sage" />
                          </div>
                          <div>
                            <p className="text-xs text-charcoal-light">Site</p>
                            <p className="text-sm font-medium truncate max-w-[180px]">{vendor.website}</p>
                          </div>
                        </a>
                      )}
                      {!vendor.phone && !vendor.instagram && !vendor.website && (
                        <p className="text-xs text-charcoal-light">Peça um orçamento para entrar em contato.</p>
                      )}
                    </div>

                    <button
                      onClick={() => setShowQuoteForm(true)}
                      className="btn-blush w-full mt-4 flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Solicitar orçamento
                    </button>
                  </>
                )}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
