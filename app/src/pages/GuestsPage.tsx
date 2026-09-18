import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import type { Guest } from '../store/useStore';
import {
  ChevronRight, Plus, Search, Users, CheckCircle2, XCircle,
  Clock, UserPlus, X, Phone, Mail, Edit3, Trash2,
  Filter, Download, MoreHorizontal, UserCheck, UserX, ChevronDown
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  })
};

export default function GuestsPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const events = useStore((s) => s.events);
  const addGuest = useStore((s) => s.addGuest);
  const updateGuest = useStore((s) => s.updateGuest);
  const removeGuest = useStore((s) => s.removeGuest);
  
  const event = events.find((e) => e.id === eventId);
  const guests = event?.guests || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRsvp, setFilterRsvp] = useState<'all' | Guest['rsvp']>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPlusOne, setFormPlusOne] = useState(false);
  const [formPlusOneName, setFormPlusOneName] = useState('');
  const [formTable, setFormTable] = useState('');
  const [formNotes, setFormNotes] = useState('');

  if (!event) {
    return (
      <main className="pt-24 pb-16 min-h-screen">
        <div className="max-w-7xl mx-auto section-padding text-center py-20">
          <Users className="w-16 h-16 text-charcoal-light/20 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-semibold mb-2">Nenhum evento selecionado</h1>
          <p className="text-charcoal-light mb-6">Crie um evento primeiro para gerenciar convidados.</p>
          <Link to="/criar-evento" className="btn-primary inline-flex items-center gap-2 text-xs">
            <Plus className="w-4 h-4" /> Criar evento
          </Link>
        </div>
      </main>
    );
  }

  const filteredGuests = guests.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         g.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterRsvp === 'all' || g.rsvp === filterRsvp;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: guests.length,
    confirmed: guests.filter((g) => g.rsvp === 'confirmed').length,
    pending: guests.filter((g) => g.rsvp === 'pending').length,
    declined: guests.filter((g) => g.rsvp === 'declined').length,
    plusOnes: guests.filter((g) => g.plusOne).length,
  };

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormPlusOne(false);
    setFormPlusOneName('');
    setFormTable('');
    setFormNotes('');
  };

  const handleAddGuest = () => {
    if (!formName.trim()) return;
    addGuest(event.id, {
      name: formName,
      email: formEmail,
      phone: formPhone,
      rsvp: 'pending',
      plusOne: formPlusOne,
      plusOneName: formPlusOne ? formPlusOneName : undefined,
      table: formTable || undefined,
      notes: formNotes || undefined,
    });
    resetForm();
    setShowAddModal(false);
  };

  const handleEditGuest = () => {
    if (!editingGuest || !formName.trim()) return;
    updateGuest(event.id, editingGuest.id, {
      name: formName,
      email: formEmail,
      phone: formPhone,
      plusOne: formPlusOne,
      plusOneName: formPlusOne ? formPlusOneName : undefined,
      table: formTable || undefined,
      notes: formNotes || undefined,
    });
    setEditingGuest(null);
    resetForm();
  };

  const openEditModal = (guest: Guest) => {
    setEditingGuest(guest);
    setFormName(guest.name);
    setFormEmail(guest.email);
    setFormPhone(guest.phone);
    setFormPlusOne(guest.plusOne);
    setFormPlusOneName(guest.plusOneName || '');
    setFormTable(guest.table || '');
    setFormNotes(guest.notes || '');
    setShowAddModal(true);
  };

  const handleBulkAdd = () => {
    const names = bulkText.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    names.forEach(name => {
      addGuest(event.id, {
        name,
        email: '',
        phone: '',
        rsvp: 'pending',
        plusOne: false,
      });
    });
    setBulkText('');
    setShowBulkAdd(false);
  };

  const rsvpColors = {
    confirmed: 'bg-sage/10 text-sage',
    pending: 'bg-charcoal/5 text-charcoal-light',
    declined: 'bg-rose/10 text-rose',
  };

  const rsvpLabels = {
    confirmed: 'Confirmado',
    pending: 'Pendente',
    declined: 'Recusou',
  };

  const rsvpIcons = {
    confirmed: CheckCircle2,
    pending: Clock,
    declined: XCircle,
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
            <span className="text-charcoal">Convidados</span>
          </motion.div>
        </motion.div>

        {/* Header */}
        <motion.div initial="hidden" animate="visible" className="mb-8">
          <motion.div custom={1} variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl lg:text-4xl font-semibold mb-1 tracking-tight">
                <span className="italic text-rose">Convidados</span>
              </h1>
              <p className="text-charcoal-light">{event.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { resetForm(); setShowBulkAdd(true); }}
                className="btn-secondary flex items-center justify-center gap-2 text-xs"
              >
                <UserPlus className="w-4 h-4" />
                Adicionar em lote
              </button>
              <button
                onClick={() => { resetForm(); setEditingGuest(null); setShowAddModal(true); }}
                className="btn-primary flex items-center justify-center gap-2 text-xs"
              >
                <Plus className="w-4 h-4" />
                Adicionar convidado
              </button>
            </div>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'bg-charcoal/5 text-charcoal', icon: Users },
            { label: 'Confirmados', value: stats.confirmed, color: 'bg-sage/10 text-sage', icon: CheckCircle2 },
            { label: 'Pendentes', value: stats.pending, color: 'bg-blush/10 text-blush', icon: Clock },
            { label: 'Recusaram', value: stats.declined, color: 'bg-rose/10 text-rose', icon: XCircle },
            { label: '+1', value: stats.plusOnes, color: 'bg-blush/10 text-blush-dark', icon: UserPlus },
          ].map((stat, i) => (
            <motion.div key={i} custom={i + 2} variants={fadeUp} className="card-base p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="w-4 h-4 text-charcoal-light" />
                <span className="text-xs text-charcoal-light">{stat.label}</span>
              </div>
              <p className="font-display text-2xl font-semibold">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div initial="hidden" animate="visible" className="flex flex-col sm:flex-row gap-3 mb-6">
          <motion.div custom={7} variants={fadeUp} className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-light/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar convidado..."
              className="w-full bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm border border-charcoal/10
                         outline-none focus:ring-2 focus:ring-blush/30 transition-shadow"
            />
          </motion.div>
          <motion.div custom={8} variants={fadeUp} className="flex gap-2">
            {(['all', 'confirmed', 'pending', 'declined'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterRsvp(filter)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  filterRsvp === filter
                    ? 'bg-charcoal text-ivory'
                    : 'bg-white text-charcoal-light border border-charcoal/10 hover:bg-charcoal/5'
                }`}
              >
                {filter === 'all' ? 'Todos' : rsvpLabels[filter]}
              </button>
            ))}
          </motion.div>
        </motion.div>

        {/* Guest List */}
        <motion.div initial="hidden" animate="visible">
          {filteredGuests.length === 0 ? (
            <motion.div custom={9} variants={fadeUp} className="text-center py-16">
              <Users className="w-16 h-16 text-charcoal-light/20 mx-auto mb-4" />
              <p className="text-charcoal-light mb-4">
                {guests.length === 0
                  ? 'Nenhum convidado adicionado ainda.'
                  : 'Nenhum convidado encontrado com esses filtros.'}
              </p>
              {guests.length === 0 && (
                <button
                  onClick={() => { resetForm(); setEditingGuest(null); setShowAddModal(true); }}
                  className="btn-primary text-xs inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar primeiro convidado
                </button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-2">
              {filteredGuests.map((guest, i) => {
                const RsvpIcon = rsvpIcons[guest.rsvp];
                return (
                  <motion.div
                    key={guest.id}
                    custom={i + 9}
                    variants={fadeUp}
                    className="card-base flex items-center gap-4 py-3"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-blush/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-blush-dark">
                        {guest.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{guest.name}</p>
                        {guest.plusOne && (
                          <span className="text-[10px] bg-cream text-charcoal-light px-1.5 py-0.5 rounded">
                            +1
                          </span>
                        )}
                        {guest.table && (
                          <span className="text-[10px] bg-blush/10 text-blush px-1.5 py-0.5 rounded">
                            Mesa {guest.table}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {guest.email && (
                          <span className="text-[11px] text-charcoal-light flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {guest.email}
                          </span>
                        )}
                        {guest.phone && (
                          <span className="text-[11px] text-charcoal-light flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {guest.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* RSVP Status */}
                    <div className="flex items-center gap-2">
                      <select
                        value={guest.rsvp}
                        onChange={(e) => updateGuest(event.id, guest.id, { rsvp: e.target.value as Guest['rsvp'] })}
                        className={`text-xs font-medium px-3 py-1.5 rounded-xl border-0 outline-none cursor-pointer appearance-none pr-6 bg-no-repeat bg-[right_0.375rem_center] bg-[length:0.75rem] ${rsvpColors[guest.rsvp]}`}
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234A4543' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                        }}
                      >
                        <option value="pending">Pendente</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="declined">Recusou</option>
                      </select>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(guest)}
                        className="p-2 rounded-lg hover:bg-cream transition-colors"
                      >
                        <Edit3 className="w-4 h-4 text-charcoal-light" />
                      </button>
                      <button
                        onClick={() => removeGuest(event.id, guest.id)}
                        className="p-2 rounded-lg hover:bg-rose/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-rose" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Add/Edit Guest Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm"
              onClick={() => { setShowAddModal(false); setEditingGuest(null); }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl p-8 w-full max-w-md shadow-card-hover max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-semibold">
                    {editingGuest ? 'Editar convidado' : 'Adicionar convidado'}
                  </h2>
                  <button
                    onClick={() => { setShowAddModal(false); setEditingGuest(null); }}
                    className="p-1.5 rounded-lg hover:bg-cream transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-charcoal-light block mb-1.5">Nome completo *</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Nome do convidado"
                      className="w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none
                                 focus:ring-2 focus:ring-blush/30 transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-charcoal-light block mb-1.5">E-mail</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                      className="w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none
                                 focus:ring-2 focus:ring-blush/30 transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-charcoal-light block mb-1.5">Telefone</label>
                    <input
                      type="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="(11) 99999-0000"
                      className="w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none
                                 focus:ring-2 focus:ring-blush/30 transition-shadow"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-charcoal-light block mb-1.5">Mesa</label>
                      <input
                        type="text"
                        value={formTable}
                        onChange={(e) => setFormTable(e.target.value)}
                        placeholder="Ex: 1"
                        className="w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none
                                   focus:ring-2 focus:ring-blush/30 transition-shadow"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer py-2.5">
                        <input
                          type="checkbox"
                          checked={formPlusOne}
                          onChange={(e) => setFormPlusOne(e.target.checked)}
                          className="w-4 h-4 rounded border-charcoal/20 text-blush focus:ring-blush"
                        />
                        <span className="text-sm">Possui +1</span>
                      </label>
                    </div>
                  </div>
                  {formPlusOne && (
                    <div>
                      <label className="text-xs font-medium text-charcoal-light block mb-1.5">Nome do +1</label>
                      <input
                        type="text"
                        value={formPlusOneName}
                        onChange={(e) => setFormPlusOneName(e.target.value)}
                        placeholder="Nome do acompanhante"
                        className="w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none
                                   focus:ring-2 focus:ring-blush/30 transition-shadow"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-charcoal-light block mb-1.5">Observações</label>
                    <textarea
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Restrições alimentares, alergias, etc."
                      rows={2}
                      className="w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none
                                 focus:ring-2 focus:ring-blush/30 transition-shadow resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => { setShowAddModal(false); setEditingGuest(null); }}
                    className="flex-1 btn-secondary text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={editingGuest ? handleEditGuest : handleAddGuest}
                    className="flex-1 btn-primary text-xs"
                  >
                    {editingGuest ? 'Salvar' : 'Adicionar'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bulk Add Modal */}
        <AnimatePresence>
          {showBulkAdd && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm"
              onClick={() => setShowBulkAdd(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl p-8 w-full max-w-md shadow-card-hover"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-semibold">Adicionar em lote</h2>
                  <button
                    onClick={() => setShowBulkAdd(false)}
                    className="p-1.5 rounded-lg hover:bg-cream transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-sm text-charcoal-light mb-4">
                  Digite um nome por linha para adicionar vários convidados de uma vez.
                </p>

                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={"Maria Silva\nJoão Santos\nAna Oliveira\n..."}
                  rows={8}
                  className="w-full bg-cream rounded-xl px-4 py-3 text-sm outline-none
                             focus:ring-2 focus:ring-blush/30 transition-shadow resize-none font-mono"
                />

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowBulkAdd(false)}
                    className="flex-1 btn-secondary text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleBulkAdd}
                    className="flex-1 btn-primary text-xs"
                  >
                    Adicionar {bulkText.split('\n').filter(n => n.trim()).length || ''} convidados
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
