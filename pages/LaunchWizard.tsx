import React, { useState, useRef } from 'react';
import { Button } from '../components/Button';
import { ArrowLeft, ArrowRight, Wand2, UploadCloud, Check, Home, Store, Building, Palette, Trees, Lightbulb, Loader2, X, FileText, Image, CheckCircle, PartyPopper, Clock, Eye } from 'lucide-react';
import { apiFetch, isLoggedIn, getValidAccessToken } from '../utils/api';

interface UploadedFile {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
}

interface WizardProps {
  onComplete: () => void;
  onCancel: () => void;
  onLoginRequired?: () => void;
}

export const LaunchWizard: React.FC<WizardProps> = ({ onComplete, onCancel, onLoginRequired }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [publishedContest, setPublishedContest] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    category: '',
    styles: [] as string[],
    title: '',
    description: '',
    location: '',
    budget: '',
    deadline: ''
  });

  const totalSteps = 6;
  const progress = publishedContest ? 100 : (step / totalSteps) * 100;

  const handleNext = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const categoryMap: Record<string, string> = {
    'residential': 'RESIDENTIAL',
    'commercial': 'COMMERCIAL',
    'office': 'COMMERCIAL',
    'interior': 'INTERIOR',
    'landscape': 'URBAN',
    'concept': 'CONCEPT',
  };

  const handleSubmit = async () => {
    // Check if user is logged in
    if (!isLoggedIn()) {
      if (onLoginRequired) {
        onLoginRequired();
      } else {
        setError('Devi effettuare il login per pubblicare un concorso');
      }
      return;
    }

    // Validate required fields
    if (!formData.title || !formData.description || !formData.budget || !formData.deadline) {
      setError('Compila tutti i campi obbligatori');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const contestData = {
      title: formData.title,
      description: formData.description,
      brief: formData.description,
      location: formData.location || 'Italia',
      category: categoryMap[formData.category] || 'RESIDENTIAL',
      budget: parseFloat(formData.budget),
      deadline: new Date(formData.deadline).toISOString(),
      mustHaves: formData.styles.length > 0 ? [`Stile: ${formData.styles.join(', ')}`] : [],
      constraints: [],
      deliverables: ['Planimetria Arredata', 'Render 3D', 'Moodboard'],
      fileIds: uploadedFiles.map(f => f.id),
    };

    const { data, error: apiError } = await apiFetch<any>('/contests', {
      method: 'POST',
      body: JSON.stringify(contestData),
    });

    setIsSubmitting(false);

    if (apiError) {
      setError(apiError);
      return;
    }

    // Show success page
    setPublishedContest(data);
  };

  const toggleStyle = (styleId: string) => {
    setFormData(prev => {
      const exists = prev.styles.includes(styleId);
      return {
        ...prev,
        styles: exists
          ? prev.styles.filter(s => s !== styleId)
          : [...prev.styles, styleId]
      };
    });
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (!isLoggedIn()) {
      if (onLoginRequired) {
        onLoginRequired();
      } else {
        setError('Devi effettuare il login per caricare file');
      }
      return;
    }

    setIsUploading(true);
    setError(null);

    // Get a valid token (refresh if expired)
    const token = await getValidAccessToken();
    if (!token) {
      setError('Sessione scaduta. Effettua nuovamente il login.');
      setIsUploading(false);
      if (onLoginRequired) {
        onLoginRequired();
      }
      return;
    }

    for (const file of Array.from(files)) {
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError(`Il file ${file.name} supera i 50MB`);
        continue;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/dwg', 'application/acad', 'application/x-dwg', 'image/vnd.dwg'];
      const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.dwg'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        setError(`Tipo file non supportato: ${file.name}. Usa PDF, JPG, PNG o DWG.`);
        continue;
      }

      try {
        const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': file.type || 'application/octet-stream',
          },
          body: file,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Errore durante il caricamento');
        }

        setUploadedFiles(prev => [...prev, data.file]);
      } catch (err: any) {
        setError(err.message || 'Errore durante il caricamento del file');
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image size={20} className="text-blue-600" />;
    if (mimeType === 'application/pdf') return <FileText size={20} className="text-red-600" />;
    return <FileText size={20} className="text-gray-600" />;
  };

  const renderStep1 = () => (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-display font-bold mb-2 text-neutral-text">Di cosa hai bisogno?</h2>
      <p className="text-neutral-muted mb-6">Scegli la categoria che meglio descrive il tuo progetto.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { id: 'residential', icon: <Home size={28}/>, label: 'Residenziale', desc: 'Case, Appartamenti' },
          { id: 'commercial', icon: <Store size={28}/>, label: 'Commerciale', desc: 'Negozi, Ristoranti' },
          { id: 'office', icon: <Building size={28}/>, label: 'Uffici', desc: 'Workspace, Coworking' },
          { id: 'interior', icon: <Palette size={28}/>, label: 'Interior', desc: 'Singole stanze, Arredo' },
          { id: 'landscape', icon: <Trees size={28}/>, label: 'Esterno', desc: 'Giardini, Terrazzi' },
          { id: 'concept', icon: <Lightbulb size={28}/>, label: 'Concept', desc: 'Idee preliminari' },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setFormData({...formData, category: cat.id})}
            className={`
              flex flex-col items-start text-left p-5 rounded-xl border-2 transition-all duration-200 group
              ${formData.category === cat.id 
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                : 'border-gray-100 hover:border-primary-light/50 hover:shadow-md bg-white'}
            `}
          >
            <div className={`mb-3 p-2 rounded-lg ${formData.category === cat.id ? 'bg-primary text-white' : 'bg-gray-100 text-neutral-muted group-hover:bg-primary/10 group-hover:text-primary'}`}>
              {cat.icon}
            </div>
            <span className={`font-bold text-lg ${formData.category === cat.id ? 'text-primary' : 'text-neutral-text'}`}>{cat.label}</span>
            <span className="text-xs text-neutral-muted mt-1">{cat.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // NEW STEP: Style Selector
  const renderStep2 = () => (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-display font-bold mb-2 text-neutral-text">Qual è il tuo stile?</h2>
      <p className="text-neutral-muted mb-6">Seleziona fino a 3 stili che ti ispirano. Questo aiuterà i designer.</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { id: 'modern', label: 'Moderno', img: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=300&q=80' },
          { id: 'scandinavian', label: 'Nordico', img: 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=300&q=80' },
          { id: 'industrial', label: 'Industriale', img: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=300&q=80' },
          { id: 'classic', label: 'Classico', img: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=300&q=80' },
          { id: 'minimal', label: 'Minimal', img: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=300&q=80' },
          { id: 'boho', label: 'Boho Chic', img: 'https://images.unsplash.com/photo-1522444195799-478538b28823?auto=format&fit=crop&w=300&q=80' },
          { id: 'luxury', label: 'Luxury', img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=300&q=80' },
          { id: 'rustic', label: 'Rustico', img: 'https://images.unsplash.com/photo-1484154218962-a1c002085d2f?auto=format&fit=crop&w=300&q=80' },
        ].map(style => {
          const isSelected = formData.styles.includes(style.id);
          return (
            <div 
              key={style.id}
              onClick={() => toggleStyle(style.id)}
              className={`relative group cursor-pointer rounded-xl overflow-hidden aspect-square transition-all duration-200 ${isSelected ? 'ring-4 ring-primary ring-offset-2' : 'hover:opacity-90'}`}
            >
              <img src={style.img} alt={style.label} className="w-full h-full object-cover" />
              <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <div className="text-center">
                  {isSelected && <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white mx-auto mb-2"><Check size={16}/></div>}
                  <span className="text-white font-bold tracking-wide">{style.label}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-display font-bold text-neutral-text">I dettagli contano</h2>
          <p className="text-neutral-muted">Descrivi le tue necessità pratiche.</p>
        </div>
        <Button variant="accent" size="sm" className="hidden md:flex items-center gap-2" onClick={() => alert("Simulazione: L'AI sta generando un brief basato sulle tue parole chiave...")}>
          <Wand2 size={16} /> Genera con AI
        </Button>
      </div>
      
      <div>
        <label className="block text-sm font-bold text-neutral-text mb-2">Titolo del progetto *</label>
        <input 
          type="text" 
          className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-light/30 focus:border-primary-light outline-none transition-all"
          placeholder="Es. Ristrutturazione appartamento centro storico"
          value={formData.title}
          onChange={e => setFormData({...formData, title: e.target.value})}
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-neutral-text mb-2">Descrizione Dettagliata *</label>
        <div className="relative">
          <textarea 
            rows={6}
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-light/30 focus:border-primary-light outline-none transition-all resize-none"
            placeholder="Descrivi il progetto: Chi ci abiterà? Quali problemi vuoi risolvere? Quali materiali ti piacciono?"
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
          />
        </div>
        <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
          {['Open Space', 'Cucina a isola', 'Cabina armadio', 'Smart Home', 'Sostenibile'].map(tag => (
            <span key={tag} className="px-3 py-1 bg-gray-100 text-neutral-muted text-xs rounded-full whitespace-nowrap cursor-pointer hover:bg-gray-200" onClick={() => setFormData({...formData, description: formData.description + (formData.description ? ' ' : '') + tag + ','})}>
              + {tag}
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-neutral-text mb-2">Dove si trova?</label>
        <input 
          type="text" 
          className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-light/30 focus:border-primary-light outline-none"
          placeholder="📍 Città, Quartiere"
          value={formData.location}
          onChange={e => setFormData({...formData, location: e.target.value})}
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="animate-fade-in text-center py-4">
      <h2 className="text-2xl font-display font-bold mb-2 text-neutral-text">Planimetrie e Foto</h2>
      <p className="text-neutral-muted mb-8">Senza una pianta quotata, gli architetti non possono lavorare con precisione.</p>

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e.target.files)}
        accept=".pdf,.jpg,.jpeg,.png,.webp,.dwg"
        multiple
        className="hidden"
      />

      <div
        className={`border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer group bg-white ${
          isUploading ? 'border-primary bg-primary/5' : 'border-gray-300 hover:bg-gray-50 hover:border-primary'
        }`}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleFileUpload(e.dataTransfer.files);
        }}
      >
        <div className={`w-20 h-20 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4 transition-all shadow-sm ${
          isUploading ? 'animate-pulse' : 'group-hover:scale-110 group-hover:bg-primary group-hover:text-white'
        }`}>
          {isUploading ? <Loader2 size={36} className="animate-spin" /> : <UploadCloud size={36} />}
        </div>
        <p className="text-xl font-bold text-neutral-text mb-2">
          {isUploading ? 'Caricamento in corso...' : 'Carica i tuoi file qui'}
        </p>
        <p className="text-sm text-neutral-muted mb-6">DWG, PDF, JPG, PNG (Max 50MB per file)</p>
        {!isUploading && (
          <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
            Scegli file dal computer
          </Button>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-8 text-left max-w-md mx-auto">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-muted mb-3">
            File caricati ({uploadedFiles.length}):
          </h4>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="w-10 h-10 bg-gray-50 rounded flex items-center justify-center mr-3 border border-gray-100 shrink-0">
                    {getFileIcon(file.mimeType)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-text truncate">{file.filename}</p>
                    <p className="text-xs text-neutral-muted">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <Check size={18} className="text-functional-success" />
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadedFiles.length === 0 && !isUploading && (
        <p className="mt-6 text-sm text-neutral-muted">
          Trascina i file qui o clicca per selezionarli
        </p>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="animate-fade-in space-y-8">
      <h2 className="text-2xl font-display font-bold text-neutral-text">Budget e Scadenze</h2>
      
      <div className="bg-gradient-to-br from-primary/5 to-transparent p-6 rounded-xl border border-primary/10">
        <label className="block text-sm font-bold text-neutral-text mb-2">Quanto vuoi premiare il vincitore? (€) *</label>
        <div className="relative mb-2">
          <input 
            type="number" 
            className="w-full p-4 pl-8 text-2xl font-mono font-bold rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-light/30 focus:border-primary-light outline-none text-primary"
            placeholder="1500"
            value={formData.budget}
            onChange={e => setFormData({...formData, budget: e.target.value})}
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">€</span>
        </div>
        <p className="text-sm text-neutral-muted">
          Un budget più alto attira in media il <span className="font-bold text-functional-success">+40% di proposte</span>.
        </p>
      </div>

      <div>
        <label className="block text-sm font-bold text-neutral-text mb-2">Durata del concorso</label>
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[7, 14, 21].map(days => {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + days);
            const dateStr = targetDate.toISOString().split('T')[0];
            const isSelected = formData.deadline === dateStr;
            return (
              <button
                key={days}
                type="button"
                onClick={() => setFormData({...formData, deadline: dateStr})}
                className={`py-2 border rounded-lg transition-colors text-sm font-medium ${
                  isSelected
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-200 hover:border-primary hover:text-primary'
                }`}
              >
                {days} Giorni
              </button>
            );
          })}
        </div>
        <input
          type="date"
          className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-light/30 outline-none"
          value={formData.deadline}
          onChange={e => setFormData({...formData, deadline: e.target.value})}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>
    </div>
  );

  const categoryLabels: Record<string, string> = {
    'residential': 'Residenziale',
    'commercial': 'Commerciale',
    'office': 'Uffici',
    'interior': 'Interior Design',
    'landscape': 'Esterno',
    'concept': 'Concept',
  };

  const formatDeadline = (dateStr: string) => {
    if (!dateStr) return 'Non specificata';
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const renderStep6 = () => (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-display font-bold mb-6 text-neutral-text">Riepilogo Finale</h2>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg mb-8 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>

        <div className="flex justify-between pb-4 border-b border-gray-100">
          <span className="text-neutral-muted">Progetto</span>
          <span className="font-medium text-right">{formData.title || 'Nuovo Progetto'}</span>
        </div>

        <div className="flex justify-between pb-4 border-b border-gray-100">
          <span className="text-neutral-muted">Categoria</span>
          <span className="font-medium text-right">{categoryLabels[formData.category] || 'Non specificata'}</span>
        </div>

        {formData.styles.length > 0 && (
          <div className="flex justify-between pb-4 border-b border-gray-100">
            <span className="text-neutral-muted">Stile</span>
            <div className="flex gap-1 justify-end flex-wrap">
              {formData.styles.map(s => <span key={s} className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">{s}</span>)}
            </div>
          </div>
        )}

        {formData.location && (
          <div className="flex justify-between pb-4 border-b border-gray-100">
            <span className="text-neutral-muted">Località</span>
            <span className="font-medium text-right">{formData.location}</span>
          </div>
        )}

        <div className="flex justify-between pb-4 border-b border-gray-100">
          <span className="text-neutral-muted">Scadenza</span>
          <span className="font-medium text-right">{formatDeadline(formData.deadline)}</span>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="pb-4 border-b border-gray-100">
            <span className="text-neutral-muted block mb-2">File allegati ({uploadedFiles.length})</span>
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map(file => (
                <span key={file.id} className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                  {file.mimeType.startsWith('image/') ? <Image size={12} /> : <FileText size={12} />}
                  {file.filename.length > 20 ? file.filename.substring(0, 17) + '...' : file.filename}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between pb-4 border-b border-gray-100">
          <span className="text-neutral-muted">Premio Vincitore</span>
          <span className="font-bold text-right font-mono text-lg text-functional-success">€{Number(formData.budget).toLocaleString()}</span>
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="font-bold text-neutral-text text-lg">Totale (IVA incl.)</span>
          <span className="text-2xl font-bold text-primary">€{(Number(formData.budget) * 1.22).toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3 mb-6">
        <CheckCircle size={20} className="text-primary mt-0.5 shrink-0"/>
        <p className="text-sm text-neutral-text">
          <span className="font-bold">Garanzia Soddisfatti o Rimborsati.</span> Se non ricevi almeno 3 proposte conformi, ti restituiamo l'intero importo del premio.
        </p>
      </div>
    </div>
  );

  const renderSuccessPage = () => (
    <div className="animate-fade-in text-center py-8">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <PartyPopper size={48} className="text-green-600" />
      </div>

      <h2 className="text-3xl font-display font-bold mb-4 text-neutral-text">
        Concorso Pubblicato!
      </h2>

      <p className="text-lg text-neutral-muted mb-8 max-w-md mx-auto">
        Il tuo concorso "<span className="font-semibold text-neutral-text">{formData.title}</span>" è stato inviato con successo.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-3">
          <Clock size={24} className="text-blue-600" />
          <h3 className="font-bold text-blue-800">Un ultimo passo</h3>
        </div>
        <p className="text-sm text-blue-700 text-left">
          Per attivare il concorso, vai alla Dashboard e completa il pagamento della quota di pubblicazione (<strong>5% del budget</strong>).
          Puoi pagare con carta di credito o PayPal (anche a rate).
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 mb-8 max-w-md mx-auto">
        <h4 className="font-bold text-neutral-text mb-4">Cosa succede ora?</h4>
        <div className="space-y-3 text-left">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</div>
            <p className="text-sm text-neutral-muted">Vai alla Dashboard e clicca "Paga e pubblica"</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</div>
            <p className="text-sm text-neutral-muted">Completa il pagamento con Stripe o PayPal</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</div>
            <p className="text-sm text-neutral-muted">Il concorso viene attivato e gli architetti possono partecipare</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={onComplete} className="min-w-[180px]">
          <Eye size={18} className="mr-2" />
          Vai alla Dashboard
        </Button>
        <Button variant="secondary" onClick={onCancel} className="min-w-[180px]">
          Torna alla Home
        </Button>
      </div>
    </div>
  );

  // Show success page if contest was published
  if (publishedContest) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <div className="flex justify-between text-sm font-medium text-neutral-muted mb-2">
            <span>Completato!</span>
            <span className="text-green-600 font-bold">100%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-500 to-green-400 w-full" />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 md:p-10 shadow-xl border border-gray-100">
          {renderSuccessPage()}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Stepper Header */}
      <div className="mb-8">
        <div className="flex justify-between text-sm font-medium text-neutral-muted mb-2">
          <span>Step {step} di {totalSteps}</span>
          <span className="text-primary font-bold">{Math.round(progress)}% Completato</span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(30,58,95,0.3)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 md:p-10 shadow-xl border border-gray-100 min-h-[500px] flex flex-col justify-between">
        <div>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
          {step === 6 && renderStep6()}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-between mt-12 pt-6 border-t border-gray-100">
          <Button
            variant="ghost"
            onClick={step === 1 ? onCancel : handleBack}
            className="text-neutral-muted hover:text-neutral-text"
            disabled={isSubmitting}
          >
            {step === 1 ? 'Annulla' : 'Indietro'}
          </Button>

          <Button
            onClick={step === totalSteps ? handleSubmit : handleNext}
            className="min-w-[140px] shadow-lg shadow-primary/20"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <><Loader2 size={18} className="mr-2 animate-spin" /> Pubblicazione...</>
            ) : step === totalSteps ? 'Pubblica Ora' : (
              <>Continua <ArrowRight size={18} className="ml-2" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};