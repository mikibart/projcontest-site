import React, { useState } from 'react';
import { Button } from '../components/Button';
import { PracticeType } from '../types';
import { 
  ArrowLeft, ArrowRight, Check, UploadCloud, 
  FileText, HardHat, Scale, Ruler, Zap, Scroll, MapPin, 
  FileSearch, Siren, Construction, Landmark, AlertTriangle,
  Activity, Droplets, ShieldAlert, Calculator, BookOpen
} from 'lucide-react';

interface PracticeWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const PracticeWizard: React.FC<PracticeWizardProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  // State for Category Selection in Step 1
  const [activeCategory, setActiveCategory] = useState<'admin' | 'structure' | 'systems' | 'special'>('admin');

  const [formData, setFormData] = useState({
    type: '' as PracticeType | '',
    propertyType: '',
    size: '',
    location: '',
    isVincolato: null as boolean | null,
    hasOldPermits: null as boolean | null,
    interventionDetails: '',
    contactName: '',
    contactEmail: ''
  });

  const handleNext = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  // STEP 1: CATEGORIZED SELECTION
  const renderStep1 = () => {
    const categories = [
      { id: 'admin', label: 'Burocrazia & Permessi' },
      { id: 'structure', label: 'Strutture & Collaudi' },
      { id: 'systems', label: 'Impianti & Energia' },
      { id: 'special', label: 'Specialistiche & Cantiere' },
    ];

    const options = {
      admin: [
        { id: PracticeType.ACCESSO_ATTI, icon: <FileSearch/>, label: 'Accesso agli Atti', sub: 'Verifica preliminare legittimità' },
        { id: PracticeType.CILA, icon: <FileText/>, label: 'CILA', sub: 'Manutenzione straordinaria leggera' },
        { id: PracticeType.SCIA, icon: <HardHat/>, label: 'SCIA', sub: 'Interventi strutturali e ristrutturazioni' },
        { id: PracticeType.PDC, icon: <Scroll/>, label: 'Permesso Costruire', sub: 'Nuove costruzioni o ampliamenti' },
        { id: PracticeType.SANATORIA, icon: <Scale/>, label: 'Sanatoria', sub: 'Regolarizzazione abusi e difformità' },
        { id: PracticeType.CATASTO, icon: <Ruler/>, label: 'Catasto', sub: 'DOCFA, Planimetrie, Volture' },
      ],
      structure: [
        { id: PracticeType.CALCOLI_STRUTTURALI, icon: <Activity/>, label: 'Calcoli Strutturali', sub: 'Cemento armato, acciaio, legno' },
        { id: PracticeType.SISMICA, icon: <Activity/>, label: 'Pratica Sismica', sub: 'Deposito al Genio Civile' },
        { id: PracticeType.COLLAUDO, icon: <Check/>, label: 'Collaudo Statico', sub: 'Certificazione finale opere' },
      ],
      systems: [
        { id: PracticeType.IMPIANTI_ELETTRICI, icon: <Zap/>, label: 'Elettrico & Domotica', sub: 'Progettazione impianti elettrici' },
        { id: PracticeType.IMPIANTI_TERMICI, icon: <Droplets/>, label: 'Termico & Idraulico', sub: 'Riscaldamento, ACS, Clima' },
        { id: PracticeType.RINNOVABILI, icon: <Zap/>, label: 'Rinnovabili', sub: 'Fotovoltaico, Solare termico' },
        { id: PracticeType.APE, icon: <FileText/>, label: 'APE', sub: 'Certificazione Energetica' },
      ],
      special: [
        { id: PracticeType.SICUREZZA, icon: <Siren/>, label: 'Sicurezza (PSC/CSE)', sub: 'Obbligatoria con più imprese' },
        { id: PracticeType.DIREZIONE_LAVORI, icon: <Construction/>, label: 'Direzione Lavori', sub: 'Supervisione tecnica cantiere' },
        { id: PracticeType.COMPUTO, icon: <Calculator/>, label: 'Computo Metrico', sub: 'Contabilità e preventivazione' },
        { id: PracticeType.ANTINCENDIO, icon: <ShieldAlert/>, label: 'Antincendio (CPI)', sub: 'Pratiche Vigili del Fuoco' },
        { id: PracticeType.ACUSTICA, icon: <BookOpen/>, label: 'Acustica', sub: 'Valutazione impatto acustico' },
      ]
    };

    return (
      <div className="animate-fade-in">
        <h2 className="text-2xl font-display font-bold mb-2 text-neutral-text">Di quale servizio tecnico hai bisogno?</h2>
        <p className="text-neutral-muted mb-6">Scegli la categoria per vedere i servizi specifici.</p>
        
        {/* Category Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                activeCategory === cat.id 
                ? 'bg-primary text-white shadow-md' 
                : 'bg-gray-100 text-neutral-muted hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {options[activeCategory].map((item: any) => (
            <button
              key={item.id}
              onClick={() => setFormData({...formData, type: item.id})}
              className={`
                flex items-center p-4 rounded-xl border-2 transition-all duration-200 text-left
                ${formData.type === item.id 
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                  : 'border-gray-100 hover:border-primary-light/50 bg-white'}
              `}
            >
              <div className={`p-2.5 rounded-lg mr-4 shrink-0 ${formData.type === item.id ? 'bg-primary text-white' : 'bg-gray-100 text-neutral-muted'}`}>
                {item.icon}
              </div>
              <div>
                <div className={`font-bold text-sm ${formData.type === item.id ? 'text-primary' : 'text-neutral-text'}`}>{item.label}</div>
                <div className="text-xs text-neutral-muted">{item.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderStep2 = () => (
    <div className="animate-fade-in space-y-6">
      <h2 className="text-2xl font-display font-bold text-neutral-text">L'Oggetto dell'Intervento</h2>
      <p className="text-neutral-muted">Dettagli sull'immobile o sull'area.</p>

      <div>
        <label className="block text-sm font-bold text-neutral-text mb-3">Tipologia</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Residenziale', 'Commerciale', 'Industriale', 'Terreno'].map(type => (
            <button
              key={type}
              onClick={() => setFormData({...formData, propertyType: type})}
              className={`py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${formData.propertyType === type ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 hover:border-primary/50 text-neutral-text'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-neutral-text mb-2">Dimensioni (mq/mc)</label>
          <input 
            type="number" 
            placeholder="Es. 120"
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-light/30 outline-none"
            value={formData.size}
            onChange={e => setFormData({...formData, size: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-neutral-text mb-2">Localizzazione</label>
          <div className="relative">
            <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input 
              type="text" 
              placeholder="Comune o Indirizzo"
              className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-light/30 outline-none"
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-display font-bold text-neutral-text mb-2">Contesto Normativo</h2>
        <p className="text-neutral-muted">Fondamentale per la fattibilità tecnica ed economica.</p>
      </div>

      <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
        <div className="flex items-start gap-3 mb-4">
          <Landmark className="text-orange-600 mt-1" size={24}/>
          <div>
            <h4 className="font-bold text-neutral-text">Vincoli Esistenti</h4>
            <p className="text-sm text-neutral-muted">L'area è soggetta a vincoli Paesaggistici, Idrogeologici o Soprintendenza?</p>
          </div>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => setFormData({...formData, isVincolato: true})}
             className={`flex-1 py-3 rounded-lg font-medium border transition-colors ${formData.isVincolato === true ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-neutral-text border-gray-200'}`}
           >
             Sì / Probabile
           </button>
           <button 
             onClick={() => setFormData({...formData, isVincolato: false})}
             className={`flex-1 py-3 rounded-lg font-medium border transition-colors ${formData.isVincolato === false ? 'bg-neutral-text text-white border-neutral-text' : 'bg-white text-neutral-text border-gray-200'}`}
           >
             No
           </button>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
        <div className="flex items-start gap-3 mb-4">
          <FileSearch className="text-blue-600 mt-1" size={24}/>
          <div>
            <h4 className="font-bold text-neutral-text">Stato Documentale</h4>
            <p className="text-sm text-neutral-muted">Per progetti strutturali o impianti, hai gli architettonici dwg?</p>
          </div>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => setFormData({...formData, hasOldPermits: true})}
             className={`flex-1 py-3 rounded-lg font-medium border transition-colors ${formData.hasOldPermits === true ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-neutral-text border-gray-200'}`}
           >
             Sì, ho i file
           </button>
           <button 
             onClick={() => setFormData({...formData, hasOldPermits: false})}
             className={`flex-1 py-3 rounded-lg font-medium border transition-colors ${formData.hasOldPermits === false ? 'bg-neutral-text text-white border-neutral-text' : 'bg-white text-neutral-text border-gray-200'}`}
           >
             No / Solo cartaceo
           </button>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="animate-fade-in space-y-6">
      <h2 className="text-2xl font-display font-bold text-neutral-text">Dettagli Tecnici</h2>
      
      <div>
        <label className="block text-sm font-bold text-neutral-text mb-2">Descrizione Richiesta *</label>
        <textarea 
          rows={5}
          className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-light/30 outline-none resize-none"
          placeholder="Es. Richiedo calcoli strutturali per apertura vano porta su muro portante..."
          value={formData.interventionDetails}
          onChange={e => setFormData({...formData, interventionDetails: e.target.value})}
        />
      </div>

      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 border-dashed">
        <div className="flex items-center gap-3 mb-4 text-neutral-muted font-bold">
          <UploadCloud size={20}/>
          Documentazione (Opzionale)
        </div>
        <p className="text-sm text-neutral-muted mb-4">Carica piante, sezioni, foto o relazioni precedenti.</p>
        <Button variant="secondary" size="sm" className="bg-white">Seleziona File</Button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="animate-fade-in space-y-6">
      <h2 className="text-2xl font-display font-bold text-neutral-text">I tuoi contatti</h2>
      <p className="text-neutral-muted">A chi intestare il preventivo?</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-neutral-text mb-2">Nome o Ragione Sociale</label>
          <input 
            type="text" 
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-light/30 outline-none"
            value={formData.contactName}
            onChange={e => setFormData({...formData, contactName: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-neutral-text mb-2">Email</label>
          <input 
            type="email" 
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-light/30 outline-none"
            value={formData.contactEmail}
            onChange={e => setFormData({...formData, contactEmail: e.target.value})}
          />
        </div>
      </div>

      <div className="flex items-start gap-3 mt-8 p-4 bg-gray-50 rounded-lg">
        <Check className="text-functional-success shrink-0 mt-0.5" size={18}/>
        <p className="text-xs text-neutral-muted">
          Richiedendo un preventivo tecnico accetti che i tuoi dati vengano trattati per la formulazione dell'offerta professionale.
        </p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <div className="flex justify-between text-sm font-medium text-neutral-muted mb-2">
          <span>Richiesta Servizio Tecnico</span>
          <span className="text-primary font-bold">Step {step}/{totalSteps}</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-secondary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 min-h-[550px] flex flex-col justify-between">
        <div>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
        </div>

        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <Button variant="ghost" onClick={step === 1 ? onCancel : handleBack}>
            {step === 1 ? 'Annulla' : 'Indietro'}
          </Button>
          <Button onClick={step === totalSteps ? onComplete : handleNext}>
            {step === totalSteps ? 'Invia Richiesta' : 'Continua'}
          </Button>
        </div>
      </div>
    </div>
  );
};