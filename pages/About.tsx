import React from 'react';
import { Button } from '../components/Button';
import { Page } from '../types';
import { Target, Users, Globe, Award, Heart, TrendingUp } from 'lucide-react';

interface AboutProps {
  onNavigate: (page: Page) => void;
}

export const About: React.FC<AboutProps> = ({ onNavigate }) => {
  const values = [
    {
      icon: <Target size={32} />,
      title: "Missione",
      desc: "Democratizzare l'accesso a servizi di architettura e design di qualità, rendendo il talento accessibile a tutti.",
      color: "bg-blue-50 text-primary"
    },
    {
      icon: <Users size={32} />,
      title: "Community",
      desc: "Creare un ecosistema collaborativo dove clienti e professionisti crescono insieme.",
      color: "bg-orange-50 text-secondary"
    },
    {
      icon: <Award size={32} />,
      title: "Qualità",
      desc: "Garantire standard elevati attraverso la selezione dei migliori professionisti e progetti.",
      color: "bg-green-50 text-functional-success"
    },
    {
      icon: <Heart size={32} />,
      title: "Passione",
      desc: "Ogni progetto è un'opportunità per creare spazi che migliorano la vita delle persone.",
      color: "bg-purple-50 text-purple-600"
    }
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="bg-primary py-20 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <h1 className="font-display font-bold text-4xl md:text-5xl mb-6">
            Chi Siamo
          </h1>
          <p className="text-primary-light text-lg max-w-2xl mx-auto mb-6">
            ProjContest è la piattaforma che connette clienti e architetti attraverso contest di progettazione.
          </p>
          <p className="text-primary-light max-w-3xl mx-auto">
            Crediamo in un futuro dove ogni progetto, grande o piccolo, possa beneficiare
            della creatività e competenza di professionisti qualificati.
          </p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
      </section>

      {/* Values Grid */}
      <section className="py-20 bg-neutral-bg">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-neutral-text mb-4">I Nostri Valori</h2>
            <p className="text-neutral-muted">Ciò che ci guida ogni giorno</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, idx) => (
              <div key={idx} className="flex flex-col items-center text-center group">
                <div className={`w-24 h-24 rounded-2xl ${value.color} flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300 border border-white`}>
                  {value.icon}
                </div>
                <h3 className="font-display font-bold text-xl text-neutral-text mb-3">{value.title}</h3>
                <p className="text-neutral-muted leading-relaxed text-sm px-4">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-neutral-text mb-4">La Nostra Storia</h2>
          </div>

          <div className="prose prose-lg max-w-none text-neutral-muted">
            <p className="leading-relaxed mb-6">
              ProjContest nasce dall'esperienza diretta dei fondatori nel mondo dell'architettura e del design.
              Abbiamo visto troppi talenti rimanere nell'ombra e troppi clienti rinunciare a progetti di qualità
              per via di costi proibitivi o difficoltà nel trovare il professionista giusto.
            </p>
            <p className="leading-relaxed mb-6">
              Nel 2024, abbiamo deciso di cambiare le regole del gioco creando una piattaforma che mette
              al centro la meritocrazia e l'accessibilità. Oggi, ProjContest è il punto di riferimento
              per migliaia di professionisti e clienti in tutta Italia.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16 text-center">
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-neutral-muted text-sm">Progetti Completati</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="text-4xl font-bold text-secondary mb-2">1,200+</div>
              <div className="text-neutral-muted text-sm">Architetti Attivi</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="text-4xl font-bold text-functional-success mb-2">98%</div>
              <div className="text-neutral-muted text-sm">Clienti Soddisfatti</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-neutral-bg py-16 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-2xl text-neutral-text mb-6">
            Pronto a iniziare il tuo progetto?
          </h2>
          <Button size="lg" onClick={() => onNavigate('LAUNCH_WIZARD')}>
            Lancia il tuo concorso
          </Button>
        </div>
      </section>
    </div>
  );
};
