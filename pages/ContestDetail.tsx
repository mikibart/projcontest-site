import React, { useState } from 'react';
import { MOCK_CONTESTS } from '../constants';
import { Button } from '../components/Button';
import { Clock, MapPin, Users, Coins, Download, MessageSquare, ChevronLeft, Share2, Heart, ShieldCheck, Trophy, CheckCircle2 } from 'lucide-react';

interface ContestDetailProps {
  id: string;
  onBack: () => void;
}

export const ContestDetail: React.FC<ContestDetailProps> = ({ id, onBack }) => {
  const contest = MOCK_CONTESTS.find(c => c.id === id) || MOCK_CONTESTS[0];
  const [activeTab, setActiveTab] = useState<'brief' | 'requirements'>('brief');

  return (
    <div className="animate-fade-in bg-white min-h-screen">
      
      {/* Immersive Header Image */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
        <img 
          src={contest.imageUrl} 
          alt={contest.title} 
          className="w-full h-full object-cover animate-pan-slow"
        />
        
        {/* Navigation overlaid */}
        <div className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-center">
           <button onClick={onBack} className="text-white/80 hover:text-white flex items-center bg-black/20 backdrop-blur-md px-4 py-2 rounded-full transition-colors border border-white/10">
            <ChevronLeft size={18} className="mr-1"/> Torna indietro
          </button>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10"><Share2 size={18}/></button>
            <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10"><Heart size={18}/></button>
          </div>
        </div>

        {/* Title Block Content */}
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-20">
          <div className="container mx-auto">
            <div className="max-w-4xl">
              <div className="inline-flex items-center px-3 py-1 bg-secondary text-white rounded text-xs font-bold uppercase tracking-wider mb-4 shadow-lg">
                {contest.category}
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-4 leading-tight shadow-sm">
                {contest.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-white/90 text-sm md:text-base font-medium">
                <span className="flex items-center"><MapPin size={18} className="mr-2 text-secondary"/> {contest.location}</span>
                <span className="flex items-center"><Clock size={18} className="mr-2 text-secondary"/> Scade tra {contest.daysRemaining} giorni</span>
                <span className="flex items-center"><Users size={18} className="mr-2 text-secondary"/> {contest.proposalsCount} designer partecipanti</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 -mt-8 relative z-30">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Main Content Column */}
          <div className="flex-1 bg-white rounded-t-3xl md:rounded-3xl">
             
             {/* Tabs Navigation */}
             <div className="border-b border-gray-100 mb-8 sticky top-20 bg-white/95 backdrop-blur z-10 pt-4">
               <div className="flex gap-8">
                 <button 
                   onClick={() => setActiveTab('brief')}
                   className={`pb-4 text-lg font-medium transition-colors relative ${activeTab === 'brief' ? 'text-primary' : 'text-neutral-muted hover:text-neutral-text'}`}
                 >
                   Brief & Obiettivi
                   {activeTab === 'brief' && <span className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"></span>}
                 </button>
                 <button 
                   onClick={() => setActiveTab('requirements')}
                   className={`pb-4 text-lg font-medium transition-colors relative ${activeTab === 'requirements' ? 'text-primary' : 'text-neutral-muted hover:text-neutral-text'}`}
                 >
                   Consegna & Allegati
                   {activeTab === 'requirements' && <span className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"></span>}
                 </button>
               </div>
             </div>

             <div className="prose prose-lg prose-blue max-w-none text-neutral-text/80 font-serif leading-relaxed">
               {activeTab === 'brief' ? (
                 <div className="animate-fade-in space-y-8">
                   <div className="bg-gray-50 p-6 rounded-xl border-l-4 border-secondary italic text-neutral-600">
                     "{contest.description}"
                   </div>
                   
                   <div>
                     <h3 className="font-sans font-bold text-2xl text-neutral-text mb-4">La Visione</h3>
                     <p>Il cliente richiede uno spazio luminoso, con utilizzo di materiali naturali come legno e pietra locale. Importante mantenere un dialogo con l'architettura esistente pur inserendo elementi contemporanei. L'illuminazione dovrà giocare un ruolo chiave nel definire i volumi.</p>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                        <h4 className="font-sans font-bold text-lg mb-4 text-primary flex items-center"><CheckCircle2 size={20} className="mr-2"/> Must-Haves</h4>
                        <ul className="space-y-3 text-sm">
                          <li className="flex items-start"><span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-2"></span>Open space cucina-soggiorno fluido</li>
                          <li className="flex items-start"><span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-2"></span>Isola centrale multifunzione</li>
                          <li className="flex items-start"><span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-2"></span>Pavimentazione continua (resina o parquet)</li>
                        </ul>
                      </div>
                      <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                        <h4 className="font-sans font-bold text-lg mb-4 text-functional-error flex items-center"><ShieldCheck size={20} className="mr-2"/> Vincoli Tecnici</h4>
                         <ul className="space-y-3 text-sm">
                          <li className="flex items-start"><span className="w-1.5 h-1.5 bg-functional-error rounded-full mt-2 mr-2"></span>Pilastro portante in soggiorno (non rimovibile)</li>
                          <li className="flex items-start"><span className="w-1.5 h-1.5 bg-functional-error rounded-full mt-2 mr-2"></span>Scarichi cucina posizionati a Nord</li>
                        </ul>
                      </div>
                   </div>
                 </div>
               ) : (
                 <div className="animate-fade-in space-y-8">
                   <div>
                      <h3 className="font-sans font-bold text-2xl text-neutral-text mb-4">Output Richiesti</h3>
                      <p>Per essere considerati per la vittoria, i progettisti devono caricare:</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 not-prose">
                        {['Planimetria Arredata (1:50)', 'Moodboard Materiali', '2 Render Fotorealistici', 'Schema Illuminotecnico'].map((item, i) => (
                          <li key={i} className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100 font-medium text-sm">
                            <CheckCircle2 size={16} className="text-functional-success mr-2"/> {item}
                          </li>
                        ))}
                      </ul>
                   </div>
                   
                   <div className="pt-6 border-t border-gray-100">
                     <h4 className="font-sans font-bold text-lg mb-4">Materiali di partenza (Download)</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
                       <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white hover:border-primary hover:shadow-md transition-all group cursor-pointer">
                         <div className="flex items-center">
                           <div className="w-12 h-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center font-bold text-sm mr-4 group-hover:bg-red-600 group-hover:text-white transition-colors">PDF</div>
                           <div>
                              <div className="font-bold text-neutral-text">Planimetria Catastale</div>
                              <div className="text-xs text-neutral-muted">2.4 MB • Aggiornato ieri</div>
                           </div>
                         </div>
                         <Download size={20} className="text-neutral-300 group-hover:text-primary"/>
                       </div>
                       <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white hover:border-primary hover:shadow-md transition-all group cursor-pointer">
                         <div className="flex items-center">
                           <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm mr-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">DWG</div>
                           <div>
                              <div className="font-bold text-neutral-text">Rilievo Tecnico</div>
                              <div className="text-xs text-neutral-muted">12 MB • Vettoriale</div>
                           </div>
                         </div>
                         <Download size={20} className="text-neutral-300 group-hover:text-primary"/>
                       </div>
                     </div>
                   </div>
                 </div>
               )}
             </div>
          </div>

          {/* Sticky Sidebar */}
          <div className="lg:w-[380px] shrink-0 relative">
             <div className="sticky top-24 space-y-6">
               
               {/* Prize Card */}
               <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                 
                 <div className="text-center mb-6 relative z-10">
                   <div className="inline-flex items-center gap-2 text-xs font-bold text-functional-success bg-green-50 px-3 py-1 rounded-full mb-3">
                     <ShieldCheck size={14}/> PAGAMENTO GARANTITO
                   </div>
                   <div className="text-sm text-neutral-muted font-medium tracking-wide uppercase">Premio Vincitore</div>
                   <div className="text-5xl font-mono font-bold text-primary mt-2">€{contest.budget.toLocaleString()}</div>
                 </div>
                 
                 <Button fullWidth size="lg" className="mb-3 text-lg shadow-lg shadow-primary/20 hover:scale-[1.02]">
                   <Trophy size={20} className="mr-2"/> Partecipa Ora
                 </Button>
                 <p className="text-xs text-center text-neutral-muted mb-6">Accettando i termini di servizio e copyright</p>
                 
                 <Button fullWidth variant="outline" className="text-neutral-text border-gray-300">
                   <MessageSquare size={18} className="mr-2"/> Domande Pubbliche
                 </Button>
               </div>

               {/* Client Info */}
               <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                 <h4 className="font-bold text-sm text-neutral-muted uppercase tracking-wider mb-4">Sul Cliente</h4>
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center font-serif font-bold text-neutral-600 text-lg">
                     M
                   </div>
                   <div>
                     <div className="font-bold text-neutral-text">Marco R.</div>
                     <div className="flex items-center text-xs text-neutral-muted mt-1">
                       <span className="flex text-yellow-400 mr-2">★★★★★</span>
                       <span>4 Contest completati</span>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Timeline */}
               <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                 <h4 className="font-bold text-sm text-neutral-muted uppercase tracking-wider mb-4">Timeline</h4>
                 <div className="space-y-4 relative pl-2">
                   <div className="absolute left-[7px] top-2 h-[80%] w-[2px] bg-gray-100"></div>
                   
                   <div className="flex gap-4 relative">
                     <div className="w-4 h-4 rounded-full bg-green-500 border-4 border-white shadow-sm shrink-0 z-10"></div>
                     <div>
                       <div className="text-xs text-neutral-muted">20 Gen</div>
                       <div className="text-sm font-bold">Apertura Contest</div>
                     </div>
                   </div>
                   <div className="flex gap-4 relative">
                     <div className="w-4 h-4 rounded-full bg-primary border-4 border-white shadow-sm shrink-0 z-10 animate-pulse"></div>
                     <div>
                       <div className="text-xs text-neutral-muted">Oggi</div>
                       <div className="text-sm font-bold text-primary">Invio Proposte</div>
                     </div>
                   </div>
                   <div className="flex gap-4 relative opacity-50">
                     <div className="w-4 h-4 rounded-full bg-gray-300 border-4 border-white shadow-sm shrink-0 z-10"></div>
                     <div>
                       <div className="text-xs text-neutral-muted">{contest.deadline}</div>
                       <div className="text-sm font-bold">Chiusura & Selezione</div>
                     </div>
                   </div>
                 </div>
               </div>

             </div>
          </div>
        </div>
      </div>
    </div>
  );
};