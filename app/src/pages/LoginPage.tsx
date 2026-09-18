import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar. Tente de novo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pt-24 pb-16 min-h-screen flex items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto section-padding w-full"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-charcoal rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-blush" />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">Entrar</h1>
          <p className="text-charcoal-light text-sm">
            Acesse seus eventos e o seu perfil de fornecedor
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card-base space-y-4">
          {error && (
            <div className="flex items-start gap-2 bg-rose/10 text-rose text-sm rounded-xl p-3">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-charcoal-light block mb-1.5">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-light/50" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                className="w-full bg-white rounded-xl pl-10 pr-4 py-3 text-sm border border-charcoal/10
                           outline-none focus:ring-2 focus:ring-blush/30 transition-shadow"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-charcoal-light block mb-1.5">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-light/50" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white rounded-xl pl-10 pr-4 py-3 text-sm border border-charcoal/10
                           outline-none focus:ring-2 focus:ring-blush/30 transition-shadow"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-blush w-full text-sm disabled:opacity-60">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-charcoal-light mt-6">
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="text-blush font-medium hover:underline">
            Criar conta
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
