import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Clock, MapPin, Users, Coins, Download, MessageSquare, ChevronLeft, Share2, Heart, ShieldCheck, Trophy, CheckCircle2, Loader2, X, Upload } from 'lucide-react';
import { apiFetch, getUser, isLoggedIn } from '../utils/api';
import { Category, ContestStatus } from '../types';

interface ContestDetailProps {
  id: string;
  onBack: () => void;
  onLoginRequired?: () => void;
}

interface ApiContest {
  id: string;
  title: string;
  description: string;
  brief: string;
  location: string;
  category: string;
  budget: number;
  deadline: string;
  status: string;
  imageUrl: string | null;
  isFeatured: boolean;
  mustHaves: string[];
  constraints: string[];
  deliverables: string[];
  client?: { name: string; id: string };
  _count?: { proposals: number };
}

export const ContestDetail: React.FC<ContestDetailProps> = ({ id, onBack, onLoginRequired }) => {
  const [contest, setContest] = useState<ApiContest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'brief' | 'requirements'>('brief');

  // Proposal submission state
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalDescription, setProposalDescription] = useState('');
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [proposalSuccess, setProposalSuccess] = useState(false);

  const user = getUser();

  useEffect(() => {
    fetchContest();
  }, [id]);

  const fetchContest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/contests/${id}`);
      if (!res.ok) throw new Error('Contest non trovato');
      const data = await res.json();
      setContest(data);
    } catch (err) {
      setError('Impossibile caricare il contest');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProposal = async () => {
    if (!isLoggedIn()) {
      if (onLoginRequired) onLoginRequired();
      return;
    }

    if (!proposalDescription.trim()) {
      setProposalError('Inserisci una descrizione della tua proposta');
      return;
    }

    setSubmittingProposal(true);
    setProposalError(null);

    const { data, error } = await apiFetch<any>('/proposals', {
      method: 'POST',
      body: JSON.stringify({
        contestId: id,
        description: proposalDescription,
      }),
    });

    setSubmittingProposal(false);

    if (error) {
      setProposalError(error);
      return;
    }

    setProposalSuccess(true);
    setTimeout(() => {
      setShowProposalModal(false);
      setProposalSuccess(false);
      setProposalDescription('');
      fetchContest(); // Refresh to update proposal count
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-neutral-muted">Caricamento...</span>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 mb-4">{error || 'Contest non trovato'}</p>
        <Button variant="outline" onClick={onBack}>Torna indietro</Button>
      </div>
    );
  }

  const deadline = new Date(contest.deadline);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const proposalsCount = contest._count?.proposals || 0;

  const categoryLabels: Record<string, string> = {
    'RESIDENTIAL': 'Residenziale',
    'COMMERCIAL': 'Commerciale',
    'INTERIOR': 'Interior',
    'URBAN': 'Urbano',
    'CONCEPT': 'Concept',
  };

  const isArchitect = user?.role === 'ARCHITECT';
  const isContestOpen = contest.status === 'OPEN';

  return (
    <div className="animate-fade-in bg-white min-h-screen">

      {/* Immersive Header Image */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
        <img
          src={contest.imageUrl || `https://picsum.photos/seed/${contest.id}/800/600`}
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
                {categoryLabels[contest.category] || contest.category}
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-4 leading-tight shadow-sm">
                {contest.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-white/90 text-sm md:text-base font-medium">
                <span className="flex items-center"><MapPin size={18} className="mr-2 text-secondary"/> {contest.location}</span>
                <span className="flex items-center"><Clock size={18} className="mr-2 text-secondary"/> Scade tra {daysRemaining} giorni</span>
                <span className="flex items-center"><Users size={18} className="mr-2 text-secondary"/> {proposalsCount} designer partecipanti</span>
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

                   {contest.brief && contest.brief !== contest.description && (
                     <div>
                       <h3 className="font-sans font-bold text-2xl text-neutral-text mb-4">La Visione</h3>
                       <p>{contest.brief}</p>
                     </div>
                   )}

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {contest.mustHaves && contest.mustHaves.length > 0 && (
                        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                          <h4 className="font-sans font-bold text-lg mb-4 text-primary flex items-center"><CheckCircle2 size={20} className="mr-2"/> Must-Haves</h4>
                          <ul className="space-y-3 text-sm">
                            {contest.mustHaves.map((item, i) => (
                              <li key={i} className="flex items-start"><span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-2"></span>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {contest.constraints && contest.constraints.length > 0 && (
                        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                          <h4 className="font-sans font-bold text-lg mb-4 text-functional-error flex items-center"><ShieldCheck size={20} className="mr-2"/> Vincoli Tecnici</h4>
                           <ul className="space-y-3 text-sm">
                            {contest.constraints.map((item, i) => (
                              <li key={i} className="flex items-start"><span className="w-1.5 h-1.5 bg-functional-error rounded-full mt-2 mr-2"></span>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                   </div>
                 </div>
               ) : (
                 <div className="animate-fade-in space-y-8">
                   {contest.deliverables && contest.deliverables.length > 0 && (
                     <div>
                        <h3 className="font-sans font-bold text-2xl text-neutral-text mb-4">Output Richiesti</h3>
                        <p>Per essere considerati per la vittoria, i progettisti devono caricare:</p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 not-prose">
                          {contest.deliverables.map((item, i) => (
                            <li key={i} className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100 font-medium text-sm">
                              <CheckCircle2 size={16} className="text-functional-success mr-2"/> {item}
                            </li>
                          ))}
                        </ul>
                     </div>
                   )}

                   <div className="pt-6 border-t border-gray-100">
                     <h4 className="font-sans font-bold text-lg mb-4">Materiali di partenza (Download)</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
                       <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white hover:border-primary hover:shadow-md transition-all group cursor-pointer">
                         <div className="flex items-center">
                           <div className="w-12 h-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center font-bold text-sm mr-4 group-hover:bg-red-600 group-hover:text-white transition-colors">PDF</div>
                           <div>
                              <div className="font-bold text-neutral-text">Planimetria Catastale</div>
                              <div className="text-xs text-neutral-muted">2.4 MB</div>
                           </div>
                         </div>
                         <Download size={20} className="text-neutral-300 group-hover:text-primary"/>
                       </div>
                       <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white hover:border-primary hover:shadow-md transition-all group cursor-pointer">
                         <div className="flex items-center">
                           <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm mr-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">DWG</div>
                           <div>
                              <div className="font-bold text-neutral-text">Rilievo Tecnico</div>
                              <div className="text-xs text-neutral-muted">12 MB</div>
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

                 {isContestOpen ? (
                   <Button
                     fullWidth
                     size="lg"
                     className="mb-3 text-lg shadow-lg shadow-primary/20 hover:scale-[1.02]"
                     onClick={() => {
                       if (!isLoggedIn()) {
                         if (onLoginRequired) onLoginRequired();
                         return;
                       }
                       setShowProposalModal(true);
                     }}
                   >
                     <Trophy size={20} className="mr-2"/> Partecipa Ora
                   </Button>
                 ) : (
                   <div className="text-center py-3 bg-gray-100 rounded-lg text-neutral-muted font-medium mb-3">
                     Contest {contest.status === 'CLOSED' ? 'Chiuso' : 'In Valutazione'}
                   </div>
                 )}
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
                     {contest.client?.name?.charAt(0) || 'C'}
                   </div>
                   <div>
                     <div className="font-bold text-neutral-text">{contest.client?.name || 'Cliente'}</div>
                     <div className="flex items-center text-xs text-neutral-muted mt-1">
                       <span className="flex text-yellow-400 mr-2">★★★★★</span>
                       <span>Contest completati</span>
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
                       <div className="text-xs text-neutral-muted">Apertura</div>
                       <div className="text-sm font-bold">Contest Aperto</div>
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
                       <div className="text-xs text-neutral-muted">{deadline.toLocaleDateString('it-IT')}</div>
                       <div className="text-sm font-bold">Chiusura & Selezione</div>
                     </div>
                   </div>
                 </div>
               </div>

             </div>
          </div>
        </div>
      </div>

      {/* Proposal Submission Modal */}
      {showProposalModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-display font-bold text-xl">Invia la tua Proposta</h3>
              <button onClick={() => setShowProposalModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {proposalSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="text-green-600" size={32} />
                  </div>
                  <h4 className="font-bold text-lg mb-2">Proposta Inviata!</h4>
                  <p className="text-neutral-muted">La tua proposta è stata inviata con successo.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-bold text-neutral-text mb-2">
                      Descrizione della tua proposta *
                    </label>
                    <textarea
                      rows={6}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-light/30 outline-none resize-none"
                      placeholder="Descrivi il tuo concept, l'approccio progettuale e le soluzioni proposte..."
                      value={proposalDescription}
                      onChange={(e) => setProposalDescription(e.target.value)}
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                    <div className="flex items-center gap-3 text-neutral-muted">
                      <Upload size={20} />
                      <div>
                        <p className="font-medium text-sm">Carica i tuoi file</p>
                        <p className="text-xs">PDF, JPG, DWG (max 50MB) - Coming soon</p>
                      </div>
                    </div>
                  </div>

                  {proposalError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {proposalError}
                    </div>
                  )}

                  <Button
                    fullWidth
                    onClick={handleSubmitProposal}
                    disabled={submittingProposal}
                  >
                    {submittingProposal ? (
                      <><Loader2 size={18} className="mr-2 animate-spin" /> Invio in corso...</>
                    ) : (
                      <>Invia Proposta</>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
