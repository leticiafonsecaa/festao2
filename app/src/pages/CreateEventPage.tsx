import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api, ApiError, type EventType } from '../lib/api';
import {
  Heart, PartyPopper, Cake, Building2, Sparkles, GraduationCap, Baby,
  ChevronRight, ChevronLeft, MapPin, Calendar, Clock,
  CheckCircle2, AlertCircle,
} from 'lucide-react';

const eventTypes: { id: EventType; label: string; icon: typeof Heart; emoji: string; desc: string }[] = [
  { id: 'casamento', label: 'Casamento', icon: Heart, emoji: '💒', desc: 'O dia mais especial' },
  { id: '15anos', label: 'Festa de 15 anos', icon: PartyPopper, emoji: '🎉', desc: 'Um momento inesquecível' },
  { id: 'aniversario', label: 'Aniversário', icon: Cake, emoji: '🎂', desc: 'Celebre mais um ano' },
  { id: 'formatura', label: 'Formatura', icon: GraduationCap, emoji: '🎓', desc: 'A conquista de um diploma' },
  { id: 'cha-de-bebe', label: 'Chá de bebê', icon: Baby, emoji: '🍼', desc: 'Aguardando a chegada' },
  { id: 'corporativo', label: 'Corporativo', icon: Building2, emoji: '🏢', desc: 'Eventos de empresa' },
  { id: 'outro', label: 'Outro', icon: Sparkles, emoji: '✨', desc: 'Qualquer outro evento' },
];

