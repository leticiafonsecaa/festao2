import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import {
  ChevronRight, Palette, Type, Image, Eye, EyeOff,
  CheckCircle2, Sparkles, Heart, Users, Gift, Clock,
  Save
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  })
};

const colorPresets = [
  { name: 'Rosé', primary: '#D4A89C', secondary: '#C47D6B' },
  { name: 'Elegante', primary: '#2D2926', secondary: '#4A4543' },
  { name: 'Jardim', primary: '#8B9A7E', secondary: '#A8B89E' },
  { name: 'Premium', primary: '#B8877A', secondary: '#8B6F65' },
  { name: 'Noturno', primary: '#3D3B4A', secondary: '#5A5872' },
  { name: 'Dourado', primary: '#C4A35A', secondary: '#A68B4B' },
  { name: 'Lavanda', primary: '#9B8EC4', secondary: '#7B6FAA' },
  { name: 'Coral', primary: '#E07A5F', secondary: '#C4614A' },
];

export default function PersonalizationPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const events = useStore((s) => s.events);
  const updatePersonalization = useStore((s) => s.updatePersonalization);
  const event = events.find((e) => e.id === eventId);
  const [saved, setSaved] = useState(false);

  if (!event) {
    return (
      <main className="pt-24 pb-16 min-h-screen">
        <div className="max-w-7xl mx-auto section-padding text-center py-20">
          <Palette className="w-16 h-16 text-charcoal-light/20 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-semibold mb-2">Nenhum evento selecionado</h1>
          <p className="text-charcoal-light mb-6">Crie um evento primeiro para personalizar.</p>
          <Link to="/criar-evento" className="btn-primary inline-flex items-center gap-2 text-xs">
            Criar evento
          </Link>
        </div>
      </main>
    );
  }

  const p = event.personalization;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
            <span className="text-charcoal">Personalização</span>
          </motion.div>
        </motion.div>

        {/* Header */}
        <motion.div initial="hidden" animate="visible" className="mb-8">
          <motion.div custom={1} variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl lg:text-4xl font-semibold mb-1 tracking-tight">
                <span className="italic text-rose">Personalizar</span> evento
              </h1>
              <p className="text-charcoal-light">{event.name}</p>
            </div>
            <button
              onClick={handleSave}
              className="btn-primary flex items-center justify-center gap-2 text-xs"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Salvo!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar alterações
                </>
              )}
            </button>
          </motion.div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Colors */}
            <motion.div initial="hidden" animate="visible">
              <motion.div custom={2} variants={fadeUp} className="card-base">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="w-5 h-5 text-blush" />
                  <h2 className="font-display text-lg font-semibold">Cores</h2>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-6">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => updatePersonalization(event.id, {
                        primaryColor: preset.primary,
                        secondaryColor: preset.secondary,
                      })}
                      className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                        p.primaryColor === preset.primary
                          ? 'bg-cream ring-2 ring-blush'
                          : 'hover:bg-cream/50'
                      }`}
                    >
                      <div className="flex gap-0.5">
                        <div
                          className="w-5 h-5 rounded-full"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div
                          className="w-5 h-5 rounded-full"
                          style={{ backgroundColor: preset.secondary }}
                        />
                      </div>
                      <span className="text-[10px] text-charcoal-light">{preset.name}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-charcoal-light block mb-1.5">Cor principal</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={p.primaryColor}
                        onChange={(e) => updatePersonalization(event.id, { primaryColor: e.target.value })}
                        className="w-10 h-10 rounded-xl border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={p.primaryColor}
                        onChange={(e) => updatePersonalization(event.id, { primaryColor: e.target.value })}
                        className="flex-1 bg-cream rounded-xl px-3 py-2 text-sm font-mono outline-none
                                   focus:ring-2 focus:ring-blush/30"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-charcoal-light block mb-1.5">Cor secundária</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={p.secondaryColor}
                        onChange={(e) => updatePersonalization(event.id, { secondaryColor: e.target.value })}
                        className="w-10 h-10 rounded-xl border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={p.secondaryColor}
                        onChange={(e) => updatePersonalization(event.id, { secondaryColor: e.target.value })}
                        className="flex-1 bg-cream rounded-xl px-3 py-2 text-sm font-mono outline-none
                                   focus:ring-2 focus:ring-blush/30"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Tagline */}
            <motion.div initial="hidden" animate="visible">
              <motion.div custom={3} variants={fadeUp} className="card-base">
                <div className="flex items-center gap-2 mb-4">
                  <Type className="w-5 h-5 text-blush" />
                  <h2 className="font-display text-lg font-semibold">Frase de destaque</h2>
                </div>
                <input
                  type="text"
                  value={p.tagline}
                  onChange={(e) => updatePersonalization(event.id, { tagline: e.target.value })}
                  placeholder="Uma frase especial para seus convidados..."
                  className="w-full bg-cream rounded-xl px-4 py-3 text-sm outline-none
                             focus:ring-2 focus:ring-blush/30 transition-shadow"
                />
              </motion.div>
            </motion.div>

            {/* Visibility toggles */}
            <motion.div initial="hidden" animate="visible">
              <motion.div custom={4} variants={fadeUp} className="card-base">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-5 h-5 text-blush" />
                  <h2 className="font-display text-lg font-semibold">Visibilidade</h2>
                </div>
                <p className="text-sm text-charcoal-light mb-4">
                  Escolha o que aparecer na página pública do seu evento.
                </p>
                <div className="space-y-3">
                  {[
                    { key: 'showCountdown' as const, label: 'Countdown', desc: 'Mostrar contagem regressiva', icon: Clock },
                    { key: 'showGuestCount' as const, label: 'Número de convidados', desc: 'Mostrar total de convidados', icon: Users },
                    { key: 'showGiftList' as const, label: 'Lista de presentes', desc: 'Mostrar lista de presentes', icon: Gift },
                    { key: 'showRsvp' as const, label: 'Confirmação de presença', desc: 'Permitir RSVP na página', icon: Heart },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between py-3 px-4 bg-cream/50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 text-charcoal-light" />
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-charcoal-light">{item.desc}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => updatePersonalization(event.id, { [item.key]: !p[item.key] })}
                        className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${
                          p[item.key] ? 'bg-sage' : 'bg-charcoal/20'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform duration-200 ${
                          p[item.key] ? 'translate-x-5.5 left-0.5' : 'translate-x-0 left-0.5'
                        }`} style={{ transform: p[item.key] ? 'translateX(22px)' : 'translateX(2px)' }} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Preview */}
          <div>
            <motion.div initial="hidden" animate="visible">
              <motion.div custom={5} variants={fadeUp} className="sticky top-24">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-charcoal-light" />
                  <span className="text-sm font-medium">Pré-visualização</span>
                </div>
                <div className="rounded-3xl overflow-hidden shadow-card-hover border border-charcoal/5">
                  {/* Preview card */}
                  <div
                    className="p-6 text-center"
                    style={{ backgroundColor: p.primaryColor + '15' }}
                  >
                    <div
                      className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                      style={{ backgroundColor: p.primaryColor + '25' }}
                    >
                      <Heart className="w-7 h-7" style={{ color: p.primaryColor }} />
                    </div>
                    <h3 className="font-display text-lg font-semibold mb-1">{event.hosts}</h3>
                    <p className="text-xs text-charcoal-light mb-3">{event.name}</p>
                    {p.tagline && (
                      <p className="text-xs italic text-charcoal-light mb-4">"{p.tagline}"</p>
                    )}
                    {p.showCountdown && (
                      <div className="flex justify-center gap-3 mb-4">
                        {[
                          { v: '47', l: 'dias' },
                          { v: '8', l: 'horas' },
                          { v: '23', l: 'min' },
                        ].map((u, i) => (
                          <div key={i} className="bg-white rounded-xl px-3 py-2 shadow-soft">
                            <p className="font-display text-lg font-semibold" style={{ color: p.primaryColor }}>{u.v}</p>
                            <p className="text-[9px] text-charcoal-light">{u.l}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-center gap-1.5">
                      {p.showRsvp && (
                        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-charcoal-light flex items-center gap-1">
                          <Heart className="w-2.5 h-2.5" /> RSVP
                        </span>
                      )}
                      {p.showGiftList && (
                        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-charcoal-light flex items-center gap-1">
                          <Gift className="w-2.5 h-2.5" /> Presentes
                        </span>
                      )}
                      {p.showGuestCount && (
                        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-charcoal-light flex items-center gap-1">
                          <Users className="w-2.5 h-2.5" /> {event.guests.length || 0}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-white p-4">
                    <div className="h-2 bg-cream rounded-full mb-2" />
                    <div className="h-2 bg-cream rounded-full w-3/4" />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
