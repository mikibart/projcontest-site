import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import {
  Users, Briefcase, FileText, TrendingUp, Shield, Loader2,
  Search, Edit2, Trash2, Eye, CheckCircle, XCircle,
  AlertTriangle, Star, Clock, CreditCard, FileCheck,
  ChevronLeft, ChevronRight, X, Send, Euro, Calendar,
  Filter, RefreshCw
} from 'lucide-react';

interface AdminDashboardProps {
  onLoginClick?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLoginClick }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'contests' | 'practices' | 'payments' | 'proposals'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [contests, setContests] = useState<any[]>([]);
  const [practices, setPractices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [detailModal, setDetailModal] = useState<{ type: string; data: any } | null>(null);
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
  ];

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
                    <Button variant="ghost" size="sm" onClick={() => setDetailModal({ type: 'user', data: u })}><Eye size={14} /></Button>
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
                    <Button variant="ghost" size="sm" onClick={() => setDetailModal({ type: 'contest', data: c })}><Eye size={14} /></Button>
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

        {/* Pagination */}
        {activeTab !== 'overview' && totalPages > 1 && (
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

      {/* Detail Modal */}
      {detailModal && (
        <Modal onClose={() => setDetailModal(null)} title={`Dettagli ${detailModal.type}`}>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-xs max-h-96">
            {JSON.stringify(detailModal.data, null, 2)}
          </pre>
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

const Modal: React.FC<{ onClose: () => void; title: string; children: React.ReactNode }> = ({ onClose, title, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/50" onClick={onClose} />
    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-auto">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-bold text-lg">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  </div>
);

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
