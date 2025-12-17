import React from 'react';
import { Button } from '../components/Button';
import { Page } from '../types';
import { Lightbulb, Target, Clock, Euro, TrendingUp, Award, Users, Shield } from 'lucide-react';

interface ArchitectsProps {
  onNavigate: (page: Page) => void;
}

export const Architects: React.FC<ArchitectsProps> = ({ onNavigate }) => {
  const benefits = [
    {
      icon: <Lightbulb size={32} />,
      title: "Opportunità",
      desc: "Accedi a progetti reali di clienti motivati, senza dover investire in marketing o acquisizione clienti.",
      color: "bg-blue-50 text-primary"
    },
    {
      icon: <Target size={32} />,
      title: "Visibilità",
      desc: "Costruisci il tuo portfolio e aumenta la tua reputazione attraverso progetti di successo.",
      color: "bg-orange-50 text-secondary"
    },
    {
      icon: <Clock size={32} />,
      title: "Flessibilità",
      desc: "Scegli i progetti che ti interessano e lavora secondo i tuoi tempi e disponibilità.",
      color: "bg-green-50 text-functional-success"
    },
    {
      icon: <Euro size={32} />,
      title: "Trasparenza",
      desc: "Budget chiari fin dall'inizio. Nessuna negoziazione difficile, solo progetti ben definiti.",
      color: "bg-purple-50 text-purple-600"
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Registrati",
      desc: "Crea il tuo profilo gratuitamente e completa la verifica professionale."
    },
    {
      number: "2",
      title: "Esplora",
      desc: "Sfoglia i contest attivi e scegli quelli più adatti al tuo stile e competenze."
    },
    {
      number: "3",
      title: "Partecipa",
      desc: "Carica le tue proposte creative. Proteggiamo la tua proprietà intellettuale."
    },
    {
      number: "4",
      title: "Vinci",
      desc: "Se il cliente sceglie il tuo progetto, sviluppi il lavoro completo e ricevi il compenso."
    }
  ];

  const stats = [
    { icon: <Euro size={24} />, value: "€850", label: "Premio medio per contest" },
    { icon: <Award size={24} />, value: "85%", label: "Progetti completati con successo" },
    { icon: <Users size={24} />, value: "1,200+", label: "Architetti attivi" }
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="bg-primary py-20 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <h1 className="font-display font-bold text-4xl md:text-5xl mb-6">
            Per Architetti e Designer
          </h1>
          <p className="text-primary-light text-lg max-w-2xl mx-auto mb-8">
            Partecipa ai contest, mostra il tuo talento e trova nuovi clienti su ProjContest.
          </p>
          <Button size="lg" variant="secondary" onClick={() => onNavigate('EXPLORE')}>
            Esplora i Contest Attivi
          </Button>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-neutral-bg">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-neutral-text mb-4">Perché Partecipare?</h2>
            <p className="text-neutral-muted">I vantaggi per i professionisti</p>
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

      {/* How It Works Section */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl text-neutral-text mb-4">Come Funziona?</h2>
            <p className="text-neutral-muted">Il processo in 4 semplici passi</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gray-200 -z-0"></div>

            {steps.map((step, idx) => (
              <div key={idx} className="relative z-10 text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-primary text-white rounded-full flex items-center justify-center text-3xl font-bold shadow-lg">
                  {step.number}
                </div>
                <h3 className="font-display font-bold text-xl text-neutral-text mb-3">{step.title}</h3>
                <p className="text-neutral-muted leading-relaxed text-sm px-4">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Button size="lg" onClick={() => onNavigate('HOW_IT_WORKS')}>
              Scopri tutti i dettagli
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-neutral-bg border-t border-gray-200">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl p-8 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  {stat.icon}
                </div>
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-neutral-muted text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex flex-col md:flex-row items-center justify-center gap-8 text-neutral-muted text-sm font-medium">
             <span className="flex items-center"><Shield className="text-functional-success mr-2" size={18}/> Proprietà Intellettuale Protetta</span>
             <span className="flex items-center"><Euro className="text-primary mr-2" size={18}/> Pagamenti Garantiti</span>
             <span className="flex items-center"><TrendingUp className="text-secondary mr-2" size={18}/> Cresci con la Community</span>
          </div>
        </div>
      </section>
    </div>
  );
};
