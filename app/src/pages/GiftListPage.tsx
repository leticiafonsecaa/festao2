import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import {
  ChevronRight, Plus, Search, ExternalLink, Heart,
  Gift, Store, Tag, Check, X, ArrowUpDown, Trash2, Edit3
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  })
};

const categories = ['Todos', 'Cozinha', 'Casa', 'Mesa', 'Eletrônicos', 'Outros'];

const categoryEmojis: Record<string, string> = {
  Cozinha: '🍳',
  Casa: '🏠',
  Mesa: '🥂',
  Eletrônicos: '📱',
  Outros: '🎁',
};

export default function GiftListPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const events = useStore((s) => s.events);
  const addGift = useStore((s) => s.addGift);
  const updateGift = useStore((s) => s.updateGift);
  const removeGift = useStore((s) => s.removeGift);
  const toggleGiftReceived = useStore((s) => s.toggleGiftReceived);
  const event = events.find((e) => e.id === eventId);
  const gifts = event?.gifts || [];

  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGift, setExpandedGift] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGift, setEditingGift] = useState<string | null>(null);
  const [receivedByInput, setReceivedByInput] = useState('');
  const [showReceivedModal, setShowReceivedModal] = useState<string | null>(null);

  // Add/Edit form
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Cozinha');
  const [formOptions, setFormOptions] = useState<Array<{ store: string; price: string; url: string }>>([
    { store: '', price: '', url: '' },
  ]);

  if (!event) {
    return (
      <main className="pt-24 pb-16 min-h-screen">
        <div className="max-w-7xl mx-auto section-padding text-center py-20">
          <Gift className="w-16 h-16 text-charcoal-light/20 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-semibold mb-2">Nenhum evento selecionado</h1>
          <p className="text-charcoal-light mb-6">Crie um evento primeiro para gerenciar presentes.</p>
          <Link to="/criar-evento" className="btn-primary inline-flex items-center gap-2 text-xs">
            <Plus className="w-4 h-4" /> Criar evento
          </Link>
        </div>
      </main>
    );
  }

  const filteredGifts = gifts.filter(g => {
    const matchesCategory = selectedCategory === 'Todos' || g.category === selectedCategory;
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalExpected = gifts.length > 0
    ? gifts.reduce((sum, g) => sum + (g.options.length > 0 ? Math.min(...g.options.map(o => o.price)) : 0), 0)
    : 0;
  const totalReceived = gifts.filter(g => g.received).reduce((sum, g) =>
    sum + (g.options.length > 0 ? Math.min(...g.options.map(o => o.price)) : 0), 0);

  const resetForm = () => {
    setFormName('');
    setFormCategory('Cozinha');
    setFormOptions([{ store: '', price: '', url: '' }]);
    setEditingGift(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (giftId: string) => {
    const gift = gifts.find(g => g.id === giftId);
    if (!gift) return;
    setEditingGift(giftId);
    setFormName(gift.name);
    setFormCategory(gift.category);
    setFormOptions(gift.options.map(o => ({
      store: o.store,
      price: o.price.toString(),
      url: o.url,
    })));
    setShowAddModal(true);
  };

  const handleSaveGift = () => {
    if (!formName.trim()) return;
    const options = formOptions
      .filter(o => o.store.trim() && o.price)
      .map(o => ({
        store: o.store,
        price: parseFloat(o.price.replace(',', '.')) || 0,
        url: o.url || '#',
      }));

    if (editingGift) {
      updateGift(event.id, editingGift, {
        name: formName,
        category: formCategory,
        options,
      });
    } else {
      addGift(event.id, {
        name: formName,
        category: formCategory,
        image: categoryEmojis[formCategory] || '🎁',
        options,
        received: false,
      });
    }
    setShowAddModal(false);
    resetForm();
  };

  const addOption = () => {
    setFormOptions([...formOptions, { store: '', price: '', url: '' }]);
  };

  const removeOption = (index: number) => {
    setFormOptions(formOptions.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: string, value: string) => {
    setFormOptions(formOptions.map((o, i) => i === index ? { ...o, [field]: value } : o));
  };

  const handleMarkReceived = (giftId: string) => {
    toggleGiftReceived(event.id, giftId, receivedByInput || undefined);
    setShowReceivedModal(null);
    setReceivedByInput('');
  };

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto section-padding">
        {/* Breadcrumb */}
        <motion.div initial="hidden" animate="visible">
          <motion.div custom={0} variants={fadeUp} className="flex items-center gap-2 text-sm text-charcoal-light mb-2">
            <Link to="/" className="hover:text-charcoal transition-colors">Início</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to={`/dashboard/${event.id}`} className="hover:text-charcoal transition-colors">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-charcoal">Presentes</span>
          </motion.div>
        </motion.div>

        {/* Header */}
        <motion.div initial="hidden" animate="visible" className="mb-8">
          <motion.div custom={1} variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl lg:text-4xl font-semibold mb-1 tracking-tight">
                Lista de <span className="italic text-rose">Presentes</span>
              </h1>
              <p className="text-charcoal-light">{gifts.length} presentes na lista</p>
            </div>
            <button onClick={openAddModal} className="btn-primary flex items-center justify-center gap-2 text-xs">
              <Plus className="w-4 h-4" />
              Adicionar presente
            </button>
          </motion.div>
        </motion.div>

        {/* Summary */}
        {gifts.length > 0 && (
          <motion.div initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total estimado', value: `R$ ${totalExpected.toLocaleString('pt-BR')}`, icon: Tag, color: 'bg-blush/10 text-blush' },
              { label: 'Recebidos', value: `${gifts.filter(g => g.received).length} de ${gifts.length}`, icon: Gift, color: 'bg-sage/10 text-sage' },
              { label: 'Valor recebido', value: `R$ ${totalReceived.toLocaleString('pt-BR')}`, icon: Heart, color: 'bg-rose/10 text-rose' },
            ].map((stat, i) => (
              <motion.div key={i} custom={i + 2} variants={fadeUp} className="card-base">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-charcoal-light">{stat.label}</p>
                    <p className="font-display text-lg font-semibold">{stat.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Filters */}
        <motion.div initial="hidden" animate="visible" className="flex flex-col sm:flex-row gap-3 mb-8">
          <motion.div custom={5} variants={fadeUp} className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-light/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar presente..."
              className="w-full bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm border border-charcoal/10
                         outline-none focus:ring-2 focus:ring-blush/30 transition-shadow"
            />
          </motion.div>
          <motion.div custom={6} variants={fadeUp} className="flex gap-2 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-charcoal text-ivory'
                    : 'bg-white text-charcoal-light border border-charcoal/10 hover:bg-charcoal/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        </motion.div>

        {/* Gift Grid */}
        {filteredGifts.length === 0 ? (
          <motion.div initial="hidden" animate="visible" className="text-center py-16">
            <Gift className="w-16 h-16 text-charcoal-light/20 mx-auto mb-4" />
            <p className="text-charcoal-light mb-4">
              {gifts.length === 0
                ? 'Nenhum presente adicionado ainda.'
                : 'Nenhum presente encontrado com esses filtros.'}
            </p>
            {gifts.length === 0 && (
              <button onClick={openAddModal} className="btn-primary text-xs inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Adicionar primeiro presente
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div initial="hidden" animate="visible" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGifts.map((gift, i) => (
              <motion.div
                key={gift.id}
                custom={i + 7}
                variants={fadeUp}
                className={`card-base relative overflow-hidden ${gift.received ? 'opacity-75' : ''}`}
              >
                {gift.received && (
                  <div className="absolute top-4 right-4 bg-sage text-white text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Recebido
                  </div>
                )}

                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 bg-cream rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                    {gift.image || '🎁'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm truncate">{gift.name}</h3>
                    <span className="text-xs text-charcoal-light bg-cream px-2 py-0.5 rounded-md inline-block mt-1">
                      {gift.category}
                    </span>
                  </div>
                </div>

                {/* Best price */}
                {gift.options.length > 0 && (
                  <div className="bg-cream/50 rounded-xl p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-charcoal-light">Melhor preço</span>
                      <span className="font-display text-lg font-semibold text-sage">
                        R$ {Math.min(...gift.options.map(o => o.price)).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Options toggle */}
                {gift.options.length > 0 && (
                  <button
                    onClick={() => setExpandedGift(expandedGift === gift.id ? null : gift.id)}
                    className="w-full text-xs text-blush font-medium flex items-center justify-center gap-1 
                               hover:text-blush-dark transition-colors py-2 rounded-xl hover:bg-blush/5"
                  >
                    <Store className="w-3.5 h-3.5" />
                    {gift.options.length} opções de loja
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                )}

                {/* Expanded options */}
                <AnimatePresence>
                  {expandedGift === gift.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 space-y-2">
                        {[...gift.options]
                          .sort((a, b) => a.price - b.price)
                          .map((opt, j) => (
                          <div key={j} className="flex items-center justify-between py-2 px-3 bg-white rounded-xl border border-charcoal/5">
                            <span className="text-xs font-medium">{opt.store}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold">R$ {opt.price.toFixed(2).replace('.', ',')}</span>
                              {opt.url && opt.url !== '#' && (
                                <a href={opt.url} target="_blank" rel="noopener noreferrer"
                                   className="w-6 h-6 bg-charcoal/5 rounded-lg flex items-center justify-center hover:bg-charcoal/10 transition-colors">
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-charcoal/5">
                  <button
                    onClick={() => openEditModal(gift.id)}
                    className="text-xs text-charcoal-light hover:text-charcoal flex items-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3 h-3" /> Editar
                  </button>
                  {!gift.received ? (
                    <button
                      onClick={() => { setShowReceivedModal(gift.id); setReceivedByInput(''); }}
                      className="text-xs text-sage font-medium hover:text-sage/80 flex items-center gap-1 transition-colors"
                    >
                      <Check className="w-3 h-3" /> Marcar recebido
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleGiftReceived(event.id, gift.id)}
                      className="text-xs text-rose hover:text-rose/80 flex items-center gap-1 transition-colors"
                    >
                      <X className="w-3 h-3" /> Desmarcar
                    </button>
                  )}
                  <button
                    onClick={() => removeGift(event.id, gift.id)}
                    className="p-1.5 rounded-lg hover:bg-rose/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose" />
                  </button>
                </div>

                {gift.receivedBy && (
                  <p className="text-[10px] text-sage mt-2 text-center">
                    Presenteado por {gift.receivedBy}
                  </p>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Add/Edit Gift Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm"
              onClick={() => { setShowAddModal(false); resetForm(); }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-card-hover max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-semibold">
                    {editingGift ? 'Editar presente' : 'Adicionar presente'}
                  </h2>
                  <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-1.5 rounded-lg hover:bg-cream transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-charcoal-light block mb-1.5">Nome do presente *</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ex: Air Fryer, Jogo de panelas..."
                      className="w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blush/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-charcoal-light block mb-1.5">Categoria</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blush/30 appearance-none"
                    >
                      {categories.filter(c => c !== 'Todos').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Store options */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-charcoal-light">Opções de loja</label>
                      <button onClick={addOption} className="text-xs text-blush font-medium flex items-center gap-1 hover:text-blush-dark">
                        <Plus className="w-3 h-3" /> Adicionar loja
                      </button>
                    </div>
                    <div className="space-y-3">
                      {formOptions.map((opt, i) => (
                        <div key={i} className="bg-cream rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-charcoal-light font-medium">Loja {i + 1}</span>
                            {formOptions.length > 1 && (
                              <button onClick={() => removeOption(i)} className="text-rose hover:text-rose/80">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={opt.store}
                            onChange={(e) => updateOption(i, 'store', e.target.value)}
                            placeholder="Nome da loja"
                            className="w-full bg-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blush/30"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={opt.price}
                              onChange={(e) => updateOption(i, 'price', e.target.value)}
                              placeholder="R$ 0,00"
                              className="bg-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blush/30"
                            />
                            <input
                              type="url"
                              value={opt.url}
                              onChange={(e) => updateOption(i, 'url', e.target.value)}
                              placeholder="Link (opcional)"
                              className="bg-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blush/30"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => { setShowAddModal(false); resetForm(); }} className="flex-1 btn-secondary text-xs">
                    Cancelar
                  </button>
                  <button onClick={handleSaveGift} className="flex-1 btn-primary text-xs">
                    {editingGift ? 'Salvar' : 'Adicionar'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Received Modal */}
        <AnimatePresence>
          {showReceivedModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm"
              onClick={() => setShowReceivedModal(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-card-hover"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-display text-lg font-semibold mb-2">Marcar como recebido</h3>
                <p className="text-sm text-charcoal-light mb-4">Quem presenteou?</p>
                <input
                  type="text"
                  value={receivedByInput}
                  onChange={(e) => setReceivedByInput(e.target.value)}
                  placeholder="Nome de quem presenteou (opcional)"
                  className="w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blush/30"
                />
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setShowReceivedModal(null)} className="flex-1 btn-secondary text-xs">
                    Cancelar
                  </button>
                  <button onClick={() => handleMarkReceived(showReceivedModal)} className="flex-1 btn-primary text-xs">
                    Confirmar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
