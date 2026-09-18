import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, Loader2, AlertCircle, Mail, Phone, Calendar, Users,
  Send, Clock,
} from 'lucide-react';
import { api, ApiError, type QuoteRequest } from '../lib/api';

const statusLabel: Record<QuoteRequest['status'], { label: string; color: string }> = {
  pendente: { label: 'Aguardando resposta', color: 'bg-blush/10 text-blush-dark' },
  respondido: { label: 'Respondido', color: 'bg-sage/10 text-sage' },
  aceito: { label: 'Aceito', color: 'bg-sage/20 text-sage' },
  recusado: { label: 'Recusado', color: 'bg-rose/10 text-rose' },
};

export default function VendorQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRequest[] | null>(null);
  const [error, setError] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  const load = () => {
    api.vendors
      .myQuotes()
      .then(({ quotes }) => setQuotes(quotes))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Não foi possível carregar os pedidos.'));
  };

  useEffect(load, []);

  const reply = async (quoteId: string) => {
    setSendingId(quoteId);
    try {
      const { quote } = await api.vendors.replyQuote(quoteId, {
        vendorReply: replyDrafts[quoteId] || '',
        quotedPrice: priceDrafts[quoteId] ? Number(priceDrafts[quoteId]) : undefined,
      });
      setQuotes((prev) => prev?.map((q) => (q.id === quote.id ? quote : q)) || null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível enviar a resposta.');
    } finally {
      setSendingId(null);
    }
  };

  if (quotes === null && !error) {
    return (
      <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blush animate-spin" />
      </main>
    );
  }

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="max-w-3xl mx-auto section-padding">
        <Link to="/fornecedor" className="inline-flex items-center gap-1.5 text-sm text-charcoal-light hover:text-charcoal transition-colors mb-4">
          <ChevronLeft className="w-4 h-4" />
          Meu perfil
        </Link>

        <h1 className="font-display text-2xl font-semibold tracking-tight mb-1">Pedidos de orçamento</h1>
        <p className="text-sm text-charcoal-light mb-6">Responda quem pediu orçamento com você.</p>

        {error && (
          <div className="flex items-start gap-2 bg-rose/10 text-rose text-sm rounded-xl p-3 mb-4">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {quotes && quotes.length === 0 && (
          <div className="text-center py-16 text-charcoal-light text-sm">
            Nenhum pedido de orçamento ainda. Quando alguém pedir, aparece aqui.
          </div>
        )}

        <div className="space-y-4">
          {quotes?.map((q) => {
            const status = statusLabel[q.status];
            return (
              <div key={q.id} className="card-base">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-medium text-sm">{q.name}</p>
                    <div className="flex items-center gap-3 text-xs text-charcoal-light mt-1 flex-wrap">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{q.email}</span>
                      {q.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{q.phone}</span>}
                      {q.eventDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(q.eventDate).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {q.guestCount != null && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{q.guestCount} convidados</span>}
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                {q.message && (
                  <p className="text-sm text-charcoal-light bg-cream rounded-xl p-3 mb-3">{q.message}</p>
                )}

                {q.vendorReply ? (
                  <div className="bg-sage/5 border border-sage/10 rounded-xl p-3">
                    <p className="text-xs text-charcoal-light mb-1">Sua resposta:</p>
                    <p className="text-sm">{q.vendorReply}</p>
                    {q.quotedPrice != null && (
                      <p className="text-sm font-semibold text-sage mt-1">
                        {q.quotedPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 pt-2 border-t border-charcoal/5">
                    <textarea
                      rows={2}
                      placeholder="Escreva sua resposta..."
                      value={replyDrafts[q.id] || ''}
                      onChange={(e) => setReplyDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                      className="w-full bg-white rounded-xl px-3.5 py-2.5 text-sm border border-charcoal/10 outline-none focus:ring-2 focus:ring-blush/30 resize-none"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number" min={0} step="0.01" placeholder="Valor (opcional)"
                        value={priceDrafts[q.id] || ''}
                        onChange={(e) => setPriceDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                        className="w-40 bg-white rounded-xl px-3.5 py-2.5 text-sm border border-charcoal/10 outline-none focus:ring-2 focus:ring-blush/30"
                      />
                      <button
                        onClick={() => reply(q.id)}
                        disabled={sendingId === q.id || !replyDrafts[q.id]?.trim()}
                        className="btn-blush text-xs px-4 flex items-center gap-1.5 disabled:opacity-60"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {sendingId === q.id ? 'Enviando...' : 'Responder'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1 text-[10px] text-charcoal-light mt-3">
                  <Clock className="w-3 h-3" />
                  {new Date(q.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
