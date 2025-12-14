import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { ContestCard } from '../components/ContestCard';
import { ArrowRight, Star, ArrowDown, Layers, PenTool, HardHat, FileText, Activity, Loader2 } from 'lucide-react';
import { Page, Contest, Category, ContestStatus } from '../types';

interface HomeProps {
  onNavigate: (page: Page) => void;
  onContestClick: (id: string) => void;
}

interface ApiContest {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  budget: number;
  deadline: string;
  status: string;
  imageUrl: string | null;
  isFeatured: boolean;
  proposalsCount?: number;
  _count?: { proposals: number };
}

function mapApiContestToContest(c: ApiContest): Contest {
  const deadline = new Date(c.deadline);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const categoryMap: Record<string, Category> = {
    'RESIDENTIAL': Category.RESIDENTIAL,
    'COMMERCIAL': Category.COMMERCIAL,
    'INTERIOR': Category.INTERIOR,
    'URBAN': Category.URBAN,
    'CONCEPT': Category.CONCEPT,
  };

  const statusMap: Record<string, ContestStatus> = {
    'OPEN': ContestStatus.OPEN,
    'EVALUATING': ContestStatus.EVALUATING,
    'CLOSED': ContestStatus.CLOSED,
  };

  return {
    id: c.id,
    title: c.title,
    location: c.location,
    category: categoryMap[c.category] || Category.RESIDENTIAL,
    budget: c.budget,
    proposalsCount: c.proposalsCount || c._count?.proposals || 0,
    deadline: c.deadline,
    daysRemaining,
    status: statusMap[c.status] || ContestStatus.OPEN,
    imageUrl: c.imageUrl || `https://picsum.photos/seed/${c.id}/800/600`,
    description: c.description,
    isFeatured: c.isFeatured,
  };
}

