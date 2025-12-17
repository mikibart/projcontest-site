import React from 'react';
import { Button } from '../components/Button';
import { Page } from '../types';
import { Briefcase, Zap, TrendingUp, Heart, Coffee, MapPin, Code, Palette } from 'lucide-react';

interface CareersProps {
  onNavigate: (page: Page) => void;
}

export const Careers: React.FC<CareersProps> = ({ onNavigate }) => {
  const benefits = [
    {
      icon: <Zap size={32} />,
      title: "Crescita Rapida",
      desc: "Lavora su progetti innovativi e impattanti fin dal primo giorno",
      color: "bg-blue-50 text-primary"
    },
    {
      icon: <MapPin size={32} />,
      title: "Remote-Friendly",
      desc: "Lavora da dove vuoi. Valutiamo i risultati, non le ore in ufficio",
      color: "bg-orange-50 text-secondary"
    },
    {
      icon: <TrendingUp size={32} />,
      title: "Impatto Reale",
      desc: "Le tue decisioni influenzano migliaia di professionisti e clienti",
      color: "bg-green-50 text-functional-success"
    },
    {
      icon: <Heart size={32} />,
      title: "Team Appassionato",
      desc: "Colleghi motivati che amano quello che fanno",
      color: "bg-purple-50 text-purple-600"
    }
  ];

  const openPositions = [
    {
      icon: <Code size={24} />,
      title: "Full-Stack Developer",
      type: "Full-time",
      location: "Remote / Palermo",
      desc: "Cerchiamo uno sviluppatore esperto in React, Node.js e PostgreSQL per migliorare la nostra piattaforma."
    },
    {
      icon: <Palette size={24} />,
      title: "Product Designer",
      type: "Full-time",
      location: "Remote / Palermo",
      desc: "Progetta esperienze utente eccezionali per architetti e clienti sulla nostra piattaforma."
    }
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="bg-primary py-20 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <h1 className="font-display font-bold text-4xl md:text-5xl mb-6">
            Lavora con noi
          </h1>
          <p className="text-primary-light text-lg max-w-2xl mx-auto mb-6">
            Stiamo costruendo il futuro dell'architettura e del design. Unisciti al nostro team!
          </p>
          <div className="flex items-center justify-center gap-2 text-primary-light">
            <Coffee size={20} />
            <span>Team giovane e dinamico con sede a Palermo</span>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-neutral-bg">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-neutral-text mb-4">Perché ProjContest?</h2>
            <p className="text-neutral-muted">Cosa rende speciale lavorare con noi</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex flex-col items-center text-center group">
                <div className={`w-24 h-24 rounded-2xl ${benefit.color} flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300 border border-white`}>
                  {benefit.icon}
                </div>
                <h3 className="font-display font-bold text-xl text-neutral-text mb-3">{benefit.title}</h3>
                <p className="text-neutral-muted leading-relaxed text-sm px-4">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions Section */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-neutral-text mb-4">Posizioni Aperte</h2>
            <p className="text-neutral-muted">Unisciti al team e aiutaci a crescere</p>
          </div>

          {openPositions.length > 0 ? (
            <div className="space-y-6">
              {openPositions.map((position, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-6 hover:border-primary-light/50 hover:shadow-md transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                      {position.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="font-display font-bold text-xl text-neutral-text">{position.title}</h3>
                        <span className="text-xs px-3 py-1 bg-blue-50 text-primary rounded-full font-medium">{position.type}</span>
                        <span className="text-xs px-3 py-1 bg-gray-100 text-neutral-muted rounded-full flex items-center gap-1">
                          <MapPin size={12} />
                          {position.location}
                        </span>
                      </div>
                      <p className="text-neutral-muted leading-relaxed mb-4">{position.desc}</p>
                      <Button variant="outline" size="sm">
                        Candidati
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-neutral-bg border border-gray-200 rounded-xl p-12 text-center">
              <Briefcase size={48} className="mx-auto mb-4 text-neutral-muted" />
              <h3 className="font-bold text-xl text-neutral-text mb-3">Nessuna posizione aperta al momento</h3>
              <p className="text-neutral-muted mb-6">
                Ma siamo sempre interessati a conoscere talenti eccezionali!
              </p>
              <p className="text-sm text-neutral-muted">
                Invia il tuo CV a <a href="mailto:careers@projcontest.com" className="text-primary hover:underline font-medium">careers@projcontest.com</a>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-neutral-bg py-16 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-2xl text-neutral-text mb-4">
            Non trovi la posizione giusta?
          </h2>
          <p className="text-neutral-muted mb-8 max-w-2xl mx-auto">
            Siamo sempre aperti a conoscere persone di talento. Inviaci il tuo CV e raccontaci come potresti contribuire a ProjContest.
          </p>
          <a href="mailto:careers@projcontest.com">
            <Button size="lg">
              Invia la tua candidatura
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
};
