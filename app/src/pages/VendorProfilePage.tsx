import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Store, Loader2, AlertCircle, CheckCircle2, Image as ImageIcon,
  Trash2, Plus, Inbox, ExternalLink,
} from 'lucide-react';
import { api, ApiError, type Vendor } from '../lib/api';

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'fotografia', label: 'Fotografia' },
  { id: 'filmagem', label: 'Filmagem' },
  { id: 'decoracao', label: 'Decoração' },
  { id: 'buffet', label: 'Buffet' },
  { id: 'doces', label: 'Doces' },
  { id: 'bolo', label: 'Bolo' },
  { id: 'musica', label: 'Música/DJ' },
  { id: 'maquiagem', label: 'Maquiagem' },
  { id: 'espacos', label: 'Espaços' },
  { id: 'convites', label: 'Convites' },
  { id: 'lembrancinhas', label: 'Lembrancinhas' },
  { id: 'outros', label: 'Outros' },
];

const emptyForm = {
  businessName: '',
  category: 'fotografia',
  description: '',
  city: '',
  state: '',
  priceFrom: '',
  priceUnit: 'evento',
  phone: '',
  whatsapp: '',
  instagram: '',
  website: '',
  coverImage: '',
};

export default function VendorProfilePage() {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [addingPhoto, setAddingPhoto] = useState(false);

  useEffect(() => {
    api.vendors
      .myProfile()
      .then(({ vendor }) => {
        setVendor(vendor);
        setForm({
          businessName: vendor.businessName,
          category: vendor.category,
          description: vendor.description,
          city: vendor.city,
          state: vendor.state,
          priceFrom: vendor.priceFrom != null ? String(vendor.priceFrom) : '',
          priceUnit: vendor.priceUnit,
          phone: vendor.phone || '',
          whatsapp: vendor.whatsapp || '',
          instagram: vendor.instagram || '',
          website: vendor.website || '',
          coverImage: vendor.coverImage || '',
        });
      })
      .catch((err) => {
        // 404 e normal aqui: so quer dizer que a pessoa ainda nao e fornecedora
        if (!(err instanceof ApiError && err.status === 404)) {
          setSubmitError(err instanceof ApiError ? err.message : 'Não foi possível carregar seu perfil.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError('');
    setSaving(true);

    const payload = {
      businessName: form.businessName,
      category: form.category,
      description: form.description,
      city: form.city,
      state: form.state,
      priceFrom: form.priceFrom ? Number(form.priceFrom) : null,
      priceUnit: form.priceUnit,
      phone: form.phone,
      whatsapp: form.whatsapp,
      instagram: form.instagram,
      website: form.website,
      coverImage: form.coverImage,
    };

    try {
      const { vendor: updated } = vendor
        ? await api.vendors.updateProfile(payload)
        : await api.vendors.createProfile(payload);
      setVendor(updated);
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
        if (err.details) setErrors(Object.fromEntries(err.details.map((d) => [d.campo, d.erro])));
      } else {
        setSubmitError('Não foi possível salvar. Tente de novo.');
      }
    } finally {
      setSaving(false);
    }
  };

  const addPhoto = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) return;
    setAddingPhoto(true);
    try {
      const { photo } = await api.vendors.addPhoto({ url: newPhotoUrl.trim() });
      setVendor((v) => (v ? { ...v, photos: [...(v.photos || []), photo] } : v));
      setNewPhotoUrl('');
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Não foi possível adicionar a foto.');
    } finally {
      setAddingPhoto(false);
    }
  };

  const removePhoto = async (photoId?: string) => {
    if (!photoId) return;
    try {
      await api.vendors.removePhoto(photoId);
      setVendor((v) => (v ? { ...v, photos: (v.photos || []).filter((p) => p.id !== photoId) } : v));
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Não foi possível remover a foto.');
    }
  };

  if (loading) {
    return (
      <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blush animate-spin" />
      </main>
    );
  }

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="max-w-2xl mx-auto section-padding">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-charcoal rounded-2xl flex items-center justify-center">
              <Store className="w-5 h-5 text-blush" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                {vendor ? 'Meu perfil de fornecedor' : 'Anunciar meu serviço'}
              </h1>
              <p className="text-sm text-charcoal-light">
                {vendor ? 'Mantenha suas informações em dia' : 'Apareça para quem procura fornecedores'}
              </p>
            </div>
          </div>
          {vendor && (
            <div className="flex flex-col items-end gap-2">
              <Link to="/fornecedor/pedidos" className="btn-secondary text-xs flex items-center gap-2 whitespace-nowrap">
                <Inbox className="w-4 h-4" />
                Pedidos de orçamento
              </Link>
              <Link to={`/profissional/${vendor.slug}`} className="text-xs text-charcoal-light hover:text-charcoal flex items-center gap-1">
                Ver meu perfil público <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {submitError && (
          <div className="flex items-start gap-2 bg-rose/10 text-rose text-sm rounded-xl p-3 mb-4">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}
        {saved && (
          <div className="flex items-start gap-2 bg-sage/10 text-sage text-sm rounded-xl p-3 mb-4">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Perfil salvo.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card-base space-y-4 mb-6">
          <div>
            <label className="text-xs font-medium text-charcoal-light block mb-1.5">Nome do negócio</label>
            <input
              type="text" required value={form.businessName}
              onChange={(e) => updateField('businessName', e.target.value)}
              className="w-full bg-white rounded-xl px-4 py-2.5 text-sm border border-charcoal/10 outline-none focus:ring-2 focus:ring-blush/30"
            />
            {errors.businessName && <p className="text-rose text-xs mt-1">{errors.businessName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-charcoal-light block mb-1.5">Categoria</label>
              <select
                value={form.category} onChange={(e) => updateField('category', e.target.value)}
                className="w-full bg-white rounded-xl px-4 py-2.5 text-sm border border-charcoal/10 outline-none focus:ring-2 focus:ring-blush/30"
              >
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-charcoal-light block mb-1.5">Cidade</label>
              <input
                type="text" required value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
                className="w-full bg-white rounded-xl px-4 py-2.5 text-sm border border-charcoal/10 outline-none focus:ring-2 focus:ring-blush/30"
              />
              {errors.city && <p className="text-rose text-xs mt-1">{errors.city}</p>}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-charcoal-light block mb-1.5">Descrição</label>
            <textarea
              rows={4} value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Conte o que você oferece, seu diferencial, experiência..."
              className="w-full bg-white rounded-xl px-4 py-2.5 text-sm border border-charcoal/10 outline-none focus:ring-2 focus:ring-blush/30 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-charcoal-light block mb-1.5">Preço a partir de (R$)</label>
              <input
                type="number" min={0} step="0.01" value={form.priceFrom}
                onChange={(e) => updateField('priceFrom', e.target.value)}
                className="w-full bg-white rounded-xl px-4 py-2.5 text-sm border border-charcoal/10 outline-none focus:ring-2 focus:ring-blush/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-charcoal-light block mb-1.5">Por</label>
              <select
                value={form.priceUnit} onChange={(e) => updateField('priceUnit', e.target.value)}
                className="w-full bg-white rounded-xl px-4 py-2.5 text-sm border border-charcoal/10 outline-none focus:ring-2 focus:ring-blush/30"
              >
                <option value="evento">Evento</option>
                <option value="pessoa">Pessoa</option>
                <option value="hora">Hora</option>
                <option value="diaria">Diária</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-charcoal-light block mb-1.5">Telefone</label>
              <input
                type="text" value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full bg-white rounded-xl px-4 py-2.5 text-sm border border-charcoal/10 outline-none focus:ring-2 focus:ring-blush/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-charcoal-light block mb-1.5">Instagram</label>
              <input
                type="text" placeholder="@seuusuario" value={form.instagram}
                onChange={(e) => updateField('instagram', e.target.value)}
                className="w-full bg-white rounded-xl px-4 py-2.5 text-sm border border-charcoal/10 outline-none focus:ring-2 focus:ring-blush/30"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-charcoal-light block mb-1.5">Foto de capa (URL)</label>
            <input
              type="text" value={form.coverImage}
              onChange={(e) => updateField('coverImage', e.target.value)}
              placeholder="https://..."
              className="w-full bg-white rounded-xl px-4 py-2.5 text-sm border border-charcoal/10 outline-none focus:ring-2 focus:ring-blush/30"
            />
          </div>

          <button type="submit" disabled={saving} className="btn-blush w-full text-sm disabled:opacity-60">
            {saving ? 'Salvando...' : vendor ? 'Salvar alterações' : 'Criar meu perfil'}
          </button>
        </form>

        {vendor && (
          <div className="card-base">
            <h2 className="font-display text-lg font-semibold mb-1 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Portfólio
            </h2>
            <p className="text-xs text-charcoal-light mb-4">Cole a URL de uma foto para adicioná-la (até 20 fotos).</p>

            <form onSubmit={addPhoto} className="flex gap-2 mb-4">
              <input
                type="text" value={newPhotoUrl} onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 bg-white rounded-xl px-4 py-2.5 text-sm border border-charcoal/10 outline-none focus:ring-2 focus:ring-blush/30"
              />
              <button type="submit" disabled={addingPhoto} className="btn-secondary text-xs px-4 flex items-center gap-1.5 disabled:opacity-60">
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </form>

            {vendor.photos && vendor.photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {vendor.photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square bg-cream rounded-2xl overflow-hidden group">
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center
                                 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-charcoal-light">Nenhuma foto ainda.</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
