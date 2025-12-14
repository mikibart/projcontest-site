import React from 'react';
import { Button } from '../components/Button';
import { Page, PracticeType } from '../types';
import { FileText, HardHat, Scroll, Ruler, Zap, ArrowRight, ShieldCheck, Scale, FileSearch, Siren, Construction, Activity, Droplets, ShieldAlert, Calculator, CheckCircle2 } from 'lucide-react';

interface PracticesProps {
  onNavigate: (page: Page) => void;
}

export const Practices: React.FC<PracticesProps> = ({ onNavigate }) => {
  
  const services = [
    {
      id: PracticeType.CALCOLI_STRUTTURALI,
      icon: <Activity size={32} />,
      title: "Ingegneria Strutturale",
      desc: "Calcoli C.A., Acciaio e Legno. Pratiche sismiche al Genio Civile e Collaudi Statici.",
      price: "Preventivo",
      color: "text-red-600 bg-red-50"
    },
    {
      id: PracticeType.IMPIANTI_ELETTRICI,
      icon: <Zap size={32} />,
      title: "Impianti MEP",
      desc: "Progettazione impianti Elettrici, Termici, Idrici e Rinnovabili (Fotovoltaico).",
      price: "Preventivo",
      color: "text-yellow-600 bg-yellow-50"
    },
    {
      id: PracticeType.SICUREZZA,
      icon: <Siren size={32} />,
      title: "Sicurezza Cantieri",
      desc: "Coordinamento CSP/CSE, redazione Piano di Sicurezza (PSC) e notifiche ASL.",
      price: "Preventivo",
      color: "text-orange-600 bg-orange-50"
    },
    {
      id: PracticeType.ACCESSO_ATTI,
      icon: <FileSearch size={32} />,
      title: "Verifiche Preliminari",
      desc: "Accesso agli atti amministrativi, verifica conformità urbanistica e catastale.",
      price: "da €250",
      color: "text-indigo-600 bg-indigo-50"
    },
    {
      id: PracticeType.CILA,
      icon: <FileText size={32} />,
      title: "Pratiche Edilizie",
      desc: "CILA, SCIA, PdC per ristrutturazioni, manutenzioni o nuove costruzioni.",
      price: "da €800",
      color: "text-blue-600 bg-blue-50"
    },
    {
      id: PracticeType.ANTINCENDIO,
      icon: <ShieldAlert size={32} />,
      title: "Antincendio (CPI)",
      desc: "Progetti di prevenzione incendi per attività commerciali e autorimesse.",
      price: "Preventivo",
      color: "text-rose-600 bg-rose-50"
    },
    {
      id: PracticeType.DIREZIONE_LAVORI,
      icon: <Construction size={32} />,
      title: "Direzione Lavori",
      desc: "Supervisione tecnica, contabilità di cantiere, SAL e chiusura lavori.",
      price: "% Lavori",
      color: "text-teal-600 bg-teal-50"
    },
    {
      id: PracticeType.CATASTO,
      icon: <Ruler size={32} />,
      title: "Catasto & Topografia",
      desc: "DOCFA, Tipi Mappali, Rilievi topografici e riconfinamenti.",
      price: "da €250",
      color: "text-green-600 bg-green-50"
    },
    {
      id: PracticeType.COMPUTO,
      icon: <Calculator size={32} />,
      title: "Computi Metrici",
      desc: "Analisi costi dettagliata per appalti e richieste di finanziamento.",
      price: "da €350",
      color: "text-gray-600 bg-gray-100"
    }
  ];

  return (
    <div className="animate-fade-in pb-20">
      {/* Hero Section */}
      <section className="relative bg-neutral-bg pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 z-0" />
        
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-neutral-muted text-xs font-bold tracking-widest uppercase mb-6 animate-fade-in-up">
            Studio Tecnico Digitale
          </div>
          
          <h1 className="font-display font-bold text-5xl md:text-7xl text-primary mb-6 leading-tight">
            Architettura &<br />
            <span className="italic font-light text-secondary">Ingegneria</span> Integrata.
          </h1>
          
          <p className="text-xl text-neutral-muted max-w-2xl mx-auto mb-10 font-serif leading-relaxed">
            Un unico portale per Design, Burocrazia, Calcoli Strutturali, Impianti e Collaudi. 
            Il supporto tecnico completo per il tuo cantiere.
          </p>

          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={() => onNavigate('PRACTICE_WIZARD')} className="shadow-xl shadow-primary/20">
              Richiedi Servizio Tecnico
            </Button>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="container mx-auto px-4 md:px-6 -mt-20 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div key={service.id} className="bg-white p-8 rounded-xl border border-gray-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer" onClick={() => onNavigate('PRACTICE_WIZARD')}>
              <div className={`w-14 h-14 rounded-xl ${service.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {service.icon}
              </div>
              <h3 className="font-display font-bold text-2xl mb-3 text-neutral-text">{service.title}</h3>
              <p className="text-neutral-muted mb-6 text-sm leading-relaxed">{service.desc}</p>
              
              <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <span className="font-mono font-bold text-primary">{service.price}</span>
                <span className="text-sm font-bold text-secondary flex items-center group-hover:translate-x-1 transition-transform">
                  Richiedi <ArrowRight size={16} className="ml-1"/>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Integrated Workflow */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2">
               <h2 className="font-display text-4xl mb-6 text-primary">Un flusso di lavoro<br/>senza interruzioni.</h2>
               <div className="space-y-8">
                 {[
                   { title: "Progetto Architettonico", text: "Partiamo dal design vincitore del concorso o dalla tua idea preliminare." },
                   { title: "Ingegnerizzazione", text: "Il nostro team sviluppa strutturali e impianti integrati nel progetto, senza conflitti." },
                   { title: "Burocrazia & Cantiere", text: "Presentiamo le pratiche e dirigiamo i lavori fino alla consegna chiavi in mano." }
                 ].map((step, i) => (
                   <div key={i} className="flex gap-6">
                     <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-secondary text-secondary flex items-center justify-center font-bold font-mono">
                       {i + 1}
                     </div>
                     <div>
                       <h4 className="font-bold text-lg mb-2">{step.title}</h4>
                       <p className="text-neutral-muted">{step.text}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
            <div className="md:w-1/2 bg-neutral-bg p-8 rounded-3xl border border-gray-200 relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl"></div>
               {/* Mockup Card */}
               <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 relative z-10">
                 <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                   <div className="font-bold text-lg">Pacchetto Esecutivo</div>
                   <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-bold">COMPLETO</div>
                 </div>
                 <div className="space-y-3">
                    <div className="flex items-center text-sm"><CheckCircle2 size={16} className="text-primary mr-2"/> Progetto Architettonico</div>
                    <div className="flex items-center text-sm"><CheckCircle2 size={16} className="text-primary mr-2"/> Calcoli Strutturali Dep.</div>
                    <div className="flex items-center text-sm"><CheckCircle2 size={16} className="text-primary mr-2"/> Impianti Elettrici/Termici</div>
                    <div className="flex items-center text-sm"><CheckCircle2 size={16} className="text-primary mr-2"/> SCIA Presentata</div>
                    <div className="flex items-center text-sm"><CheckCircle2 size={16} className="text-primary mr-2"/> PSC Sicurezza</div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <section className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-16">
            <div className="flex items-center justify-center gap-3">
              <ShieldCheck size={24} className="text-secondary"/>
              <span className="font-medium">Responsabilità Civile</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Activity size={24} className="text-secondary"/>
              <span className="font-medium">Software Certificati</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Scroll size={24} className="text-secondary"/>
              <span className="font-medium">Timbrato & Firmato</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};