import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { apiFetch, getUser, isLoggedIn } from '../utils/api';
import { User, Camera, Save, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

interface ProfileProps {
  onBack: () => void;
  onLoginRequired: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ onBack, onLoginRequired }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    portfolio: '',
    avatarUrl: '',
  });

  const user = getUser();

  useEffect(() => {
    if (!isLoggedIn()) {
      onLoginRequired();
      return;
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const { data, error } = await apiFetch<any>('/user/profile');
    if (error) {
      setError(error);
    } else if (data) {
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        bio: data.bio || '',
        portfolio: data.portfolio || '',
        avatarUrl: data.avatarUrl || '',
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const { data, error } = await apiFetch<any>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name: formData.name,
        phone: formData.phone,
        bio: formData.bio,
        portfolio: formData.portfolio,
        avatarUrl: formData.avatarUrl,
      }),
    });

    setSaving(false);

    if (error) {
      setError(error);
      return;
    }

    // Update local storage
    if (data) {
      const currentUser = getUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    }

    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    'CLIENT': 'Cliente',
    'ARCHITECT': 'Architetto',
    'ENGINEER': 'Ingegnere',
    'ADMIN': 'Amministratore',
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <button
          onClick={onBack}
          className="flex items-center text-neutral-muted hover:text-neutral-text mb-6 transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" />
          Torna indietro
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary-dark p-8 text-white text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto overflow-hidden">
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-white/70" />
                )}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-secondary rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                <Camera size={14} className="text-white" />
              </button>
            </div>
            <h1 className="mt-4 text-xl font-bold">{formData.name || 'Il tuo profilo'}</h1>
            <p className="text-white/70 text-sm">{roleLabels[user?.role] || user?.role}</p>
          </div>

          {/* Form */}
          <div className="p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                <AlertCircle size={20} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
                <CheckCircle size={20} />
                <span className="text-sm">Profilo aggiornato con successo!</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-neutral-text mb-2">Nome completo</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-light/30 focus:border-primary-light outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-text mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full p-3 rounded-lg border border-gray-200 bg-gray-50 text-neutral-muted"
              />
              <p className="text-xs text-neutral-muted mt-1">L'email non può essere modificata</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-text mb-2">Telefono</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+39 XXX XXX XXXX"
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-light/30 focus:border-primary-light outline-none"
              />
            </div>

            {(user?.role === 'ARCHITECT' || user?.role === 'ENGINEER') && (
              <>
                <div>
                  <label className="block text-sm font-bold text-neutral-text mb-2">Bio / Descrizione</label>
                  <textarea
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Descrivi la tua esperienza e specializzazioni..."
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-light/30 focus:border-primary-light outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-neutral-text mb-2">Portfolio URL</label>
                  <input
                    type="url"
                    value={formData.portfolio}
                    onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                    placeholder="https://portfolio.example.com"
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-light/30 focus:border-primary-light outline-none"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-bold text-neutral-text mb-2">Avatar URL</label>
              <input
                type="url"
                value={formData.avatarUrl}
                onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-light/30 focus:border-primary-light outline-none"
              />
            </div>

            <div className="pt-4">
              <Button fullWidth onClick={handleSave} disabled={saving}>
                {saving ? (
                  <><Loader2 size={18} className="mr-2 animate-spin" /> Salvataggio...</>
                ) : (
                  <><Save size={18} className="mr-2" /> Salva modifiche</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
