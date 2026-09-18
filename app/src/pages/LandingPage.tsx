import { Link } from 'react-router-dom';
import { ArrowRight, CalendarHeart, Check, Sparkles } from 'lucide-react';

const highlights = [
	'Organize convidados, presentes e detalhes em um só lugar',
	'Personalize seu evento com praticidade',
	'Conte com ajuda inteligente em cada etapa',
];

export default function LandingPage() {
	return (
		<main className="pt-24 pb-16">
			<section className="max-w-7xl mx-auto section-padding grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center min-h-[70vh]">
				<div>
					<div className="inline-flex items-center gap-2 rounded-full bg-coral/10 px-4 py-2 text-sm text-coral mb-6">
						<Sparkles className="w-4 h-4" />
						Seu evento, do seu jeito
					</div>
					<h1 className="font-display text-5xl md:text-7xl font-semibold leading-[0.95] text-charcoal mb-6">
						Planeje momentos que ficam para sempre.
					</h1>
					<p className="text-lg text-charcoal-light max-w-xl mb-8">
						O Festão reúne tudo o que você precisa para criar, organizar e celebrar eventos inesquecíveis.
					</p>
					<div className="flex flex-wrap gap-4 mb-10">
						<Link to="/criar-evento" className="inline-flex items-center gap-2 rounded-xl bg-coral px-6 py-3 font-medium text-white hover:bg-coral-dark transition-colors">
							Criar meu evento
							<ArrowRight className="w-5 h-5" />
						</Link>
						<Link to="/servicos" className="inline-flex items-center gap-2 rounded-xl border border-charcoal/15 px-6 py-3 font-medium text-charcoal hover:bg-white transition-colors">
							Conhecer serviços
						</Link>
					</div>
					<ul className="space-y-3 text-charcoal-light">
						{highlights.map((highlight) => (
							<li key={highlight} className="flex items-center gap-3">
								<span className="flex h-5 w-5 items-center justify-center rounded-full bg-sage text-white">
									<Check className="w-3 h-3" />
								</span>
								{highlight}
							</li>
						))}
					</ul>
				</div>
				<div className="relative rounded-[2rem] bg-peach p-8 md:p-12 min-h-[360px] flex items-center justify-center overflow-hidden">
					<div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-coral/20" />
					<div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-sage/20" />
					<div className="relative rounded-2xl bg-white p-8 shadow-xl max-w-sm w-full">
						<CalendarHeart className="w-10 h-10 text-coral mb-5" />
						<p className="text-sm text-charcoal-light mb-2">Próximo passo</p>
						<h2 className="font-display text-3xl font-semibold mb-4">Comece a celebrar</h2>
						<p className="text-charcoal-light">Crie seu primeiro evento e deixe a organização mais leve.</p>
					</div>
				</div>
			</section>
		</main>
	);
}
