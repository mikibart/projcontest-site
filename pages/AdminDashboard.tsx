import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import {
  Users, Briefcase, FileText, TrendingUp, Shield, Loader2,
  Search, Edit2, Trash2, Eye, CheckCircle, XCircle,
  AlertTriangle, Star, Clock, CreditCard, FileCheck,
  ChevronLeft, ChevronRight, X, Send, Euro, Calendar,
  Filter, RefreshCw, HardDrive, ExternalLink, AlertCircle,
  Settings, Save, Key, ToggleLeft, ToggleRight, Percent
} from 'lucide-react';

interface AdminDashboardProps {
  onLoginClick?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLoginClick }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'contests' | 'practices' | 'payments' | 'proposals' | 'files' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [contests, setContests] = useState<any[]>([]);
  const [practices, setPractices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [filesStats, setFilesStats] = useState<{ orphanCount: number; totalStorage: number }>({ orphanCount: 0, totalStorage: 0 });
  const [user, setUser] = useState<any>(null);

  // Settings state
  const [settingsData, setSettingsData] = useState<Record<string, any>>({});
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [detailModal, setDetailModal] = useState<{ type: string; data: any } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [contestDetail, setContestDetail] = useState<any>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [quoteModal, setQuoteModal] = useState<any>(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteValidDays, setQuoteValidDays] = useState('30');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      if (parsed.role === 'ADMIN') {
        fetchAdminData();
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchTabData();
    }
  }, [activeTab, currentPage, searchTerm, statusFilter]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  const fetchAdminData = async () => {
    try {
      const response = await fetch('/api/admin?action=stats', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Errore nel caricamento');
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTabData = async () => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: '15',
      ...(searchTerm && { search: searchTerm }),
      ...(statusFilter !== 'all' && { status: statusFilter }),
    });

    try {
      let endpoint = '';
      switch (activeTab) {
        case 'users':
          endpoint = `/api/admin?action=users&${params}`;
          break;
        case 'contests':
          endpoint = `/api/admin?action=contests&${params}`;
          break;
        case 'practices':
          endpoint = `/api/admin?action=practices&${params}`;
          break;
        case 'payments':
          endpoint = `/api/admin?action=payments&${params}`;
          break;
        case 'proposals':
          endpoint = `/api/admin?action=proposals&${params}`;
          break;
        case 'files':
          endpoint = `/api/admin?action=files&${params}`;
          break;
        default:
          return;
      }

      const response = await fetch(endpoint, { headers: getAuthHeaders() });
      if (!response.ok) return;
      const data = await response.json();

      switch (activeTab) {
        case 'users':
          setUsers(data.users || []);
          setTotalPages(data.totalPages || 1);
          break;
        case 'contests':
          setContests(data.contests || []);
          setTotalPages(data.totalPages || 1);
          break;
        case 'practices':
          setPractices(data.practices || []);
          setTotalPages(data.totalPages || 1);
          break;
        case 'payments':
          setPayments(data.payments || []);
          setTotalPages(data.totalPages || 1);
          break;
        case 'proposals':
          setProposals(data.proposals || []);
          setTotalPages(data.totalPages || 1);
          break;
        case 'files':
          setFiles(data.files || []);
          setFilesStats({ orphanCount: data.orphanCount || 0, totalStorage: data.totalStorage || 0 });
          setTotalPages(data.totalPages || 1);
          break;
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  // ==================== ACTIONS ====================
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch('/api/admin?action=users', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  const deleteUser = async (userId: string, name: string) => {
    if (!confirm(`Eliminare l'utente "${name}"? Azione irreversibile.`)) return;
    try {
      const response = await fetch('/api/admin?action=users', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId }),
      });
      if (response.ok) setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const toggleFeatured = async (contestId: string, currentFeatured: boolean) => {
    try {
      const response = await fetch('/api/admin?action=contests', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ contestId, isFeatured: !currentFeatured }),
      });
      if (response.ok) {
        setContests(contests.map(c => c.id === contestId ? { ...c, isFeatured: !currentFeatured } : c));
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const updateContestStatus = async (contestId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin?action=contests', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ contestId, status: newStatus }),
      });
      if (response.ok) {
        setContests(contests.map(c => c.id === contestId ? { ...c, status: newStatus } : c));
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const deleteContest = async (contestId: string, title: string) => {
    if (!confirm(`Eliminare il concorso "${title}"?`)) return;
    try {
      const response = await fetch('/api/admin?action=contests', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ contestId }),
      });
      if (response.ok) setContests(contests.filter(c => c.id !== contestId));
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const updatePracticeStatus = async (practiceId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin?action=practices', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ practiceId, status: newStatus }),
      });
      if (response.ok) {
        setPractices(practices.map(p => p.id === practiceId ? { ...p, status: newStatus } : p));
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const sendQuote = async () => {
    if (!quoteModal || !quoteAmount) return;
    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + parseInt(quoteValidDays));

      const response = await fetch('/api/admin?action=practices', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          practiceId: quoteModal.id,
          status: 'QUOTE_SENT',
          quoteAmount: parseFloat(quoteAmount),
          quoteValidUntil: validUntil.toISOString(),
        }),
      });
      if (response.ok) {
        setPractices(practices.map(p => p.id === quoteModal.id ? {
          ...p,
          status: 'QUOTE_SENT',
          quoteAmount: parseFloat(quoteAmount),
        } : p));
        setQuoteModal(null);
        setQuoteAmount('');
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const deletePractice = async (practiceId: string) => {
    if (!confirm('Eliminare questa pratica?')) return;
    try {
      const response = await fetch('/api/admin?action=practices', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ practiceId }),
      });
      if (response.ok) setPractices(practices.filter(p => p.id !== practiceId));
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const updatePaymentStatus = async (paymentId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin?action=payments', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ paymentId, status: newStatus }),
      });
      if (response.ok) {
        setPayments(payments.map(p => p.id === paymentId ? { ...p, status: newStatus } : p));
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const updateProposalStatus = async (proposalId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin?action=proposals', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ proposalId, status: newStatus }),
      });
      if (response.ok) {
        setProposals(proposals.map(p => p.id === proposalId ? { ...p, status: newStatus } : p));
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const deleteProposal = async (proposalId: string) => {
    if (!confirm('Eliminare questa proposta?')) return;
    try {
      const response = await fetch('/api/admin?action=proposals', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ proposalId }),
      });
      if (response.ok) setProposals(proposals.filter(p => p.id !== proposalId));
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const deleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Eliminare il file "${fileName}"? Il file verrà rimosso anche dallo storage.`)) return;
    try {
      const response = await fetch('/api/admin?action=files', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ fileId, deleteFromBlob: true }),
      });
      if (response.ok) {
        setFiles(files.filter(f => f.id !== fileId));
        setFilesStats(prev => ({ ...prev, orphanCount: Math.max(0, prev.orphanCount - 1) }));
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const deleteAllOrphanFiles = async () => {
    if (!confirm(`Eliminare tutti i ${filesStats.orphanCount} file orfani? Questa azione è irreversibile.`)) return;
    try {
      const response = await fetch('/api/admin?action=files', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ deleteAllOrphans: true }),
      });
      if (response.ok) {
        const data = await response.json();
        alert(`Eliminati ${data.deletedCount} file orfani`);
        fetchTabData();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  // ==================== DETAIL FETCH ====================
  const openContestDetail = async (contestId: string) => {
    setDetailModal({ type: 'contest', data: null });
    setDetailLoading(true);
    setContestDetail(null);
    try {
      const response = await fetch(`/api/admin?action=contest-detail&id=${contestId}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setContestDetail(data);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const openUserDetail = async (userId: string) => {
    setDetailModal({ type: 'user', data: null });
    setDetailLoading(true);
    setUserDetail(null);
    try {
      const response = await fetch(`/api/admin?action=user-detail&id=${userId}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setUserDetail(data);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setDetailModal(null);
    setContestDetail(null);
    setUserDetail(null);
  };

  // Not logged in or not admin
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-display font-bold text-neutral-text mb-4">
            Accesso Riservato
          </h1>
          <p className="text-neutral-muted mb-8">
            Questa sezione e riservata agli amministratori del sistema.
          </p>
          {!user ? (
            <Button onClick={onLoginClick}>Accedi come Admin</Button>
          ) : (
            <p className="text-sm text-neutral-muted">
              Sei loggato come <strong>{user.role}</strong>. Contatta un amministratore se hai bisogno di accesso.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={40} className="text-red-500 mx-auto mb-4" />
          <p className="text-neutral-muted">{error}</p>
          <Button onClick={fetchAdminData} className="mt-4">Riprova</Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Panoramica', icon: TrendingUp },
    { id: 'users', label: 'Utenti', icon: Users },
    { id: 'contests', label: 'Concorsi', icon: Briefcase },
    { id: 'practices', label: 'Pratiche', icon: FileCheck },
    { id: 'payments', label: 'Pagamenti', icon: CreditCard },
    { id: 'proposals', label: 'Proposte', icon: FileText },
    { id: 'files', label: 'Files', icon: HardDrive },
    { id: 'settings', label: 'Impostazioni', icon: Settings },
  ];

  // Fetch settings
  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const response = await fetch('/api/settings', { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setSettingsData(data.settings || {});
        // Initialize form with non-sensitive values
        const formValues: Record<string, string> = {};
        Object.keys(data.settings || {}).forEach(key => {
          formValues[key] = data.settings[key].hasValue && !key.includes('SECRET') ? data.settings[key].value : '';
        });
        setSettingsForm(formValues);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Save settings
  const saveSettings = async () => {
    setSettingsSaving(true);
    setSettingsMessage(null);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ settings: settingsForm }),
      });
      const data = await response.json();
      if (response.ok) {
        setSettingsMessage({ type: 'success', text: `Salvate ${data.updated?.length || 0} impostazioni` });
        fetchSettings(); // Refresh to get updated masked values
      } else {
        setSettingsMessage({ type: 'error', text: data.error || 'Errore nel salvataggio' });
      }
    } catch (err) {
      setSettingsMessage({ type: 'error', text: 'Errore di connessione' });
    } finally {
      setSettingsSaving(false);
    }
  };

  // Load settings when tab changes to settings
  useEffect(() => {
    if (activeTab === 'settings' && user?.role === 'ADMIN') {
      fetchSettings();
    }
  }, [activeTab]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-primary" size={28} />
            <h1 className="text-3xl font-display font-bold text-neutral-text">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-neutral-muted">
            Gestisci utenti, concorsi, pratiche e pagamenti della piattaforma.
          </p>
        </header>

        {/* Tabs */}
        <div className="bg-white p-1 rounded-lg border border-gray-200 inline-flex shadow-sm mb-8 flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setCurrentPage(1); setSearchTerm(''); setStatusFilter('all'); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-neutral-muted hover:text-neutral-text hover:bg-gray-100'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Filter Bar */}
        {activeTab !== 'overview' && (
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cerca..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              >
                <option value="all">Tutti gli stati</option>
                {activeTab === 'contests' && (
                  <>
                    <option value="PENDING_APPROVAL">In Attesa</option>
                    <option value="OPEN">Aperto</option>
                    <option value="EVALUATING">In Valutazione</option>
                    <option value="CLOSED">Chiuso</option>
                    <option value="HIDDEN">Nascosto</option>
                  </>
                )}
                {activeTab === 'practices' && (
                  <>
                    <option value="PENDING_QUOTE">In Attesa Preventivo</option>
                    <option value="QUOTE_SENT">Preventivo Inviato</option>
                    <option value="ACCEPTED">Accettato</option>
                    <option value="IN_PROGRESS">In Corso</option>
                    <option value="COMPLETED">Completato</option>
                  </>
                )}
                {activeTab === 'payments' && (
                  <>
                    <option value="PENDING">In Attesa</option>
                    <option value="PROCESSING">In Elaborazione</option>
                    <option value="COMPLETED">Completato</option>
                    <option value="FAILED">Fallito</option>
                  </>
                )}
                {activeTab === 'proposals' && (
                  <>
                    <option value="SUBMITTED">Inviata</option>
                    <option value="UNDER_REVIEW">In Revisione</option>
                    <option value="SELECTED">Selezionata</option>
                    <option value="WINNER">Vincitrice</option>
                    <option value="REJECTED">Rifiutata</option>
                  </>
                )}
                {activeTab === 'files' && (
                  <>
                    <option value="orphan">Solo Orfani</option>
                    <option value="contest">Concorsi</option>
                    <option value="proposal">Proposte</option>
                    <option value="practice">Pratiche</option>
                  </>
                )}
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={fetchTabData}>
              <RefreshCw size={16} />
            </Button>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard icon={<Users size={20} />} iconBg="bg-blue-50" iconColor="text-blue-600" value={stats?.stats?.totalUsers || 0} label="Utenti Totali" />
              <StatCard icon={<Briefcase size={20} />} iconBg="bg-green-50" iconColor="text-green-600" value={stats?.stats?.totalContests || 0} label="Concorsi" />
              <StatCard icon={<FileText size={20} />} iconBg="bg-orange-50" iconColor="text-orange-600" value={stats?.stats?.totalProposals || 0} label="Proposte" />
              <StatCard icon={<FileCheck size={20} />} iconBg="bg-purple-50" iconColor="text-purple-600" value={stats?.stats?.totalPractices || 0} label="Pratiche" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-lg mb-4">Utenti per Ruolo</h3>
                <div className="space-y-3">
                  {Object.entries(stats?.stats?.usersByRole || {}).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between">
                      <span className="text-sm text-neutral-muted">{role}</span>
                      <span className="font-mono font-bold">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-lg mb-4">Concorsi per Stato</h3>
                <div className="space-y-3">
                  {Object.entries(stats?.stats?.contestsByStatus || {}).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm text-neutral-muted">{status}</span>
                      <span className="font-mono font-bold">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100"><h3 className="font-bold">Ultimi Utenti Registrati</h3></div>
                <div className="divide-y divide-gray-100">
                  {(stats?.recentUsers || []).map((u: any) => (
                    <div key={u.id} className="p-4 flex items-center justify-between">
                      <div><p className="font-medium text-sm">{u.name}</p><p className="text-xs text-neutral-muted">{u.email}</p></div>
                      <RoleBadge role={u.role} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100"><h3 className="font-bold">Ultimi Concorsi</h3></div>
                <div className="divide-y divide-gray-100">
                  {(stats?.recentContests || []).map((c: any) => (
                    <div key={c.id} className="p-4 flex items-center justify-between">
                      <div><p className="font-medium text-sm">{c.title}</p><p className="text-xs text-neutral-muted">di {c.client?.name}</p></div>
                      <StatusBadge status={c.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <DataTable
            columns={['Utente', 'Ruolo', 'Concorsi', 'Proposte', 'Data Reg.', 'Azioni']}
            data={users}
            renderRow={(u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div><p className="font-medium text-sm">{u.name}</p><p className="text-xs text-neutral-muted">{u.email}</p></div>
                </td>
                <td className="px-4 py-3">
                  <select value={u.role} onChange={(e) => updateUserRole(u.id, e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1">
                    <option value="CLIENT">CLIENT</option>
                    <option value="ARCHITECT">ARCHITECT</option>
                    <option value="ENGINEER">ENGINEER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-sm">{u._count?.contests || 0}</td>
                <td className="px-4 py-3 text-sm">{u._count?.proposals || 0}</td>
                <td className="px-4 py-3 text-xs text-neutral-muted">{new Date(u.createdAt).toLocaleDateString('it-IT')}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openUserDetail(u.id)}><Eye size={14} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteUser(u.id, u.name)} className="text-red-500 hover:bg-red-50"><Trash2 size={14} /></Button>
                  </div>
                </td>
              </tr>
            )}
          />
        )}

        {/* Contests Tab */}
        {activeTab === 'contests' && (
          <DataTable
            columns={['Concorso', 'Cliente', 'Budget', 'Proposte', 'Stato', 'Featured', 'Azioni']}
            data={contests}
            renderRow={(c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><p className="font-medium text-sm">{c.title}</p><p className="text-xs text-neutral-muted">{c.location}</p></td>
                <td className="px-4 py-3 text-sm">{c.client?.name}</td>
                <td className="px-4 py-3 text-sm font-mono">€{c.budget?.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm">{c.proposalsCount || 0}</td>
                <td className="px-4 py-3">
                  <select value={c.status} onChange={(e) => updateContestStatus(c.id, e.target.value)} className={`text-xs border rounded px-2 py-1 font-medium ${getStatusStyle(c.status)}`}>
                    <option value="PENDING_APPROVAL">In Attesa</option>
                    <option value="OPEN">Approvato</option>
                    <option value="EVALUATING">In Valutazione</option>
                    <option value="CLOSED">Chiuso</option>
                    <option value="HIDDEN">Nascosto</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleFeatured(c.id, c.isFeatured)} className={`p-1 rounded ${c.isFeatured ? 'text-yellow-500' : 'text-gray-300'}`}>
                    <Star size={18} fill={c.isFeatured ? 'currentColor' : 'none'} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openContestDetail(c.id)}><Eye size={14} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteContest(c.id, c.title)} className="text-red-500 hover:bg-red-50"><Trash2 size={14} /></Button>
                  </div>
                </td>
              </tr>
            )}
          />
        )}

        {/* Practices Tab */}
        {activeTab === 'practices' && (
          <DataTable
            columns={['Tipo', 'Richiedente', 'Ubicazione', 'Stato', 'Preventivo', 'Data', 'Azioni']}
            data={practices}
            renderRow={(p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><p className="font-medium text-sm">{p.type}</p><p className="text-xs text-neutral-muted">{p.propertyType}</p></td>
                <td className="px-4 py-3"><p className="text-sm">{p.contactName}</p><p className="text-xs text-neutral-muted">{p.contactEmail}</p></td>
                <td className="px-4 py-3 text-sm">{p.location}</td>
                <td className="px-4 py-3">
                  <select value={p.status} onChange={(e) => updatePracticeStatus(p.id, e.target.value)} className={`text-xs border rounded px-2 py-1 font-medium ${getPracticeStatusStyle(p.status)}`}>
                    <option value="PENDING_QUOTE">In Attesa</option>
                    <option value="QUOTE_SENT">Preventivo Inviato</option>
                    <option value="ACCEPTED">Accettato</option>
                    <option value="IN_PROGRESS">In Corso</option>
                    <option value="COMPLETED">Completato</option>
                    <option value="CANCELLED">Annullato</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-sm font-mono">{p.quoteAmount ? `€${p.quoteAmount.toLocaleString()}` : '-'}</td>
                <td className="px-4 py-3 text-xs text-neutral-muted">{new Date(p.createdAt).toLocaleDateString('it-IT')}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setDetailModal({ type: 'practice', data: p })}><Eye size={14} /></Button>
                    {p.status === 'PENDING_QUOTE' && (
                      <Button variant="ghost" size="sm" onClick={() => setQuoteModal(p)} className="text-green-600 hover:bg-green-50"><Send size={14} /></Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => deletePractice(p.id)} className="text-red-500 hover:bg-red-50"><Trash2 size={14} /></Button>
                  </div>
                </td>
              </tr>
            )}
          />
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <DataTable
            columns={['ID Pagamento', 'Utente', 'Concorso', 'Importo', 'Provider', 'Stato', 'Data', 'Azioni']}
            data={payments}
            renderRow={(p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{p.id.slice(0, 8)}...</td>
                <td className="px-4 py-3"><p className="text-sm">{p.user?.name}</p><p className="text-xs text-neutral-muted">{p.user?.email}</p></td>
                <td className="px-4 py-3 text-sm">{p.contest?.title}</td>
                <td className="px-4 py-3 text-sm font-mono font-bold">€{p.amount?.toLocaleString()}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded ${p.provider === 'STRIPE' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>{p.provider}</span></td>
                <td className="px-4 py-3">
                  <select value={p.status} onChange={(e) => updatePaymentStatus(p.id, e.target.value)} className={`text-xs border rounded px-2 py-1 font-medium ${getPaymentStatusStyle(p.status)}`}>
                    <option value="PENDING">In Attesa</option>
                    <option value="PROCESSING">In Elaborazione</option>
                    <option value="COMPLETED">Completato</option>
                    <option value="FAILED">Fallito</option>
                    <option value="REFUNDED">Rimborsato</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-neutral-muted">{new Date(p.createdAt).toLocaleDateString('it-IT')}</td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="sm" onClick={() => setDetailModal({ type: 'payment', data: p })}><Eye size={14} /></Button>
                </td>
              </tr>
            )}
          />
        )}

        {/* Proposals Tab */}
        {activeTab === 'proposals' && (
          <DataTable
            columns={['Architetto', 'Concorso', 'Stato', 'Files', 'Data Invio', 'Azioni']}
            data={proposals}
            renderRow={(p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><p className="font-medium text-sm">{p.architect?.name}</p><p className="text-xs text-neutral-muted">{p.architect?.email}</p></td>
                <td className="px-4 py-3"><p className="text-sm">{p.contest?.title}</p><p className="text-xs text-neutral-muted">di {p.contest?.client?.name}</p></td>
                <td className="px-4 py-3">
                  <select value={p.status} onChange={(e) => updateProposalStatus(p.id, e.target.value)} className={`text-xs border rounded px-2 py-1 font-medium ${getProposalStatusStyle(p.status)}`}>
                    <option value="SUBMITTED">Inviata</option>
                    <option value="UNDER_REVIEW">In Revisione</option>
                    <option value="SELECTED">Selezionata</option>
                    <option value="WINNER">Vincitrice</option>
                    <option value="REJECTED">Rifiutata</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-sm">{p.files?.length || 0} file</td>
                <td className="px-4 py-3 text-xs text-neutral-muted">{new Date(p.submittedAt).toLocaleDateString('it-IT')}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setDetailModal({ type: 'proposal', data: p })}><Eye size={14} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteProposal(p.id)} className="text-red-500 hover:bg-red-50"><Trash2 size={14} /></Button>
                  </div>
                </td>
              </tr>
            )}
          />
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="space-y-6">
            {/* Files Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><HardDrive size={20} /></div>
                  <div>
                    <p className="text-2xl font-bold">{files.length}</p>
                    <p className="text-sm text-neutral-muted">File Totali</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><AlertCircle size={20} /></div>
                  <div>
                    <p className="text-2xl font-bold">{filesStats.orphanCount}</p>
                    <p className="text-sm text-neutral-muted">File Orfani</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg text-green-600"><HardDrive size={20} /></div>
                  <div>
                    <p className="text-2xl font-bold">{(filesStats.totalStorage / (1024 * 1024)).toFixed(2)} MB</p>
                    <p className="text-sm text-neutral-muted">Storage Usato</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delete All Orphans Button */}
            {filesStats.orphanCount > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-orange-600" size={24} />
                  <div>
                    <p className="font-medium text-orange-800">File Orfani Rilevati</p>
                    <p className="text-sm text-orange-600">Ci sono {filesStats.orphanCount} file non collegati a nessun contenuto.</p>
                  </div>
                </div>
                <Button variant="outline" onClick={deleteAllOrphanFiles} className="border-orange-300 text-orange-700 hover:bg-orange-100">
                  <Trash2 size={16} className="mr-2" /> Elimina Tutti
                </Button>
              </div>
            )}

            {/* Files Table */}
            <DataTable
              columns={['File', 'Tipo', 'Dimensione', 'Associazione', 'Data', 'Azioni']}
              data={files}
              renderRow={(f) => (
                <tr key={f.id} className={`hover:bg-gray-50 ${f.isOrphan ? 'bg-orange-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
                        f.mimeType?.includes('pdf') ? 'bg-red-100 text-red-600' :
                        f.mimeType?.includes('image') ? 'bg-blue-100 text-blue-600' :
                        f.mimeType?.includes('dwg') || f.mimeType?.includes('autocad') ? 'bg-purple-100 text-purple-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {f.mimeType?.includes('pdf') ? 'PDF' :
                         f.mimeType?.includes('image') ? 'IMG' :
                         f.mimeType?.split('/')[1]?.slice(0, 3).toUpperCase() || 'FILE'}
                      </div>
                      <div>
                        <p className="font-medium text-sm truncate max-w-[200px]">{f.originalName}</p>
                        <p className="text-xs text-neutral-muted font-mono">{f.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-muted">{f.mimeType}</td>
                  <td className="px-4 py-3 text-sm font-mono">{(f.size / 1024).toFixed(1)} KB</td>
                  <td className="px-4 py-3">
                    {f.isOrphan ? (
                      <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-800 font-medium">Orfano</span>
                    ) : (
                      <div>
                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                          f.contestId ? 'bg-blue-100 text-blue-800' :
                          f.proposalId ? 'bg-green-100 text-green-800' :
                          f.practiceId ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>{f.association}</span>
                        <p className="text-xs text-neutral-muted mt-1 truncate max-w-[150px]">
                          {f.contest?.title || f.proposal?.contest?.title || f.practice?.type || f.user?.name || ''}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-muted">{new Date(f.createdAt).toLocaleDateString('it-IT')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 rounded-lg text-blue-600">
                        <ExternalLink size={14} />
                      </a>
                      <Button variant="ghost" size="sm" onClick={() => deleteFile(f.id, f.originalName)} className="text-red-500 hover:bg-red-50">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            />
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            {settingsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin" size={32} />
              </div>
            ) : (
              <>
                {/* Settings Message */}
                {settingsMessage && (
                  <div className={`p-4 rounded-lg ${settingsMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                    {settingsMessage.text}
                  </div>
                )}

                {/* Stripe Settings */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-purple-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <CreditCard className="text-purple-600" size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Stripe</h3>
                        <p className="text-sm text-neutral-muted">Pagamenti con carta di credito</p>
                      </div>
                      <div className="ml-auto">
                        <button
                          onClick={() => setSettingsForm(prev => ({ ...prev, STRIPE_ENABLED: prev.STRIPE_ENABLED === 'true' ? 'false' : 'true' }))}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            settingsForm.STRIPE_ENABLED === 'true' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {settingsForm.STRIPE_ENABLED === 'true' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                          {settingsForm.STRIPE_ENABLED === 'true' ? 'Attivo' : 'Disattivo'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-text mb-1">
                        Publishable Key
                        {settingsData.STRIPE_PUBLISHABLE_KEY?.hasValue && <span className="text-green-600 ml-2 text-xs">✓ Configurata</span>}
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="text"
                          value={settingsForm.STRIPE_PUBLISHABLE_KEY || ''}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, STRIPE_PUBLISHABLE_KEY: e.target.value }))}
                          placeholder="pk_live_..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-text mb-1">
                        Secret Key
                        {settingsData.STRIPE_SECRET_KEY?.hasValue && <span className="text-green-600 ml-2 text-xs">✓ Configurata</span>}
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="password"
                          value={settingsForm.STRIPE_SECRET_KEY || ''}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, STRIPE_SECRET_KEY: e.target.value }))}
                          placeholder={settingsData.STRIPE_SECRET_KEY?.hasValue ? '••••••••' : 'sk_live_...'}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none font-mono text-sm"
                        />
                      </div>
                      <p className="text-xs text-neutral-muted mt-1">Lascia vuoto per mantenere il valore esistente</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-text mb-1">
                        Webhook Secret
                        {settingsData.STRIPE_WEBHOOK_SECRET?.hasValue && <span className="text-green-600 ml-2 text-xs">✓ Configurata</span>}
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="password"
                          value={settingsForm.STRIPE_WEBHOOK_SECRET || ''}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, STRIPE_WEBHOOK_SECRET: e.target.value }))}
                          placeholder={settingsData.STRIPE_WEBHOOK_SECRET?.hasValue ? '••••••••' : 'whsec_...'}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-xs text-neutral-muted">
                      <p className="font-medium mb-1">Webhook URL:</p>
                      <code className="bg-white px-2 py-1 rounded border">https://projcontest-site.vercel.app/api/webhooks/stripe</code>
                    </div>
                  </div>
                </div>

                {/* PayPal Settings */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-blue-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <CreditCard className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">PayPal</h3>
                        <p className="text-sm text-neutral-muted">Pagamenti PayPal e Paga in 3 rate</p>
                      </div>
                      <div className="ml-auto flex gap-2">
                        <button
                          onClick={() => setSettingsForm(prev => ({ ...prev, PAYPAL_SANDBOX_MODE: prev.PAYPAL_SANDBOX_MODE === 'true' ? 'false' : 'true' }))}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            settingsForm.PAYPAL_SANDBOX_MODE === 'true' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {settingsForm.PAYPAL_SANDBOX_MODE === 'true' ? 'Sandbox' : 'Live'}
                        </button>
                        <button
                          onClick={() => setSettingsForm(prev => ({ ...prev, PAYPAL_ENABLED: prev.PAYPAL_ENABLED === 'true' ? 'false' : 'true' }))}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            settingsForm.PAYPAL_ENABLED === 'true' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {settingsForm.PAYPAL_ENABLED === 'true' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                          {settingsForm.PAYPAL_ENABLED === 'true' ? 'Attivo' : 'Disattivo'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-text mb-1">
                        Client ID
                        {settingsData.PAYPAL_CLIENT_ID?.hasValue && <span className="text-green-600 ml-2 text-xs">✓ Configurato</span>}
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="text"
                          value={settingsForm.PAYPAL_CLIENT_ID || ''}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, PAYPAL_CLIENT_ID: e.target.value }))}
                          placeholder="AV..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-text mb-1">
                        Client Secret
                        {settingsData.PAYPAL_CLIENT_SECRET?.hasValue && <span className="text-green-600 ml-2 text-xs">✓ Configurato</span>}
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="password"
                          value={settingsForm.PAYPAL_CLIENT_SECRET || ''}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, PAYPAL_CLIENT_SECRET: e.target.value }))}
                          placeholder={settingsData.PAYPAL_CLIENT_SECRET?.hasValue ? '••••••••' : 'EK...'}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none font-mono text-sm"
                        />
                      </div>
                      <p className="text-xs text-neutral-muted mt-1">Lascia vuoto per mantenere il valore esistente</p>
                    </div>
                  </div>
                </div>

                {/* Platform Settings */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-green-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Percent className="text-green-600" size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Piattaforma</h3>
                        <p className="text-sm text-neutral-muted">Commissioni e impostazioni generali</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-text mb-1">
                        Commissione Piattaforma (%)
                      </label>
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={settingsForm.PLATFORM_FEE_PERCENT || '5'}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, PLATFORM_FEE_PERCENT: e.target.value }))}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-400 outline-none"
                        />
                      </div>
                      <p className="text-xs text-neutral-muted mt-1">Percentuale applicata sul budget del concorso come quota di pubblicazione</p>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button onClick={saveSettings} disabled={settingsSaving} className="min-w-[200px]">
                    {settingsSaving ? (
                      <><Loader2 size={18} className="mr-2 animate-spin" /> Salvataggio...</>
                    ) : (
                      <><Save size={18} className="mr-2" /> Salva Impostazioni</>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Pagination */}
        {activeTab !== 'overview' && activeTab !== 'settings' && totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft size={16} /> Precedente
            </Button>
            <span className="text-sm text-neutral-muted">Pagina {currentPage} di {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              Successiva <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </div>

      {/* Contest Detail Modal */}
      {detailModal?.type === 'contest' && (
        <Modal onClose={closeDetailModal} title="Dettagli Concorso" size="xl">
          {detailLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin" size={32} /></div>
          ) : contestDetail ? (
            <div className="space-y-6">
              {/* Contest Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold text-lg mb-2">{contestDetail.title}</h4>
                <p className="text-sm text-neutral-muted mb-2">{contestDetail.location}</p>
                <div className="flex gap-4 text-sm">
                  <span>Budget: <strong>€{contestDetail.budget?.toLocaleString()}</strong></span>
                  <span>Stato: <StatusBadge status={contestDetail.status} /></span>
                </div>
              </div>

              {/* Client */}
              <div>
                <h5 className="font-semibold mb-2 flex items-center gap-2"><Users size={16} /> Cliente</h5>
                <div className="bg-white border rounded-lg p-3">
                  <p className="font-medium">{contestDetail.client?.name}</p>
                  <p className="text-sm text-neutral-muted">{contestDetail.client?.email}</p>
                  {contestDetail.client?.phone && <p className="text-sm text-neutral-muted">{contestDetail.client?.phone}</p>}
                </div>
              </div>

              {/* Proposals */}
              <div>
                <h5 className="font-semibold mb-2 flex items-center gap-2"><FileText size={16} /> Proposte Ricevute ({contestDetail.proposals?.length || 0})</h5>
                {contestDetail.proposals?.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-auto">
                    {contestDetail.proposals.map((p: any) => (
                      <div key={p.id} className="bg-white border rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {p.architect?.avatarUrl && <img src={p.architect.avatarUrl} className="w-10 h-10 rounded-full" />}
                            <div>
                              <p className="font-medium">{p.architect?.name}</p>
                              <p className="text-xs text-neutral-muted">{p.architect?.email}</p>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${getProposalStatusStyle(p.status)}`}>{p.status}</span>
                        </div>
                        {p.description && <p className="text-sm mt-2 text-neutral-muted">{p.description}</p>}
                        {p.files?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {p.files.map((f: any) => (
                              <a key={f.id} href={f.url} target="_blank" className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100">
                                {f.originalName}
                              </a>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-neutral-muted mt-2">Inviata: {new Date(p.submittedAt).toLocaleDateString('it-IT')}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-muted">Nessuna proposta ricevuta</p>
                )}
              </div>

              {/* Contest Files */}
              {contestDetail.files?.length > 0 && (
                <div>
                  <h5 className="font-semibold mb-2 flex items-center gap-2"><FileCheck size={16} /> File del Concorso</h5>
                  <div className="flex flex-wrap gap-2">
                    {contestDetail.files.map((f: any) => (
                      <a key={f.id} href={f.url} target="_blank" className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200">
                        {f.originalName}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Q&A */}
              {contestDetail.qaMessages?.length > 0 && (
                <div>
                  <h5 className="font-semibold mb-2">Domande & Risposte ({contestDetail.qaMessages.length})</h5>
                  <div className="space-y-2 max-h-32 overflow-auto">
                    {contestDetail.qaMessages.map((q: any) => (
                      <div key={q.id} className="bg-white border rounded-lg p-2 text-sm">
                        <p><strong>D:</strong> {q.question}</p>
                        {q.answer && <p className="text-neutral-muted"><strong>R:</strong> {q.answer}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-neutral-muted">Errore nel caricamento</p>
          )}
        </Modal>
      )}

      {/* User Detail Modal */}
      {detailModal?.type === 'user' && (
        <Modal onClose={closeDetailModal} title="Dettagli Utente" size="xl">
          {detailLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin" size={32} /></div>
          ) : userDetail ? (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-4">
                {userDetail.avatarUrl && <img src={userDetail.avatarUrl} className="w-16 h-16 rounded-full" />}
                <div>
                  <h4 className="font-bold text-lg">{userDetail.name}</h4>
                  <p className="text-sm text-neutral-muted">{userDetail.email}</p>
                  <div className="flex gap-2 mt-1">
                    <RoleBadge role={userDetail.role} />
                    {userDetail.phone && <span className="text-xs text-neutral-muted">{userDetail.phone}</span>}
                  </div>
                </div>
              </div>

              {userDetail.bio && (
                <div>
                  <h5 className="font-semibold mb-1">Bio</h5>
                  <p className="text-sm text-neutral-muted">{userDetail.bio}</p>
                </div>
              )}

              {/* User's Contests */}
              {userDetail.contests?.length > 0 && (
                <div>
                  <h5 className="font-semibold mb-2 flex items-center gap-2"><Briefcase size={16} /> Concorsi Creati ({userDetail.contests.length})</h5>
                  <div className="space-y-2 max-h-40 overflow-auto">
                    {userDetail.contests.map((c: any) => (
                      <div key={c.id} className="bg-white border rounded-lg p-2 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{c.title}</p>
                          <p className="text-xs text-neutral-muted">€{c.budget?.toLocaleString()} • {c._count?.proposals || 0} proposte</p>
                        </div>
                        <StatusBadge status={c.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User's Proposals */}
              {userDetail.proposals?.length > 0 && (
                <div>
                  <h5 className="font-semibold mb-2 flex items-center gap-2"><FileText size={16} /> Proposte Inviate ({userDetail.proposals.length})</h5>
                  <div className="space-y-2 max-h-40 overflow-auto">
                    {userDetail.proposals.map((p: any) => (
                      <div key={p.id} className="bg-white border rounded-lg p-2">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-sm">{p.contest?.title}</p>
                          <span className={`text-xs px-2 py-1 rounded ${getProposalStatusStyle(p.status)}`}>{p.status}</span>
                        </div>
                        {p.files?.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {p.files.map((f: any) => (
                              <a key={f.id} href={f.url} target="_blank" className="text-xs text-blue-600 hover:underline">
                                {f.originalName}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User's Practice Requests */}
              {userDetail.practiceRequests?.length > 0 && (
                <div>
                  <h5 className="font-semibold mb-2 flex items-center gap-2"><FileCheck size={16} /> Richieste Pratiche ({userDetail.practiceRequests.length})</h5>
                  <div className="space-y-2 max-h-40 overflow-auto">
                    {userDetail.practiceRequests.map((p: any) => (
                      <div key={p.id} className="bg-white border rounded-lg p-2 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{p.type}</p>
                          <p className="text-xs text-neutral-muted">{p.location}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${getPracticeStatusStyle(p.status)}`}>{p.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User's Files */}
              {userDetail.files?.length > 0 && (
                <div>
                  <h5 className="font-semibold mb-2">File Caricati ({userDetail.files.length})</h5>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-auto">
                    {userDetail.files.map((f: any) => (
                      <a key={f.id} href={f.url} target="_blank" className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200">
                        {f.originalName}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-neutral-muted">Errore nel caricamento</p>
          )}
        </Modal>
      )}

      {/* Practice Detail Modal */}
      {detailModal?.type === 'practice' && (
        <Modal onClose={closeDetailModal} title="Dettagli Pratica">
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold">{detailModal.data.type}</h4>
                  <p className="text-sm text-neutral-muted">{detailModal.data.propertyType}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${getPracticeStatusStyle(detailModal.data.status)}`}>{detailModal.data.status}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-neutral-muted">Richiedente:</span> <strong>{detailModal.data.contactName}</strong></div>
              <div><span className="text-neutral-muted">Email:</span> <strong>{detailModal.data.contactEmail}</strong></div>
              <div><span className="text-neutral-muted">Ubicazione:</span> <strong>{detailModal.data.location}</strong></div>
              {detailModal.data.size && <div><span className="text-neutral-muted">Superficie:</span> <strong>{detailModal.data.size} mq</strong></div>}
              {detailModal.data.contactPhone && <div><span className="text-neutral-muted">Telefono:</span> <strong>{detailModal.data.contactPhone}</strong></div>}
              {detailModal.data.quoteAmount && <div><span className="text-neutral-muted">Preventivo:</span> <strong>€{detailModal.data.quoteAmount.toLocaleString()}</strong></div>}
            </div>
            {detailModal.data.interventionDetails && (
              <div>
                <h5 className="font-semibold mb-1">Dettagli Intervento</h5>
                <p className="text-sm text-neutral-muted bg-white border rounded p-2">{detailModal.data.interventionDetails}</p>
              </div>
            )}
            <div className="flex gap-4 text-sm">
              <span className={detailModal.data.isVincolato ? 'text-orange-600' : 'text-neutral-muted'}>
                {detailModal.data.isVincolato ? '⚠️ Immobile Vincolato' : 'Non Vincolato'}
              </span>
              <span className={detailModal.data.hasOldPermits ? 'text-blue-600' : 'text-neutral-muted'}>
                {detailModal.data.hasOldPermits ? '📄 Ha Permessi Precedenti' : 'Senza Permessi Precedenti'}
              </span>
            </div>
            {detailModal.data.files?.length > 0 && (
              <div>
                <h5 className="font-semibold mb-2">File Allegati</h5>
                <div className="flex flex-wrap gap-2">
                  {detailModal.data.files.map((f: any) => (
                    <a key={f.id} href={f.url} target="_blank" className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100">
                      {f.originalName}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Proposal Detail Modal */}
      {detailModal?.type === 'proposal' && (
        <Modal onClose={closeDetailModal} title="Dettagli Proposta">
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                {detailModal.data.architect?.avatarUrl && <img src={detailModal.data.architect.avatarUrl} className="w-12 h-12 rounded-full" />}
                <div>
                  <h4 className="font-bold">{detailModal.data.architect?.name}</h4>
                  <p className="text-sm text-neutral-muted">{detailModal.data.architect?.email}</p>
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-semibold mb-1">Concorso</h5>
              <p className="text-sm">{detailModal.data.contest?.title}</p>
              <p className="text-xs text-neutral-muted">Cliente: {detailModal.data.contest?.client?.name}</p>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-muted">Stato:</span>
              <span className={`text-xs px-2 py-1 rounded ${getProposalStatusStyle(detailModal.data.status)}`}>{detailModal.data.status}</span>
            </div>
            {detailModal.data.description && (
              <div>
                <h5 className="font-semibold mb-1">Descrizione</h5>
                <p className="text-sm text-neutral-muted bg-white border rounded p-2">{detailModal.data.description}</p>
              </div>
            )}
            {detailModal.data.feedback && (
              <div>
                <h5 className="font-semibold mb-1">Feedback</h5>
                <p className="text-sm text-neutral-muted bg-yellow-50 border border-yellow-200 rounded p-2">{detailModal.data.feedback}</p>
              </div>
            )}
            {detailModal.data.files?.length > 0 && (
              <div>
                <h5 className="font-semibold mb-2">Elaborati ({detailModal.data.files.length})</h5>
                <div className="space-y-2">
                  {detailModal.data.files.map((f: any) => (
                    <a key={f.id} href={f.url} target="_blank" className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded hover:bg-blue-100">
                      <FileText size={16} />
                      {f.originalName}
                      <span className="text-xs text-blue-500 ml-auto">{(f.size / 1024).toFixed(0)} KB</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-neutral-muted">Inviata il {new Date(detailModal.data.submittedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </Modal>
      )}

      {/* Payment Detail Modal */}
      {detailModal?.type === 'payment' && (
        <Modal onClose={closeDetailModal} title="Dettagli Pagamento">
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold font-mono">€{detailModal.data.amount?.toLocaleString()}</p>
              <span className={`text-xs px-2 py-1 rounded ${getPaymentStatusStyle(detailModal.data.status)}`}>{detailModal.data.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-neutral-muted">ID:</span> <strong className="font-mono text-xs">{detailModal.data.id}</strong></div>
              <div><span className="text-neutral-muted">Provider:</span> <strong>{detailModal.data.provider}</strong></div>
              <div><span className="text-neutral-muted">Utente:</span> <strong>{detailModal.data.user?.name}</strong></div>
              <div><span className="text-neutral-muted">Email:</span> <strong>{detailModal.data.user?.email}</strong></div>
            </div>
            <div>
              <h5 className="font-semibold mb-1">Concorso</h5>
              <p className="text-sm">{detailModal.data.contest?.title}</p>
            </div>
            <div className="text-xs text-neutral-muted">
              <p>Creato: {new Date(detailModal.data.createdAt).toLocaleDateString('it-IT')}</p>
              {detailModal.data.paidAt && <p>Pagato: {new Date(detailModal.data.paidAt).toLocaleDateString('it-IT')}</p>}
            </div>
          </div>
        </Modal>
      )}

      {/* Quote Modal */}
      {quoteModal && (
        <Modal onClose={() => setQuoteModal(null)} title="Invia Preventivo">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-neutral-muted mb-2">Pratica: <strong>{quoteModal.type}</strong></p>
              <p className="text-sm text-neutral-muted">Richiedente: <strong>{quoteModal.contactName}</strong></p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Importo Preventivo (€)</label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Validità (giorni)</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  value={quoteValidDays}
                  onChange={(e) => setQuoteValidDays(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setQuoteModal(null)} className="flex-1">Annulla</Button>
              <Button onClick={sendQuote} disabled={!quoteAmount} className="flex-1">
                <Send size={16} className="mr-2" /> Invia Preventivo
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ==================== HELPER COMPONENTS ====================
const StatCard: React.FC<{ icon: React.ReactNode; iconBg: string; iconColor: string; value: string | number; label: string }> = ({ icon, iconBg, iconColor, value, label }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 ${iconBg} rounded-lg ${iconColor}`}>{icon}</div>
    </div>
    <div className="text-2xl font-bold font-mono">{value}</div>
    <div className="text-sm text-neutral-muted">{label}</div>
  </div>
);

const DataTable: React.FC<{ columns: string[]; data: any[]; renderRow: (item: any) => React.ReactNode }> = ({ columns, data, renderRow }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 text-left text-xs text-neutral-muted uppercase">
          <tr>{columns.map((col) => <th key={col} className="px-4 py-3">{col}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.length > 0 ? data.map(renderRow) : (
            <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-neutral-muted">Nessun dato trovato</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const Modal: React.FC<{ onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ onClose, title, children, size = 'md' }) => {
  const sizeClasses = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size]} mx-4 max-h-[90vh] overflow-auto`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const styles: Record<string, string> = { CLIENT: 'bg-blue-100 text-blue-800', ARCHITECT: 'bg-green-100 text-green-800', ENGINEER: 'bg-orange-100 text-orange-800', ADMIN: 'bg-red-100 text-red-800' };
  return <span className={`px-2 py-1 rounded text-xs font-medium ${styles[role] || styles.CLIENT}`}>{role}</span>;
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = { DRAFT: 'bg-gray-100 text-gray-800', OPEN: 'bg-green-100 text-green-800', EVALUATING: 'bg-yellow-100 text-yellow-800', CLOSED: 'bg-blue-100 text-blue-800' };
  return <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || styles.DRAFT}`}>{status}</span>;
};

const getStatusStyle = (status: string) => {
  const styles: Record<string, string> = {
    PENDING_APPROVAL: 'border-orange-300 bg-orange-50 text-orange-800',
    OPEN: 'border-green-300 bg-green-50 text-green-800',
    HIDDEN: 'border-red-300 bg-red-50 text-red-800',
    CLOSED: 'border-blue-300 bg-blue-50 text-blue-800',
    EVALUATING: 'border-yellow-300 bg-yellow-50 text-yellow-800',
  };
  return styles[status] || 'border-gray-200';
};

const getPracticeStatusStyle = (status: string) => {
  const styles: Record<string, string> = {
    PENDING_QUOTE: 'border-orange-300 bg-orange-50 text-orange-800',
    QUOTE_SENT: 'border-blue-300 bg-blue-50 text-blue-800',
    ACCEPTED: 'border-green-300 bg-green-50 text-green-800',
    IN_PROGRESS: 'border-yellow-300 bg-yellow-50 text-yellow-800',
    COMPLETED: 'border-green-300 bg-green-50 text-green-800',
    CANCELLED: 'border-red-300 bg-red-50 text-red-800',
  };
  return styles[status] || 'border-gray-200';
};

const getPaymentStatusStyle = (status: string) => {
  const styles: Record<string, string> = {
    PENDING: 'border-orange-300 bg-orange-50 text-orange-800',
    PROCESSING: 'border-blue-300 bg-blue-50 text-blue-800',
    COMPLETED: 'border-green-300 bg-green-50 text-green-800',
    FAILED: 'border-red-300 bg-red-50 text-red-800',
    REFUNDED: 'border-purple-300 bg-purple-50 text-purple-800',
  };
  return styles[status] || 'border-gray-200';
};

const getProposalStatusStyle = (status: string) => {
  const styles: Record<string, string> = {
    SUBMITTED: 'border-blue-300 bg-blue-50 text-blue-800',
    UNDER_REVIEW: 'border-yellow-300 bg-yellow-50 text-yellow-800',
    SELECTED: 'border-purple-300 bg-purple-50 text-purple-800',
    WINNER: 'border-green-300 bg-green-50 text-green-800',
    REJECTED: 'border-red-300 bg-red-50 text-red-800',
  };
  return styles[status] || 'border-gray-200';
};
