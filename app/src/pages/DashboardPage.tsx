import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, ApiError, type EventItem } from '../lib/api';
import {
  Users, Gift, Palette, CheckSquare, Calendar, Clock,
  ChevronRight, MapPin, TrendingUp, MessageCircle, Star, Plus, Sparkles,
  AlertCircle,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  })
};

const eventTypeEmoji: Record<string, string> = {
  casamento: '💒',
  '15anos': '🎉',
  aniversario: '🎂',
  formatura: '🎓',
  'cha-de-bebe': '🍼',
  'cha-de-panela': '🍳',
  batizado: '⛪',
  corporativo: '🏢',
  outro: '✨',
};

interface Summary {
  guests: { total: number; confirmed: number; pending: number; declined: number };
  gifts: { total: number; received: number };
  budget: { estimated: number; actual: number };
}

export default function DashboardPage() {
  const { id: eventId } = useParams<{ id: string }>();

  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Lista sempre os eventos (usada tanto na tela vazia quanto para achar
  // o mais recente quando nao veio :id na URL).
  useEffect(() => {
    api.events
      .list()
      .then(({ events }) => setEvents(events))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Não foi possível carregar seus eventos.'));
  }, []);

  useEffect(() => {
    if (!events) return;

    const targetId = eventId || events[0]?.id;
    if (!targetId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    api.events
      .get(targetId)
      .then((res) => {
        setEvent(res.event);
        setSummary(res.summary as unknown as Summary);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Não foi possível carregar o evento.'))
      .finally(() => setLoading(false));
  }, [events, eventId]);

  if (loading || events === null) {
    return (
      <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-blush animate-pulse" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm section-padding">
          <AlertCircle className="w-10 h-10 text-rose mx-auto mb-3" />
          <p className="text-charcoal-light">{error}</p>
        </div>
      </main>
    );
  }

  if (!event || !summary) {
    return (
      <main className="pt-24 pb-16 min-h-screen">
        <div className="max-w-7xl mx-auto section-padding text-center py-20">
          <Sparkles className="w-16 h-16 text-charcoal-light/20 mx-auto mb-4" />
          <h1 className="font-display text-3xl font-semibold mb-2">Bem-vindo ao Festão!</h1>
          <p className="text-charcoal-light mb-6 max-w-md mx-auto">
            Você ainda não criou nenhum evento. Comece agora e organize tudo em um só lugar.
          </p>
          <Link to="/criar-evento" className="btn-blush inline-flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Criar meu primeiro evento
          </Link>
        </div>
      </main>
    );
  }

  const totalGuests = summary.guests.total;
  const confirmedCount = summary.guests.confirmed;
  const totalGifts = summary.gifts.total;
  const receivedGifts = summary.gifts.received;

  const eventDate = new Date(event.date);
  const daysLeft = Math.max(0, Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const stats = [
    { label: 'Convidados', value: totalGuests.toString(), change: `${confirmedCount} confirmados`, icon: Users, color: 'bg-blush/10 text-blush' },
    { label: 'Confirmações', value: totalGuests > 0 ? `${Math.round((confirmedCount / totalGuests) * 100)}%` : '0%', change: `${confirmedCount} de ${totalGuests}`, icon: CheckSquare, color: 'bg-sage/10 text-sage' },
    { label: 'Presentes', value: `${receivedGifts}/${totalGifts}`, change: `${totalGifts} na lista`, icon: Gift, color: 'bg-rose/10 text-rose' },
    { label: 'Dias restantes', value: daysLeft.toString(), change: eventDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }), icon: Calendar, color: 'bg-charcoal/5 text-charcoal-light' },
  ];

  const features = event.features || [];
  const shortcuts = [
    { icon: Users, title: 'Convidados', description: 'Gerenciar lista e confirmações', count: `${totalGuests} convidados`, link: `/eventos/${event.id}/convidados`, color: 'bg-blush/10 text-blush-dark' },
    { icon: Palette, title: 'Personalizar página', description: 'Customizar visual do evento', link: `/eventos/${event.id}/personalizar`, color: 'bg-rose/10 text-rose' },
    ...(features.includes('presentes')
      ? [{ icon: Gift, title: 'Lista de presentes', description: 'Adicionar e gerenciar presentes', count: `${totalGifts} itens`, link: `/eventos/${event.id}/presentes`, color: 'bg-sage/10 text-sage' }]
      : []),
    { icon: Star, title: 'Serviços e fornecedores', description: 'Encontrar profissionais', link: '/servicos', color: 'bg-charcoal/5 text-charcoal-light' },
  ];

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto section-padding">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" className="mb-10">
          <motion.div custom={0} variants={fadeUp} className="flex items-center gap-2 text-sm text-charcoal-light mb-2">
            <Link to="/" className="hover:text-charcoal transition-colors">Início</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-charcoal">Dashboard</span>
          </motion.div>

          <motion.div custom={1} variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">{eventTypeEmoji[event.type] || '✨'}</span>
                <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight">
                  {event.name}
                </h1>
              </div>
              <p className="text-charcoal-light flex items-center gap-2 flex-wrap">
                <Calendar className="w-4 h-4" />
                {eventDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                {event.time && ` • ${event.time}`}
                {event.venue && (
                  <>
                    <span className="mx-1">•</span>
                    <MapPin className="w-4 h-4" />
                    {event.venue}{event.city ? `, ${event.city}` : ''}
                  </>
                )}
              </p>
              {event.description && (
                <p className="text-sm text-charcoal-light/70 mt-1 max-w-lg italic">"{event.description}"</p>
              )}
            </div>
            <Link to="/criar-evento" className="btn-secondary flex items-center justify-center gap-2 text-xs">
              <Plus className="w-4 h-4" />
              Novo evento
            </Link>
          </motion.div>

          {events.length > 1 && (
            <motion.div custom={2} variants={fadeUp} className="flex gap-2 mt-4 overflow-x-auto pb-1">
              {events.map((ev) => (
                <Link
                  key={ev.id}
                  to={`/dashboard/${ev.id}`}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    ev.id === event.id ? 'bg-charcoal text-ivory' : 'bg-cream text-charcoal-light hover:bg-charcoal/5'
                  }`}
                >
                  {eventTypeEmoji[ev.type] || '✨'} {ev.name}
                </Link>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((stat, i) => (
            <motion.div key={i} custom={i + 2} variants={fadeUp} className="card-base">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <TrendingUp className="w-4 h-4 text-sage" />
              </div>
              <p className="font-display text-2xl lg:text-3xl font-semibold mb-0.5">{stat.value}</p>
              <p className="text-xs text-charcoal-light">{stat.change}</p>
              <p className="text-xs text-charcoal-light/60 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Shortcuts */}
          <div className="lg:col-span-2">
            <motion.div initial="hidden" animate="visible" className="mb-6">
              <motion.h2 custom={6} variants={fadeUp} className="font-display text-xl font-semibold">
                Acesso rápido
              </motion.h2>
            </motion.div>

            <motion.div initial="hidden" animate="visible" className="grid sm:grid-cols-2 gap-4">
              {shortcuts.map((item, i) => (
                <motion.div key={i} custom={i + 7} variants={fadeUp}>
                  <Link to={item.link} className="card-base flex items-start gap-4 group block">
                    <div className={`w-11 h-11 ${item.color} rounded-2xl flex items-center justify-center flex-shrink-0
                                     group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm">{item.title}</h3>
                        <ChevronRight className="w-4 h-4 text-charcoal-light/40 group-hover:text-charcoal transition-colors" />
                      </div>
                      <p className="text-xs text-charcoal-light mt-0.5">{item.description}</p>
                      {item.count && (
                        <span className="text-xs text-blush font-medium mt-1 inline-block">{item.count}</span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Countdown */}
            {daysLeft > 0 && (
              <motion.div initial="hidden" animate="visible">
                <motion.div custom={6} variants={fadeUp} className="card-base bg-charcoal text-ivory mb-6">
                  <div className="text-center">
                    <Clock className="w-8 h-8 text-blush mx-auto mb-3" />
                    <p className="text-ivory/60 text-xs uppercase tracking-widest mb-2">Faltam</p>
                    <p className="font-display text-5xl font-semibold mb-1">{daysLeft}</p>
                    <p className="text-ivory/60 text-sm">dias para o grande dia</p>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Resumo RSVP */}
            {totalGuests > 0 && (
              <motion.div initial="hidden" animate="visible">
                <motion.div custom={7} variants={fadeUp} className="card-base mb-6">
                  <h3 className="font-display font-semibold mb-3">Resumo RSVP</h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Confirmados', count: summary.guests.confirmed, color: 'bg-sage' },
                      { label: 'Pendentes', count: summary.guests.pending, color: 'bg-blush' },
                      { label: 'Recusaram', count: summary.guests.declined, color: 'bg-rose' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span className="text-xs text-charcoal-light flex-1">{item.label}</span>
                        <span className="text-xs font-semibold">{item.count}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-charcoal/5">
                    <div className="w-full bg-cream rounded-full h-2">
                      <div
                        className="bg-sage h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(confirmedCount / totalGuests) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-charcoal-light mt-1 text-center">
                      {Math.round((confirmedCount / totalGuests) * 100)}% confirmaram
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Link do convite */}
            <motion.div initial="hidden" animate="visible">
              <motion.div custom={8} variants={fadeUp} className="card-base bg-blush/5 border border-blush/10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blush/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-blush" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm mb-1">Página do evento</h3>
                    <p className="text-xs text-charcoal-light mb-1">
                      {event.isPublished
                        ? 'Publicada. Envie o link para os convidados.'
                        : 'Ainda não publicada. Publique em Personalizar página.'}
                    </p>
                    {event.isPublished && (
                      <p className="text-xs text-blush font-medium break-all">/eventos/{event.publicCode}</p>
                    )}
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
