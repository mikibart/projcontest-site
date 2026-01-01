import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import {
  Plus, Edit2, Trash2, Eye, Loader2, Image as ImageIcon,
  MapPin, Calendar, Tag, Star, X, Upload, ExternalLink
} from 'lucide-react';

interface PortfolioProject {
  id: string;
  title: string;
  description?: string;
  category: string;
  location?: string;
  year?: number;
  imageUrl?: string;
  images: string[];
  tags: string[];
  featured: boolean;
  contest?: { id: string; title: string; budget: number };
  user: { id: string; name: string; avatarUrl?: string };
  createdAt: string;
}

interface PortfolioProps {
  userId?: string; // If provided, view someone else's portfolio
  editable?: boolean;
}

export const Portfolio: React.FC<PortfolioProps> = ({ userId, editable = false }) => {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const targetUserId = userId || currentUser.id;
  const canEdit = editable && currentUser.id === targetUserId;

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  useEffect(() => {
    fetchPortfolio();
  }, [targetUserId]);

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/portfolio?userId=${targetUserId}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to fetch portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Eliminare questo progetto dal portfolio?')) return;

    try {
      const response = await fetch('/api/portfolio', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ projectId }),
      });
      if (response.ok) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const categories = [
    { value: 'RESIDENTIAL', label: 'Residenziale' },
    { value: 'COMMERCIAL', label: 'Commerciale' },
    { value: 'INTERIOR', label: 'Interior Design' },
    { value: 'URBAN', label: 'Urbanistica' },
    { value: 'CONCEPT', label: 'Concept' },
    { value: 'OFFICE', label: 'Uffici' },
    { value: 'EXTERIOR', label: 'Esterno' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-neutral-text">Portfolio</h1>
            <p className="text-neutral-muted">
              {canEdit ? 'I tuoi progetti di architettura' : `Progetti di ${projects[0]?.user?.name || 'Architetto'}`}
            </p>
          </div>
          {canEdit && (
            <Button onClick={() => { setEditingProject(null); setShowForm(true); }}>
              <Plus size={18} className="mr-2" /> Aggiungi Progetto
            </Button>
          )}
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon size={48} className="mx-auto mb-4 text-neutral-muted opacity-50" />
            <p className="text-neutral-muted">
              {canEdit ? 'Nessun progetto nel portfolio. Inizia ad aggiungere i tuoi lavori!' : 'Nessun progetto nel portfolio.'}
            </p>
            {canEdit && (
              <Button className="mt-4" onClick={() => setShowForm(true)}>
                <Plus size={18} className="mr-2" /> Aggiungi il primo progetto
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-gray-100">
                  {project.imageUrl ? (
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon size={40} className="text-gray-300" />
                    </div>
                  )}
                  {project.featured && (
                    <div className="absolute top-3 left-3 bg-yellow-500 text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
                      <Star size={12} fill="currentColor" /> In evidenza
                    </div>
                  )}
                  {project.contest && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded">
                      Concorso vinto
                    </div>
                  )}
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="p-3 bg-white rounded-full hover:bg-gray-100"
                    >
                      <Eye size={20} />
                    </button>
                    {canEdit && (
                      <>
                        <button
                          onClick={() => { setEditingProject(project); setShowForm(true); }}
                          className="p-3 bg-white rounded-full hover:bg-gray-100"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="p-3 bg-white rounded-full hover:bg-gray-100 text-red-500"
                        >
                          <Trash2 size={20} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 line-clamp-1">{project.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-neutral-muted mb-3">
                    <span className="bg-gray-100 px-2 py-0.5 rounded">
                      {categories.find(c => c.value === project.category)?.label || project.category}
                    </span>
                    {project.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {project.location}
                      </span>
                    )}
                    {project.year && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {project.year}
                      </span>
                    )}
                  </div>
                  {project.description && (
                    <p className="text-sm text-neutral-muted line-clamp-2">{project.description}</p>
                  )}
                  {project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {project.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                      {project.tags.length > 3 && (
                        <span className="text-xs text-neutral-muted">+{project.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showForm && (
          <ProjectFormModal
            project={editingProject}
            categories={categories}
            onClose={() => { setShowForm(false); setEditingProject(null); }}
            onSave={(project) => {
              if (editingProject) {
                setProjects(prev => prev.map(p => p.id === project.id ? project : p));
              } else {
                setProjects(prev => [project, ...prev]);
              }
              setShowForm(false);
              setEditingProject(null);
            }}
          />
        )}

        {/* Project Detail Modal */}
        {selectedProject && (
          <ProjectDetailModal
            project={selectedProject}
            categories={categories}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </div>
    </div>
  );
};

// Project Form Modal
const ProjectFormModal: React.FC<{
  project: PortfolioProject | null;
  categories: { value: string; label: string }[];
  onClose: () => void;
  onSave: (project: PortfolioProject) => void;
}> = ({ project, categories, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    category: project?.category || 'RESIDENTIAL',
    location: project?.location || '',
    year: project?.year?.toString() || new Date().getFullYear().toString(),
    imageUrl: project?.imageUrl || '',
    tags: project?.tags?.join(', ') || '',
    featured: project?.featured || false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError('Il titolo è obbligatorio');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const body = {
        ...(project ? { projectId: project.id } : {}),
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        location: formData.location.trim() || null,
        year: formData.year ? parseInt(formData.year) : null,
        imageUrl: formData.imageUrl.trim() || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        featured: formData.featured,
      };

      const response = await fetch('/api/portfolio', {
        method: project ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const savedProject = await response.json();
        onSave(savedProject);
      } else {
        const data = await response.json();
        setError(data.error || 'Errore nel salvataggio');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-lg">
            {project ? 'Modifica Progetto' : 'Nuovo Progetto'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Titolo *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descrizione</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Categoria</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Anno</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Località</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="es. Milano, Italia"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">URL Immagine</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="https://..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tag (separati da virgola)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="villa, moderno, sostenibile"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="featured"
              checked={formData.featured}
              onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
              className="w-4 h-4"
            />
            <label htmlFor="featured" className="text-sm">In evidenza</label>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Annulla
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
              {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              {project ? 'Salva modifiche' : 'Crea progetto'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Project Detail Modal
const ProjectDetailModal: React.FC<{
  project: PortfolioProject;
  categories: { value: string; label: string }[];
  onClose: () => void;
}> = ({ project, categories, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-auto">
        {/* Image */}
        <div className="relative aspect-video bg-gray-100">
          {project.imageUrl ? (
            <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <ImageIcon size={60} className="text-gray-300" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white rounded-full shadow hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold">{project.title}</h2>
              <div className="flex items-center gap-3 mt-2 text-sm text-neutral-muted">
                <span className="bg-gray-100 px-2 py-0.5 rounded">
                  {categories.find(c => c.value === project.category)?.label || project.category}
                </span>
                {project.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> {project.location}
                  </span>
                )}
                {project.year && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} /> {project.year}
                  </span>
                )}
              </div>
            </div>
            {project.featured && (
              <div className="bg-yellow-500 text-white text-sm font-medium px-3 py-1 rounded flex items-center gap-1">
                <Star size={14} fill="currentColor" /> In evidenza
              </div>
            )}
          </div>

          {project.description && (
            <p className="text-neutral-muted mb-6">{project.description}</p>
          )}

          {project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {project.tags.map((tag, idx) => (
                <span key={idx} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  <Tag size={12} /> {tag}
                </span>
              ))}
            </div>
          )}

          {project.contest && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-800 font-medium mb-1">Concorso vinto</p>
              <p className="font-bold">{project.contest.title}</p>
              <p className="text-sm text-green-700">Budget: €{project.contest.budget.toLocaleString()}</p>
            </div>
          )}

          {/* Author */}
          <div className="flex items-center gap-3 mt-6 pt-6 border-t">
            {project.user.avatarUrl ? (
              <img src={project.user.avatarUrl} className="w-10 h-10 rounded-full" alt="" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <ImageIcon size={20} className="text-gray-500" />
              </div>
            )}
            <div>
              <p className="font-medium">{project.user.name}</p>
              <p className="text-sm text-neutral-muted">Architetto</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
