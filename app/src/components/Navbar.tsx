import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Sparkles, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const navLinks = [
    { path: '/', label: 'Início' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/servicos', label: 'Serviços' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-cream/80 backdrop-blur-xl border-b border-charcoal/5">
      <div className="max-w-7xl mx-auto section-padding">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-charcoal rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-5 h-5 text-blush" />
            </div>
            <span className="font-display text-xl font-semibold tracking-tight">
              Festão
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.path
                    ? 'bg-charcoal text-ivory'
                    : 'text-charcoal-light hover:bg-charcoal/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/criar-evento" className="btn-primary text-xs px-6 py-2.5">
              Criar evento
            </Link>
            {user ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs text-charcoal-light">
                  <User className="w-3.5 h-3.5" />
                  {user.name.split(' ')[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full text-charcoal-light hover:bg-charcoal/5 transition-colors"
                  aria-label="Sair"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link to="/entrar" className="btn-secondary text-xs px-5 py-2.5">
                Entrar
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden shrink-0 inline-flex items-center justify-center p-2 rounded-xl text-charcoal hover:bg-charcoal/5 transition-colors"
            aria-label="Menu de navegação"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-cream border-b border-charcoal/5 overflow-hidden"
          >
            <div className="section-padding py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${
                    location.pathname === link.path
                      ? 'bg-charcoal text-ivory'
                      : 'text-charcoal-light hover:bg-charcoal/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/criar-evento"
                onClick={() => setIsOpen(false)}
                className="block btn-primary text-center text-xs mt-3"
              >
                Criar evento
              </Link>
              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 btn-secondary text-xs mt-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sair ({user.name.split(' ')[0]})
                </button>
              ) : (
                <Link
                  to="/entrar"
                  onClick={() => setIsOpen(false)}
                  className="block btn-secondary text-center text-xs mt-2"
                >
                  Entrar
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