export const Home: React.FC<HomeProps> = ({ onNavigate, onContestClick }) => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      const res = await fetch('/api/contests?featured=true&limit=5');
      if (!res.ok) throw new Error('Error');
      const data = await res.json();
      const mappedContests = (data.contests || data).map(mapApiContestToContest);
      setContests(mappedContests);
    } catch {
      // Fallback: try without featured filter
      try {
        const res = await fetch('/api/contests?limit=5');
        if (res.ok) {
          const data = await res.json();
          const mappedContests = (data.contests || data).map(mapApiContestToContest);
          setContests(mappedContests);
        }
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in overflow-hidden">

      {/* SECTION 1: HYBRID HERO */}
      <section className="relative min-h-[90vh] flex flex-col justify-center bg-neutral-bg">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-grid opacity-100 z-0 pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 relative z-10 pt-10">
          <div className="max-w-6xl mx-auto text-center md:text-left">

            {/* Super Headline */}
            <h1 className="font-display text-5xl md:text-8xl lg:text-[7rem] leading-[0.9] text-primary tracking-tight mb-8">
              Design. Permit. <br/>
              <span className="italic font-light text-secondary ml-4 md:ml-20">Build.</span>
            </h1>

            <div className="flex flex-col md:flex-row items-end gap-12 mt-12">
               {/* Description Box */}
               <div className="md:w-3/5 bg-white p-8 border-l-4 border-primary shadow-2xl shadow-gray-200/50 relative">
                 <div className="absolute -top-4 -right-4 bg-secondary text-white text-xs font-bold px-3 py-1 uppercase tracking-widest">End-to-End Platform</div>
                 <p className="text-lg md:text-xl text-neutral-text font-serif leading-relaxed mb-8">
                   La prima piattaforma che unisce la creatività dei <strong>Concorsi di Architettura</strong> con la concretezza di uno <strong>Studio di Ingegneria Digitale</strong>. Dal concept alla CILA, in un unico flusso.
                 </p>

                 {/* Dual CTA */}
                 <div className="flex flex-col sm:flex-row gap-4">
                   <Button withArrow onClick={() => onNavigate('LAUNCH_WIZARD')} className="flex-1">
                     <PenTool size={18} className="mr-2"/> Lancia Concorso
                   </Button>
                   <Button variant="secondary" onClick={() => onNavigate('PRACTICE_WIZARD')} className="flex-1">
                     <HardHat size={18} className="mr-2"/> Servizi Tecnici
                   </Button>
                 </div>
               </div>

               {/* Stat / Social Proof */}
               <div className="md:w-2/5 flex flex-col gap-6 md:pl-12">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="font-bold text-3xl text-primary font-mono">3k+</div>
                      <div className="text-xs text-neutral-muted uppercase tracking-wider mt-1">Architetti & Ing.</div>
                    </div>
                    <div>
                      <div className="font-bold text-3xl text-primary font-mono">150+</div>
                      <div className="text-xs text-neutral-muted uppercase tracking-wider mt-1">Cantieri Attivi</div>
                    </div>
                    <div>
                      <div className="font-bold text-3xl text-primary font-mono">24h</div>
                      <div className="text-xs text-neutral-muted uppercase tracking-wider mt-1">Tempo Preventivi</div>
                    </div>
                    <div>
                      <div className="font-bold text-3xl text-primary font-mono">100%</div>
                      <div className="text-xs text-neutral-muted uppercase tracking-wider mt-1">Normativa OK</div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-neutral-muted">
          <ArrowDown size={24} />
        </div>
      </section>

      {/* SECTION 2: THE ECOSYSTEM (New!) */}
      <section className="py-24 bg-primary text-white relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
           <div className="text-center mb-16">
             <span className="text-secondary text-xs font-bold tracking-widest uppercase mb-4 block">L'Ecosistema ProjContest</span>
             <h2 className="font-display text-4xl md:text-5xl">Non solo bei disegni.</h2>
             <p className="text-white/60 mt-4 max-w-2xl mx-auto">
               Uniamo la fase creativa a quella esecutiva. Il tuo progetto non si ferma al rendering, ma diventa cantiere.
             </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1: Design */}
              <div className="bg-white/5 border border-white/10 p-8 hover:bg-white/10 transition-colors group cursor-pointer" onClick={() => onNavigate('EXPLORE')}>
                 <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <Layers size={24} className="text-white"/>
                 </div>
                 <h3 className="text-2xl font-display mb-3">1. Design Contest</h3>
                 <p className="text-white/60 text-sm mb-6 leading-relaxed">
                   Metti in gara decine di architetti. Ottieni diverse soluzioni creative per il tuo spazio e scegli la migliore.
                 </p>
                 <span className="text-xs font-bold uppercase tracking-widest text-secondary flex items-center">
                   Esplora Concorsi <ArrowRight size={14} className="ml-2"/>
                 </span>
              </div>

              {/* Card 2: Engineering */}
              <div className="bg-white/5 border border-white/10 p-8 hover:bg-white/10 transition-colors group cursor-pointer" onClick={() => onNavigate('PRACTICES')}>
                 <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <Activity size={24} className="text-white"/>
                 </div>
                 <h3 className="text-2xl font-display mb-3">2. Ingegneria</h3>
                 <p className="text-white/60 text-sm mb-6 leading-relaxed">
                   Trasforma il design in esecutivo. Calcoli strutturali, impianti elettrici/termici e pratiche sismiche.
                 </p>
                 <span className="text-xs font-bold uppercase tracking-widest text-blue-400 flex items-center">
                   Vedi Servizi <ArrowRight size={14} className="ml-2"/>
                 </span>
              </div>

              {/* Card 3: Permits */}
              <div className="bg-white/5 border border-white/10 p-8 hover:bg-white/10 transition-colors group cursor-pointer" onClick={() => onNavigate('PRACTICE_WIZARD')}>
                 <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <FileText size={24} className="text-white"/>
                 </div>
                 <h3 className="text-2xl font-display mb-3">3. Burocrazia</h3>
                 <p className="text-white/60 text-sm mb-6 leading-relaxed">
                   Gestiamo la "carta". CILA, SCIA, Catasto, APE e Direzione Lavori. Tutto online, firmato digitalmente.
                 </p>
                 <span className="text-xs font-bold uppercase tracking-widest text-green-400 flex items-center">
                   Richiedi Permesso <ArrowRight size={14} className="ml-2"/>
                 </span>
              </div>
           </div>
        </div>
      </section>

      {/* SECTION 3: CURATED SHOWCASE (Contests) */}
      <section className="py-24 bg-white border-y border-gray-100">
         <div className="container mx-auto px-4 md:px-6 mb-12 flex justify-between items-end">
           <div>
             <span className="text-secondary text-xs font-bold tracking-widest uppercase mb-2 block">Vetrina Progetti</span>
             <h2 className="font-display text-4xl text-primary">Concorsi in Evidenza</h2>
           </div>
           <Button variant="outline" size="sm" onClick={() => onNavigate('EXPLORE')}>Vedi Tutti</Button>
         </div>

         {/* Contest Grid */}
         <div className="container mx-auto px-4 md:px-6">
           {loading ? (
             <div className="flex items-center justify-center py-20">
               <Loader2 className="w-8 h-8 animate-spin text-primary" />
               <span className="ml-3 text-neutral-muted">Caricamento...</span>
             </div>
           ) : contests.length > 0 ? (
             <>
               <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                 {/* Big Feature */}
                 <div className="md:col-span-8">
                    {contests[0] && <ContestCard contest={contests[0]} onClick={onContestClick} />}
                 </div>

                 {/* Side Column */}
                 <div className="md:col-span-4 flex flex-col gap-8 mt-12 md:mt-0">
                   <div className="bg-neutral-bg p-8 text-center border border-gray-200">
                     <h3 className="font-display text-2xl mb-2">Sei un Tecnico?</h3>
                     <p className="text-neutral-muted text-sm mb-6">Entra nel network. Ricevi incarichi per CILA, Calcoli e Sicurezza.</p>
                     <Button variant="secondary" fullWidth onClick={() => onNavigate('DASHBOARD')}>Candidati ora</Button>
                   </div>
                   {contests[1] && <ContestCard contest={contests[1]} onClick={onContestClick} />}
                 </div>
               </div>

               {/* Bottom Row */}
               {contests.length > 2 && (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                   {contests.slice(2, 5).map(c => (
                     <ContestCard key={c.id} contest={c} onClick={onContestClick} />
                   ))}
                 </div>
               )}
             </>
           ) : (
             <div className="text-center py-12 text-neutral-muted">
               <p>Nessun concorso disponibile al momento.</p>
               <Button variant="primary" className="mt-4" onClick={() => onNavigate('LAUNCH_WIZARD')}>
                 Lancia il primo concorso
               </Button>
             </div>
           )}
         </div>
      </section>

      {/* SECTION 4: TECHNICAL SERVICES PREVIEW */}
      <section className="py-24 bg-neutral-bg">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
             <div className="max-w-xl">
                <h2 className="font-display text-4xl text-primary mb-4">Servizi Rapidi</h2>
                <p className="text-neutral-muted">Hai già il progetto? Acquista direttamente i servizi tecnici necessari per iniziare il cantiere.</p>
             </div>
             <Button variant="link" withArrow onClick={() => onNavigate('PRACTICES')}>Listino Completo</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[
               { name: "CILA / Manutenzione", price: "€800", icon: <FileText/> },
               { name: "Calcoli Strutturali", price: "Su preventivo", icon: <Activity/> },
               { name: "APE Energetica", price: "€150", icon: <HardHat/> },
               { name: "Variazione Catastale", price: "€250", icon: <Layers/> },
             ].map((item, idx) => (
               <div key={idx} className="bg-white p-6 border border-gray-200 hover:border-primary transition-all cursor-pointer group" onClick={() => onNavigate('PRACTICE_WIZARD')}>
                  <div className="text-neutral-muted mb-4 group-hover:text-primary transition-colors">{item.icon}</div>
                  <h4 className="font-bold text-lg mb-1">{item.name}</h4>
                  <p className="text-xs text-neutral-muted">A partire da <span className="font-bold text-primary">{item.price}</span></p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: CTA */}
      <section className="py-32 bg-white text-center relative border-t border-gray-100">
         <div className="container mx-auto px-4">
           <h2 className="font-display text-4xl md:text-6xl text-primary mb-6">Pronto a trasformare il tuo spazio?</h2>
           <p className="text-neutral-muted text-xl mb-10 font-serif italic">Inizia dal design o passa direttamente al cantiere.</p>
           <div className="flex justify-center gap-4">
             <Button size="lg" withArrow onClick={() => onNavigate('LAUNCH_WIZARD')}>Inizia Wizard Progetto</Button>
           </div>
         </div>
      </section>
    </div>
  );
};