const steps = ['Tipo', 'Detalhes', 'Descrição', 'Confirmar'];

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    type: '' as EventType | '',
    name: '',
    hosts: '',
    date: '',
    time: '19:00',
    venue: '',
    city: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (step === 0 && !formData.type) {
      newErrors.type = 'Selecione o tipo de evento';
    }
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Nome do evento é obrigatório';
      if (!formData.hosts.trim()) newErrors.hosts = 'Nome dos organizadores é obrigatório';
      if (!formData.date) newErrors.date = 'Data é obrigatória';
      if (!formData.venue.trim()) newErrors.venue = 'Local é obrigatório';
      if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep((s) => Math.min(s + 1, steps.length - 1));
    }
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleCreate = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!formData.type) return;
    setSubmitError('');
    setSaving(true);
    try {
      const { event } = await api.events.create({
        name: formData.name,
        type: formData.type,
        date: formData.date,
        time: formData.time,
        venue: formData.venue,
        city: formData.city,
        description: formData.description,
        hosts: formData.hosts,
      });
      navigate(`/dashboard/${event.id}`);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Não foi possível criar o evento. Tente de novo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="max-w-2xl mx-auto section-padding">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="font-display text-3xl lg:text-4xl font-semibold mb-2 tracking-tight">
            Criar <span className="italic text-rose">evento</span>
          </h1>
          <p className="text-charcoal-light">
            Preencha os dados abaixo para criar seu evento
          </p>
        </motion.div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                i < step
                  ? 'bg-sage text-white'
                  : i === step
                  ? 'bg-charcoal text-ivory'
                  : 'bg-cream text-charcoal-light'
              }`}>
                {i < step ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-12 h-0.5 rounded-full transition-colors duration-300 ${
                  i < step ? 'bg-sage' : 'bg-cream'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          {/* Step 0: Event Type */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="font-display text-xl font-semibold mb-2">Qual tipo de evento?</h2>
              {errors.type && <p className="text-rose text-xs">{errors.type}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {eventTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => updateField('type', type.id)}
                    className={`card-base text-left flex items-center gap-4 transition-all duration-200 ${
                      formData.type === type.id
                        ? 'ring-2 ring-blush border-blush'
                        : 'hover:border-charcoal/20'
                    }`}
                  >
                    <span className="text-3xl">{type.emoji}</span>
                    <div>
                      <p className="font-medium text-sm">{type.label}</p>
                      <p className="text-xs text-charcoal-light">{type.desc}</p>
                    </div>
                    {formData.type === type.id && (
                      <CheckCircle2 className="w-5 h-5 text-blush ml-auto flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <h2 className="font-display text-xl font-semibold mb-2">Detalhes do evento</h2>
              
              <div>
                <label className="text-xs font-medium text-charcoal-light block mb-1.5">
                  Nome do evento *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Ex: Casamento de Ana & Lucas"
                  className="w-full bg-white rounded-xl px-4 py-3 text-sm border border-charcoal/10
                             outline-none focus:ring-2 focus:ring-blush/30 transition-shadow"
                />
                {errors.name && <p className="text-rose text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-charcoal-light block mb-1.5">
                  Quem está organizando? *
                </label>
                <input
                  type="text"
                  value={formData.hosts}
                  onChange={(e) => updateField('hosts', e.target.value)}
                  placeholder="Ex: Ana & Lucas"
                  className="w-full bg-white rounded-xl px-4 py-3 text-sm border border-charcoal/10
                             outline-none focus:ring-2 focus:ring-blush/30 transition-shadow"
                />
                {errors.hosts && <p className="text-rose text-xs mt-1">{errors.hosts}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-charcoal-light block mb-1.5">
                    Data *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-light/50" />
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => updateField('date', e.target.value)}
                      className="w-full bg-white rounded-xl pl-10 pr-4 py-3 text-sm border border-charcoal/10
                                 outline-none focus:ring-2 focus:ring-blush/30 transition-shadow"
                    />
                  </div>
                  {errors.date && <p className="text-rose text-xs mt-1">{errors.date}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-charcoal-light block mb-1.5">
                    Horário
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-light/50" />
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => updateField('time', e.target.value)}
                      className="w-full bg-white rounded-xl pl-10 pr-4 py-3 text-sm border border-charcoal/10
                                 outline-none focus:ring-2 focus:ring-blush/30 transition-shadow"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-charcoal-light block mb-1.5">
                    Local / Espaço *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-light/50" />
                    <input
                      type="text"
                      value={formData.venue}
                      onChange={(e) => updateField('venue', e.target.value)}
                      placeholder="Ex: Espaço Jardim"
                      className="w-full bg-white rounded-xl pl-10 pr-4 py-3 text-sm border border-charcoal/10
                                 outline-none focus:ring-2 focus:ring-blush/30 transition-shadow"
                    />
                  </div>
                  {errors.venue && <p className="text-rose text-xs mt-1">{errors.venue}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-charcoal-light block mb-1.5">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="Ex: São Paulo, SP"
                    className="w-full bg-white rounded-xl px-4 py-3 text-sm border border-charcoal/10
                               outline-none focus:ring-2 focus:ring-blush/30 transition-shadow"
                  />
                  {errors.city && <p className="text-rose text-xs mt-1">{errors.city}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Description */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <h2 className="font-display text-xl font-semibold mb-2">Descreva seu evento</h2>
              <p className="text-sm text-charcoal-light">
                Adicione uma mensagem especial para seus convidados. Isso aparecerá na página do evento.
              </p>
              <div>
                <label className="text-xs font-medium text-charcoal-light block mb-1.5">
                  Mensagem para os convidados
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Ex: Estamos muito felizes em celebrar este momento especial com vocês. Venham celebrar conosco!"
                  rows={5}
                  className="w-full bg-white rounded-xl px-4 py-3 text-sm border border-charcoal/10
                             outline-none focus:ring-2 focus:ring-blush/30 transition-shadow resize-none"
                />
              </div>
              <div className="bg-cream/50 rounded-2xl p-4">
                <p className="text-xs text-charcoal-light mb-2">💡 Dica</p>
                <p className="text-sm text-charcoal-light">
                  Uma boa mensagem faz os convidados se sentirem especiais. 
                  Conte um pouco sobre o que este evento significa para vocês!
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="font-display text-xl font-semibold mb-2">Revise e confirme</h2>
              
              <div className="card-base">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-charcoal/5">
                    <span className="text-2xl">
                      {eventTypes.find(t => t.id === formData.type)?.emoji || '✨'}
                    </span>
                    <div>
                      <p className="font-display text-lg font-semibold">{formData.name}</p>
                      <p className="text-xs text-charcoal-light">{formData.hosts}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blush" />
                      <span>{formData.date ? new Date(formData.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blush" />
                      <span>{formData.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blush" />
                      <span>{formData.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blush" />
                      <span>{formData.city}</span>
                    </div>
                  </div>

                  {formData.description && (
                    <div className="pt-3 border-t border-charcoal/5">
                      <p className="text-xs text-charcoal-light mb-1">Mensagem</p>
                      <p className="text-sm text-charcoal-light italic">"{formData.description}"</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blush/5 border border-blush/10 rounded-2xl p-4">
                <p className="text-sm text-charcoal-light">
                  ✨ Após criar o evento, você poderá adicionar convidados, montar a lista de presentes, 
                  personalizar a página e muito mais!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-charcoal/5">
          {step > 0 ? (
            <button
              onClick={prevStep}
              className="btn-secondary flex items-center gap-2 text-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </button>
          ) : (
            <div />
          )}

          {step < steps.length - 1 ? (
            <button
              onClick={nextStep}
              className="btn-primary flex items-center gap-2 text-xs"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => handleCreate()}
              disabled={saving}
              className="btn-blush flex items-center gap-2 text-xs disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              {saving ? 'Criando...' : 'Criar evento'}
            </button>
          )}
        </div>
        {submitError && (
          <div className="flex items-start gap-2 bg-rose/10 text-rose text-sm rounded-xl p-3 mt-4">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}
      </div>
    </main>
  );
}
