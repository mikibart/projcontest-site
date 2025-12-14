import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Page } from '../types';
import { 
  PenTool, 
  Search, 
  Trophy, 
  Download, 
  MessageSquare, 
  FileText, 
  Layers, 
  CheckCircle2,
  HelpCircle,
  Briefcase,
  Users
} from 'lucide-react';

interface HowItWorksProps {
  onNavigate: (page: Page) => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onNavigate }) => {
  const [activeRole, setActiveRole] = useState<'client' | 'architect'>('client');

  const clientSteps = [
    {
      icon: <FileText size={32} />,
      title: "1. Crea il Brief",
      desc: "Usa il nostro wizard intuitivo per descrivere il tuo progetto. Specifica budget, stile e carica planimetrie o ispirazioni.",
      color: "bg-blue-50 text-primary"
    },
    {
      icon: <Users size={32} />,
      title: "2. Ricevi Proposte",
      desc: "Il concorso viene lanciato. Decine di architetti e designer inviano le loro idee creative e soluzioni preliminari.",
      color: "bg-orange-50 text-secondary"
    },
    {
      icon: <MessageSquare size={32} />,
      title: "3. Interagisci",
      desc: "Dai feedback ai progettisti durante il contest per affinare le proposte e ottenere esattamente ciò che cerchi.",
      color: "bg-green-50 text-functional-success"
    },
    {
      icon: <Download size={32} />,
      title: "4. Scegli e Scarica",
      desc: "Seleziona il vincitore. Ricevi i file esecutivi (DWG, PDF, Render) completi e pronti per l'uso.",
      color: "bg-gray-100 text-neutral-text"
    }
  ];

  const architectSteps = [
    {
      icon: <Search size={32} />,
      title: "1. Scegli un Concorso",
      desc: "Sfoglia i concorsi attivi filtrando per categoria, budget e tipologia. Trova quello più adatto al tuo stile.",
      color: "bg-blue-50 text-primary"
    },
    {
      icon: <PenTool size={32} />,
      title: "2. Carica il Progetto",
      desc: "Sviluppa la tua idea e carica le tavole richieste. Proteggiamo la tua proprietà intellettuale fino alla selezione.",
      color: "bg-orange-50 text-secondary"
    },
    {
      icon: <Layers size={32} />,
      title: "3. Fatti Notare",
      desc: "Arricchisci il tuo portfolio. Anche se non vinci, i clienti possono contattarti per collaborazioni dirette.",
      color: "bg-purple-50 text-purple-600"
    },
    {
      icon: <Trophy size={32} />,
      title: "4. Vinci e Guadagna",
      desc: "Se il tuo progetto viene selezionato, ricevi il premio in denaro garantito e una recensione per il tuo profilo.",
      color: "bg-yellow-50 text-yellow-600"
    }
  ];

  const steps = activeRole === 'client' ? clientSteps : architectSteps;

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="bg-primary py-20 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <h1 className="font-display font-bold text-4xl md:text-5xl mb-6">
            Dall'idea al progetto,<br /> in pochi semplici passi.
          </h1>
          <p className="text-primary-light text-lg max-w-2xl mx-auto mb-10">
            ProjContest è il punto d'incontro tra chi sogna uno spazio unico e chi sa progettarlo. 
            Scopri come funziona la piattaforma.
          </p>

          {/* Role Switcher */}
          <div className="inline-flex bg-primary-light/20 p-1 rounded-full backdrop-blur-sm border border-white/10">
            <button 
              onClick={() => setActiveRole('client')}
              className={`px-8 py-3 rounded-full font-medium transition-all duration-300 ${activeRole === 'client' ? 'bg-white text-primary shadow-lg' : 'text-white hover:bg-white/10'}`}
            >
              Sono un Cliente
            </button>
            <button 
              onClick={() => setActiveRole('architect')}
              className={`px-8 py-3 rounded-full font-medium transition-all duration-300 ${activeRole === 'architect' ? 'bg-white text-primary shadow-lg' : 'text-white hover:bg-white/10'}`}
            >
              Sono un Progettista
            </button>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
      </section>

      {/* Steps Grid */}
      <section className="py-20 bg-neutral-bg">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gray-200 -z-0"></div>

            {steps.map((step, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
                <div className={`w-24 h-24 rounded-2xl ${step.color} flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300 border border-white`}>
                  {step.icon}
                </div>
                <h3 className="font-display font-bold text-xl text-neutral-text mb-3">{step.title}</h3>
                <p className="text-neutral-muted leading-relaxed text-sm px-4">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Button size="lg" onClick={() => onNavigate(activeRole === 'client' ? 'LAUNCH_WIZARD' : 'EXPLORE')}>
              {activeRole === 'client' ? 'Lancia il tuo concorso' : 'Esplora i concorsi attivi'}
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-neutral-text mb-4">Domande Frequenti</h2>
            <p className="text-neutral-muted">Tutto quello che devi sapere prima di iniziare.</p>
          </div>

          <div className="space-y-4">
            {[
              { q: "Quanto costa lanciare un concorso?", a: "Il costo base parte da €250 + il budget per il premio che decidi tu. La piattaforma trattiene una commissione del 15% sul totale." },
              { q: "Cosa succede se non ricevo proposte che mi piacciono?", a: "Offriamo una garanzia 'Soddisfatti o Rimborsati'. Se non ricevi almeno 3 proposte conformi al brief, ti rimborsiamo la quota del premio." },
              { q: "Chi detiene i diritti d'autore del progetto?", a: "Al momento della selezione del vincitore, i diritti di utilizzo economico del progetto vengono trasferiti automaticamente al cliente. Il progettista mantiene il diritto morale e di pubblicazione nel portfolio." },
              { q: "Quali file devo consegnare come architetto?", a: "Dipende dal concorso, ma generalmente: pianta arredata, 1-2 render, e una breve relazione. Se vinci, dovrai fornire i file sorgente (DWG/DXF)." }
            ].map((faq, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-6 hover:border-primary-light/50 transition-colors">
                <h4 className="font-bold text-neutral-text flex items-start gap-3 mb-2">
                  <HelpCircle className="text-primary shrink-0 mt-1" size={18} />
                  {faq.q}
                </h4>
                <p className="text-neutral-muted pl-8 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust/Guarantee Banner */}
      <section className="bg-neutral-bg py-12 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex flex-col md:flex-row items-center justify-center gap-8 text-neutral-muted text-sm font-medium">
             <span className="flex items-center"><CheckCircle2 className="text-functional-success mr-2" size={18}/> Pagamenti Protetti</span>
             <span className="flex items-center"><Briefcase className="text-primary mr-2" size={18}/> Professionisti Verificati</span>
             <span className="flex items-center"><Trophy className="text-secondary mr-2" size={18}/> Supporto Dedicato</span>
          </div>
        </div>
      </section>
    </div>
  );
};