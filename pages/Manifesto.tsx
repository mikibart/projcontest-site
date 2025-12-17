import React from 'react';
import { Button } from '../components/Button';
import { Page } from '../types';
import { Sparkles, Scale, Eye, Rocket, CheckCircle2 } from 'lucide-react';

interface ManifestoProps {
  onNavigate: (page: Page) => void;
}

export const Manifesto: React.FC<ManifestoProps> = ({ onNavigate }) => {
  const principles = [
    {
      icon: <Sparkles size={40} />,
      title: "Democrazia del Design",
      desc: "L'architettura di qualità non deve essere un privilegio di pochi. Crediamo che ogni progetto meriti attenzione professionale, indipendentemente dal budget.",
      color: "bg-blue-50 text-primary"
    },
    {
      icon: <Scale size={40} />,
      title: "Meritocrazia",
      desc: "Il talento vince sempre. Diamo spazio ai migliori progetti, indipendentemente dalla dimensione dello studio o dagli anni di esperienza.",
      color: "bg-orange-50 text-secondary"
    },
    {
      icon: <Eye size={40} />,
      title: "Trasparenza",
      desc: "Prezzi chiari, processi definiti, comunicazione aperta. Nessuna sorpresa, solo professionalità e rispetto reciproco.",
      color: "bg-green-50 text-functional-success"
    },
    {
      icon: <Rocket size={40} />,
      title: "Innovazione",
      desc: "Utilizziamo la tecnologia per rendere il processo di progettazione più efficiente, collaborativo e accessibile a tutti.",
      color: "bg-purple-50 text-purple-600"
    }
  ];

  const commitments = [
    "Selezionare solo professionisti qualificati e verificati",
    "Proteggere la proprietà intellettuale di ogni progettista",
    "Garantire pagamenti sicuri e puntuali",
    "Fornire supporto continuo durante tutto il processo",
    "Mantenere standard di qualità elevati in ogni progetto",
    "Costruire una community basata sul rispetto e sulla collaborazione"
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="bg-primary py-20 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <h1 className="font-display font-bold text-4xl md:text-5xl mb-6">
            Il Nostro Manifesto
          </h1>
          <p className="text-primary-light text-lg max-w-2xl mx-auto">
            I principi che guidano ogni nostra decisione e il nostro impegno verso la community.
          </p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
      </section>

      {/* Principles Section */}
      <section className="py-20 bg-neutral-bg">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-neutral-text mb-4">I Nostri Principi</h2>
            <p className="text-neutral-muted">Le fondamenta su cui costruiamo il futuro dell'architettura</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {principles.map((principle, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow duration-300">
                <div className={`w-20 h-20 rounded-xl ${principle.color} flex items-center justify-center mb-6 shadow-sm`}>
                  {principle.icon}
                </div>
                <h3 className="font-display font-bold text-2xl text-neutral-text mb-4">{principle.title}</h3>
                <p className="text-neutral-muted leading-relaxed">{principle.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commitments Section */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-neutral-text mb-4">I Nostri Impegni</h2>
            <p className="text-neutral-muted">Cosa promettiamo a chi fa parte della nostra community</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {commitments.map((commitment, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary-light/50 transition-colors">
                <CheckCircle2 className="text-functional-success shrink-0 mt-1" size={20} />
                <p className="text-neutral-text leading-relaxed">{commitment}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 bg-neutral-bg border-t border-gray-200">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl text-center">
          <h2 className="font-display font-bold text-3xl text-neutral-text mb-6">La Nostra Visione</h2>
          <p className="text-neutral-muted text-lg leading-relaxed mb-8">
            Immaginiamo un mondo dove il talento architettonico sia accessibile a tutti,
            dove i professionisti siano valorizzati per le loro competenze,
            e dove ogni spazio rifletta la creatività e l'attenzione ai dettagli che merita.
          </p>
          <p className="text-neutral-text font-medium text-xl mb-12">
            Insieme, stiamo costruendo il futuro dell'architettura.
          </p>
          <Button size="lg" onClick={() => onNavigate('ABOUT')}>
            Scopri di più su di noi
          </Button>
        </div>
      </section>
    </div>
  );
};
