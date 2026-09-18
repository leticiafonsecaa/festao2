import { Link } from 'react-router-dom';
import { Sparkles, Instagram, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-charcoal text-ivory/70">
      <div className="max-w-7xl mx-auto section-padding py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-ivory rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-charcoal" />
              </div>
              <span className="font-display text-xl font-semibold text-ivory">
                Festão
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-ivory/50 max-w-xs">
              Tudo para o seu evento, em um só lugar. Organize, personalize e 
              compartilhe o seu momento especial.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display text-ivory text-sm font-semibold mb-4 tracking-wide uppercase">
              Plataforma
            </h4>
            <ul className="space-y-2.5">
              <li><Link to="/" className="text-sm hover:text-blush transition-colors">Início</Link></li>
              <li><Link to="/criar-evento" className="text-sm hover:text-blush transition-colors">Criar Evento</Link></li>

              <li><Link to="/dashboard" className="text-sm hover:text-blush transition-colors">Dashboard</Link></li>
              <li><Link to="/presentes" className="text-sm hover:text-blush transition-colors">Lista de Presentes</Link></li>
              <li><Link to="/servicos" className="text-sm hover:text-blush transition-colors">Serviços</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-ivory text-sm font-semibold mb-4 tracking-wide uppercase">
              Tipos de Evento
            </h4>
            <ul className="space-y-2.5">
              <li><span className="text-sm">Casamentos</span></li>
              <li><span className="text-sm">Festas de 15 anos</span></li>
              <li><span className="text-sm">Aniversários</span></li>
              <li><span className="text-sm">Eventos corporativos</span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-ivory text-sm font-semibold mb-4 tracking-wide uppercase">
              Contato
            </h4>
            <ul className="space-y-2.5">
              <li><a href="mailto:oi@festsao.com.br" className="text-sm hover:text-blush transition-colors">oi@festsao.com.br</a></li>
              <li><span className="text-sm flex items-center gap-2"><Instagram className="w-4 h-4" /> @festsao</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-ivory/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ivory/40">
            © 2026 Festão. Todos os direitos reservados.
          </p>
          <p className="text-xs text-ivory/40 flex items-center gap-1">
            Feito com <Heart className="w-3 h-3 text-blush fill-blush" /> para momentos especiais
          </p>
        </div>
      </div>
    </footer>
  );
}
