import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, User, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);
    try {
      await register({ name, email, password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.details) {
          setFieldErrors(Object.fromEntries(err.details.map((d) => [d.campo, d.erro])));
        }
      } else {
        setError('Não foi possível criar a conta. Tente de novo.');
      }
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
          <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">Criar conta</h1>
          <p className="text-charcoal-light text-sm">
            Organize eventos e ofereça seus serviços em um só lugar
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
            <label className="text-xs font-medium text-charcoal-light block mb-1.5">Nome</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-light/50" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full bg-white rounded-xl pl-10 pr-4 py-3 text-sm border border-charcoal/10
                           outline-none focus:ring-2 focus:ring-blush/30 transition-shadow"
              />
            </div>
            {fieldErrors.name && <p className="text-rose text-xs mt-1">{fieldErrors.name}</p>}
          </div>

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
            {fieldErrors.email && <p className="text-rose text-xs mt-1">{fieldErrors.email}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-charcoal-light block mb-1.5">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-light/50" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ao menos 6 caracteres"
                className="w-full bg-white rounded-xl pl-10 pr-4 py-3 text-sm border border-charcoal/10
                           outline-none focus:ring-2 focus:ring-blush/30 transition-shadow"
              />
            </div>
            {fieldErrors.password && <p className="text-rose text-xs mt-1">{fieldErrors.password}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-blush w-full text-sm disabled:opacity-60">
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="text-center text-sm text-charcoal-light mt-6">
          Já tem conta?{' '}
          <Link to="/entrar" className="text-blush font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
