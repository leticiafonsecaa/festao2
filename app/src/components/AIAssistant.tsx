import { useState } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([
    {
      role: 'ai',
      text: 'Olá! 👋 Sou a assistente do Festão. Posso ajudar com ideias para seu evento, sugestões de presentes, checklists e muito mais. Como posso ajudar?'
    }
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: message }]);
    setMessage('');
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: 'Obrigada pela sua mensagem! Em breve estarei totalmente integrada e poderei ajudar com sugestões personalizadas para o seu evento. Por enquanto, explore as funcionalidades da plataforma! 🎉'
      }]);
    }, 1000);
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-charcoal text-ivory rounded-2xl
                       flex items-center justify-center shadow-card-hover
                       hover:shadow-glow transition-all duration-300 hover:scale-105 group"
          >
            <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blush rounded-full flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)]
                       bg-white rounded-3xl shadow-card-hover overflow-hidden border border-charcoal/5"
          >
            {/* Header */}
            <div className="bg-charcoal text-ivory p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blush/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-blush" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Assistente Festão</p>
                  <p className="text-xs text-ivory/50">Online agora</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-ivory/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-72 overflow-y-auto p-4 space-y-3 bg-cream/50">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-charcoal text-ivory rounded-br-md'
                        : 'bg-white text-charcoal shadow-soft rounded-bl-md'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-charcoal/5 bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-cream rounded-xl px-4 py-2.5 text-sm outline-none
                             placeholder:text-charcoal-light/50 focus:ring-2 focus:ring-blush/30"
                />
                <button
                  onClick={handleSend}
                  className="w-10 h-10 bg-charcoal text-ivory rounded-xl flex items-center justify-center
                             hover:bg-charcoal-light transition-colors active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
