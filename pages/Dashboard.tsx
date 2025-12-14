import React, { useState } from 'react';
import { MOCK_CONTESTS } from '../constants';
import { Button } from '../components/Button';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Trophy, Clock, TrendingUp, Sparkles, FileText, Download, 
  HardHat, Activity, AlertTriangle, CheckCircle2, Calendar, 
  ChevronRight, Calculator, Siren, Zap
} from 'lucide-react';

const data = [
  { name: 'Gen', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'Mag', value: 500 },
  { name: 'Giu', value: 900 },
];

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'contests' | 'technical'>('contests');

  // KPI Cards Component based on active tab
  const renderStats = () => {
    if (activeTab === 'contests') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
               <div className="p-2 bg-blue-50 rounded-lg text-primary"><TrendingUp size={20}/></div>
               <span className="text-xs font-bold text-functional-success bg-green-50 px-2 py-1 rounded">+12%</span>
            </div>
            <div className="text-2xl font-bold font-mono">€4.500</div>
            <div className="text-sm text-neutral-muted">Guadagni totali</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
               <div className="p-2 bg-orange-50 rounded-lg text-secondary"><Trophy size={20}/></div>
            </div>
            <div className="text-2xl font-bold font-mono">3</div>
            <div className="text-sm text-neutral-muted">Concorsi vinti</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
               <div className="p-2 bg-gray-50 rounded-lg text-gray-600"><Clock size={20}/></div>
            </div>
            <div className="text-2xl font-bold font-mono">12</div>
            <div className="text-sm text-neutral-muted">Proposte inviate</div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-red-500">
            <div className="flex justify-between items-start mb-4">
               <div className="p-2 bg-red-50 rounded-lg text-red-600"><HardHat size={20}/></div>
               <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded animate-pulse">In Corso</span>
            </div>
            <div className="text-2xl font-bold font-mono">2</div>
            <div className="text-sm text-neutral-muted">Cantieri Attivi</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
               <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600"><Activity size={20}/></div>
            </div>
            <div className="text-2xl font-bold font-mono">3</div>
            <div className="text-sm text-neutral-muted">Calcoli in elaborazione</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
               <div className="p-2 bg-green-50 rounded-lg text-green-600"><FileText size={20}/></div>
            </div>
            <div className="text-2xl font-bold font-mono">5</div>
            <div className="text-sm text-neutral-muted">Pratiche Autorizzate</div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-neutral-text">
              {activeTab === 'contests' ? 'Design Dashboard' : 'Control Room Tecnica'}
            </h1>
            <p className="text-neutral-muted">
              {activeTab === 'contests' 
                ? 'Gestisci i tuoi concorsi e le tue proposte creative.' 
                : 'Monitoraggio integrato: Ingegneria, Burocrazia e Sicurezza.'}
            </p>
          </div>
          
          <div className="bg-white p-1 rounded-lg border border-gray-200 flex shadow-sm">
            <button 
              onClick={() => setActiveTab('contests')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'contests' ? 'bg-primary text-white shadow-sm' : 'text-neutral-muted hover:text-neutral-text'}`}
            >
              Concorsi
            </button>
            <button 
              onClick={() => setActiveTab('technical')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'technical' ? 'bg-primary text-white shadow-sm' : 'text-neutral-muted hover:text-neutral-text'}`}
            >
              Area Tecnica & Cantieri
            </button>
          </div>
        </header>

        {/* Dynamic Stats Row */}
        <div className="animate-fade-in mb-8">
          {renderStats()}
        </div>

        {activeTab === 'contests' ? (
          <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* AI Suggestions */}
                <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2A4D7A] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                   <div className="relative z-10">
                     <div className="flex items-center gap-2 mb-4">
                       <Sparkles className="text-yellow-400" />
                       <h3 className="font-bold text-lg">AI Match: Consigliati per te</h3>
                     </div>
                     <p className="text-blue-100 mb-6 text-sm max-w-md">Basato sul tuo portfolio "Minimalista" e le tue vittorie recenti in Interior Design.</p>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {MOCK_CONTESTS.slice(0, 2).map(c => (
                         <div key={c.id} className="bg-white/10 backdrop-blur border border-white/20 p-4 rounded-xl hover:bg-white/20 transition-colors cursor-pointer">
                            <div className="flex justify-between mb-2">
                               <span className="text-xs bg-white/20 px-2 py-1 rounded text-white font-mono">Match 94%</span>
                               <span className="text-xs font-bold">€{c.budget}</span>
                            </div>
                            <h4 className="font-bold text-sm truncate">{c.title}</h4>
                         </div>
                       ))}
                     </div>
                   </div>
                   {/* Decor */}
                   <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                </div>

                {/* Active Proposals */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                   <div className="p-6 border-b border-gray-100">
                     <h3 className="font-bold text-lg">Le tue proposte attive</h3>
                   </div>
                   <div className="divide-y divide-gray-100">
                     {[1,2].map((item) => (
                       <div key={item} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                               <img src={`https://picsum.photos/100/100?random=${item+10}`} alt="" className="w-full h-full object-cover"/>
                             </div>
                             <div>
                                <h4 className="font-medium text-neutral-text">Ristrutturazione Via Roma</h4>
                                <p className="text-xs text-neutral-muted">Inviata 2 giorni fa</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">In valutazione</span>
                             <Button variant="ghost" size="sm">Dettagli</Button>
                          </div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>

              {/* Sidebar Chart */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-lg mb-6">Andamento Vittorie</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4A90A4" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#4A90A4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#1E3A5F" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-neutral-muted">Hai superato il 78% dei progettisti questo mese.</p>
                </div>
              </div>
          </div>
        ) : (
          <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: ACTIVE SITES & SERVICES (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Construction Site Monitor */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <HardHat className="text-orange-500" size={20}/>
                    Cantieri Attivi
                  </h3>
                  <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-md text-neutral-muted">2 Progetti</span>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Site 1 */}
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-primary/30 transition-colors">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                       <div>
                         <div className="flex items-center gap-2">
                           <h4 className="font-bold text-neutral-text">Ristrutturazione Via Roma, 45</h4>
                           <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase">In Regola</span>
                         </div>
                         <p className="text-sm text-neutral-muted">Scadenza prevista: 15 Mag 2024</p>
                       </div>
                       <div className="flex gap-2">
                         <Button variant="outline" size="sm" className="text-xs h-8">Giornale Lavori</Button>
                         <Button variant="primary" size="sm" className="text-xs h-8">Ispezione</Button>
                       </div>
                    </div>
                    
                    {/* Site Indicators */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <div className="text-xs text-neutral-muted mb-1 flex justify-center items-center gap-1"><FileText size={10}/> SCIA</div>
                        <div className="text-xs font-bold text-green-600">Depositata</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center">
                         <div className="text-xs text-neutral-muted mb-1 flex justify-center items-center gap-1"><Activity size={10}/> Strutture</div>
                         <div className="text-xs font-bold text-green-600">Collaudato</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center">
                         <div className="text-xs text-neutral-muted mb-1 flex justify-center items-center gap-1"><Siren size={10}/> PSC Sicurezza</div>
                         <div className="text-xs font-bold text-orange-600">Aggiornare</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center">
                         <div className="text-xs text-neutral-muted mb-1 flex justify-center items-center gap-1"><Zap size={10}/> Impianti</div>
                         <div className="text-xs font-bold text-blue-600">In posa</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Services Timeline/List */}
              <h3 className="font-bold text-lg text-neutral-text pt-4">Pratiche in Elaborazione</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 
                 {/* Engineering Card */}
                 <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-all">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Activity size={18} className="text-red-500"/>
                        <span className="font-bold text-sm">Calcoli Strutturali</span>
                      </div>
                      <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full font-medium">In corso</span>
                    </div>
                    <p className="text-sm font-medium mb-1">Ampliamento Villa G.</p>
                    <p className="text-xs text-neutral-muted mb-4">Attesa dati geologo</p>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mb-4">
                      <div className="bg-red-500 h-1.5 rounded-full" style={{width: '60%'}}></div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-neutral-muted">
                      <span>Consegna: 3gg</span>
                      <button className="text-primary hover:underline font-medium">Dettagli</button>
                    </div>
                 </div>

                 {/* Admin Card */}
                 <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-all">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <FileText size={18} className="text-blue-500"/>
                        <span className="font-bold text-sm">CILA Manutenzione</span>
                      </div>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">Bozza</span>
                    </div>
                    <p className="text-sm font-medium mb-1">Appartamento Centro</p>
                    <p className="text-xs text-neutral-muted mb-4">Manca data inizio lavori</p>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mb-4">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{width: '90%'}}></div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-neutral-muted">
                      <span>Consegna: Oggi</span>
                      <button className="text-primary hover:underline font-medium">Completa</button>
                    </div>
                 </div>
              </div>
            </div>

            {/* RIGHT COLUMN: ALERTS & ACTIONS (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Alert Box */}
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2 text-orange-800 font-bold">
                  <AlertTriangle size={18}/>
                  <span>Scadenze Imminenti</span>
                </div>
                <ul className="space-y-3">
                  <li className="bg-white p-3 rounded-lg text-sm border border-orange-100 flex justify-between items-center shadow-sm">
                    <span>Notifica Preliminare ASL</span>
                    <span className="text-xs text-red-500 font-bold">Oggi</span>
                  </li>
                  <li className="bg-white p-3 rounded-lg text-sm border border-orange-100 flex justify-between items-center shadow-sm">
                    <span>Integrazione Genio Civile</span>
                    <span className="text-xs text-orange-500 font-bold">Domani</span>
                  </li>
                </ul>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                 <h3 className="font-bold text-lg mb-4">Azioni Rapide</h3>
                 <div className="space-y-3">
                    <Button variant="outline" fullWidth className="justify-start h-auto py-3 text-sm">
                      <div className="bg-blue-50 p-2 rounded mr-3 text-blue-600"><FileText size={16}/></div>
                      Nuova Pratica
                    </Button>
                    <Button variant="outline" fullWidth className="justify-start h-auto py-3 text-sm">
                      <div className="bg-red-50 p-2 rounded mr-3 text-red-600"><Calculator size={16}/></div>
                      Nuovo Calcolo
                    </Button>
                    <Button variant="outline" fullWidth className="justify-start h-auto py-3 text-sm">
                      <div className="bg-purple-50 p-2 rounded mr-3 text-purple-600"><Download size={16}/></div>
                      Archivio Documenti
                    </Button>
                 </div>
              </div>

              {/* Calendar Widget (Static Mock) */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Calendario</h3>
                  <Calendar size={18} className="text-neutral-muted"/>
                </div>
                <div className="space-y-4">
                   <div className="flex gap-3 items-center">
                     <div className="w-10 h-10 rounded-lg bg-gray-100 flex flex-col items-center justify-center shrink-0">
                       <span className="text-[10px] text-neutral-muted uppercase">Gen</span>
                       <span className="font-bold text-sm">24</span>
                     </div>
                     <div>
                       <div className="text-sm font-bold">Sopralluogo Cantiere</div>
                       <div className="text-xs text-neutral-muted">Ore 10:00 - Via Roma</div>
                     </div>
                   </div>
                   <div className="flex gap-3 items-center">
                     <div className="w-10 h-10 rounded-lg bg-gray-100 flex flex-col items-center justify-center shrink-0">
                       <span className="text-[10px] text-neutral-muted uppercase">Gen</span>
                       <span className="font-bold text-sm">28</span>
                     </div>
                     <div>
                       <div className="text-sm font-bold">Consegna Esecutivi</div>
                       <div className="text-xs text-neutral-muted">Entro le 18:00</div>
                     </div>
                   </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};