import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, MapPin, Clock, Heart, CheckCircle2, XCircle, Gift as GiftIcon,
  Sparkles, AlertCircle, Users,
} from 'lucide-react';
import { api, ApiError, type PublicGuest, type PublicEventInfo, type PublicGift } from '../lib/api';

interface InviteData {
  guest: PublicGuest;
  event: PublicEventInfo;
  gifts: PublicGift[];
}

export default function InvitePage() {
  const { inviteToken } = useParams<{ inviteToken: string }>();
  const [data, setData] = useState<InviteData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // formulario de rsvp
  const [plusOne, setPlusOne] = useState(false);
  const [plusOneName, setPlusOneName] = useState('');
  const [companions, setCompanions] = useState(0);
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [reservingId, setReservingId] = useState<string | null>(null);

  useEffect(() => {
    if (!inviteToken) return;
    api.public
      .invite(inviteToken)
      .then((d) => {
        setData(d);
        setPlusOne(d.guest.plusOne);
        setPlusOneName(d.guest.plusOneName || '');
        setCompanions(d.guest.companions);
        setDietaryNotes(d.guest.dietaryNotes || '');
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Não foi possível abrir este convite.'))
      .finally(() => setLoading(false));
  }, [inviteToken]);

  const respond = async (rsvp: 'confirmed' | 'declined') => {
    if (!inviteToken) return;
    setSaving(true);
    try {
      const res = await api.public.rsvp(inviteToken, {
        rsvp,
        plusOne,
        plusOneName,
        companions,
        dietaryNotes,
      });
      setData((prev) => (prev ? { ...prev, guest: { ...prev.guest, ...res.guest } } : prev));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível enviar sua resposta.');
    } finally {
      setSaving(false);
    }
  };

  const reserveGift = async (giftId: string) => {
    if (!inviteToken) return;
    setReservingId(giftId);
    try {
      await api.public.reserveGift(giftId, { inviteToken });
      setData((prev) =>
        prev
          ? { ...prev, gifts: prev.gifts.map((g) => (g.id === giftId ? { ...g, taken: true } : g)) }
          : prev
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível reservar este presente.');
    } finally {
      setReservingId(null);
    }
  };

  if (loading) {
    return (
      <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-blush animate-pulse" />
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm section-padding">
          <AlertCircle className="w-10 h-10 text-rose mx-auto mb-3" />
          <p className="text-charcoal-light">{error}</p>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const { guest, event, gifts } = data;
  const p = event.personalization;
  const primaryColor = p?.primaryColor || '#D4A89C';

  const eventDate = event.date ? new Date(event.date) : null;
  const daysLeft = eventDate
    ? Math.max(0, Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="max-w-2xl mx-auto section-padding">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <Heart className="w-8 h-8 mx-auto mb-3" style={{ color: primaryColor }} />
          <p className="text-sm text-charcoal-light mb-1">Você foi convidado(a) para</p>
          <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight mb-2">{event.name}</h1>
          {p?.tagline && <p className="text-charcoal-light italic">"{p.tagline}"</p>}
        </motion.div>

        <div className="card-base mb-6 space-y-3">
          {eventDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
              {eventDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {event.time && ` • ${event.time}`}
            </div>
          )}
          {event.venue && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4" style={{ color: primaryColor }} />
              {event.venue}
              {event.city ? `, ${event.city}` : ''}
            </div>
          )}
          {event.description && (
            <p className="text-sm text-charcoal-light pt-2 border-t border-charcoal/5">{event.description}</p>
          )}
        </div>

        {p?.showCountdown && daysLeft !== null && (
          <div className="card-base bg-charcoal text-ivory text-center mb-6">
            <Clock className="w-6 h-6 mx-auto mb-2" style={{ color: primaryColor }} />
            <p className="font-display text-4xl font-semibold">{daysLeft}</p>
            <p className="text-ivory/60 text-sm">dias para o grande dia</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 bg-rose/10 text-rose text-sm rounded-xl p-3 mb-4">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* RSVP */}
        {p?.showRsvp !== false && (
          <div className="card-base mb-6">
            <h2 className="font-display text-lg font-semibold mb-1">Olá, {guest.name}!</h2>

            {guest.rsvp !== 'pending' && (
              <p className="text-sm text-charcoal-light mb-4 flex items-center gap-1.5">
                {guest.rsvp === 'confirmed' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-sage" /> Você confirmou presença.
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose" /> Você avisou que não poderá comparecer.
                  </>
                )}{' '}
                Pode alterar sua resposta a qualquer momento.
              </p>
            )}

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={plusOne} onChange={(e) => setPlusOne(e.target.checked)} />
                Vou levar acompanhante
              </label>
              {plusOne && (
                <input
                  type="text"
                  value={plusOneName}
                  onChange={(e) => setPlusOneName(e.target.value)}
                  placeholder="Nome do acompanhante"
                  className="w-full bg-white rounded-xl px-4 py-2.5 text-sm border border-charcoal/10 outline-none focus:ring-2 focus:ring-blush/30"
                />
              )}

              <div>
                <label className="text-xs font-medium text-charcoal-light block mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Crianças ou outros acompanhantes
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={companions}
                  onChange={(e) => setCompanions(Number(e.target.value))}
                  className="w-24 bg-white rounded-xl px-4 py-2.5 text-sm border border-charcoal/10 outline-none focus:ring-2 focus:ring-blush/30"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-charcoal-light block mb-1.5">
                  Restrição alimentar (opcional)
                </label>
                <input
                  type="text"
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  placeholder="Ex: vegetariano, sem lactose..."
                  className="w-full bg-white rounded-xl px-4 py-2.5 text-sm border border-charcoal/10 outline-none focus:ring-2 focus:ring-blush/30"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => respond('confirmed')}
                  disabled={saving}
                  className="btn-blush flex-1 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Vou comparecer
                </button>
                <button
                  onClick={() => respond('declined')}
                  disabled={saving}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                >
                  <XCircle className="w-4 h-4" />
                  Não poderei ir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de presentes */}
        {p?.showGiftList && gifts.length > 0 && (
          <div>
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <GiftIcon className="w-5 h-5" style={{ color: primaryColor }} />
              Lista de presentes
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {gifts.map((gift) => (
                <div key={gift.id} className={`card-base ${gift.taken ? 'opacity-50' : ''}`}>
                  <p className="font-medium text-sm">{gift.name}</p>
                  {gift.description && <p className="text-xs text-charcoal-light mt-1">{gift.description}</p>}
                  {gift.options[0] && (
                    <p className="text-xs text-charcoal-light mt-2">
                      A partir de {gift.options[0].price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  )}
                  <button
                    onClick={() => reserveGift(gift.id)}
                    disabled={gift.taken || reservingId === gift.id}
                    className="btn-secondary w-full text-xs mt-3 disabled:opacity-60"
                  >
                    {gift.taken ? 'Já escolhido' : reservingId === gift.id ? 'Reservando...' : 'Vou dar esse'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
