import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import {
  Users, Briefcase, FileText, TrendingUp, Shield, Loader2,
  Search, ChevronDown, Edit2, Trash2, Eye, CheckCircle, XCircle,
  AlertTriangle, Star, Clock
} from 'lucide-react';

interface AdminDashboardProps {
  onLoginClick?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLoginClick }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'contests'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [contests, setContests] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

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

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const [statsRes, usersRes, contestsRes] = await Promise.all([
        fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/admin/contests', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (!statsRes.ok || !usersRes.ok || !contestsRes.ok) {
        throw new Error('Errore nel caricamento dei dati admin');
      }

      const [statsData, usersData, contestsData] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
        contestsRes.json(),
      ]);

      setStats(statsData);
      setUsers(usersData.users || []);
      setContests(contestsData.contests || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  const toggleFeatured = async (contestId: string, currentFeatured: boolean) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/contests', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contestId, isFeatured: !currentFeatured }),
      });

      if (response.ok) {
        setContests(contests.map(c => c.id === contestId ? { ...c, isFeatured: !currentFeatured } : c));
      }
    } catch (err) {
      console.error('Error updating contest:', err);
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
            Gestisci utenti, concorsi e contenuti della piattaforma.
          </p>
        </header>

        {/* Tabs */}
        <div className="bg-white p-1 rounded-lg border border-gray-200 inline-flex shadow-sm mb-8">
          {[
            { id: 'overview', label: 'Panoramica', icon: TrendingUp },
            { id: 'users', label: 'Utenti', icon: Users },
            { id: 'contests', label: 'Concorsi', icon: Briefcase },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-neutral-muted hover:text-neutral-text'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                icon={<Users size={20} />}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                value={stats?.stats?.totalUsers || 0}
                label="Utenti Totali"
              />
              <StatCard
                icon={<Briefcase size={20} />}
                iconBg="bg-green-50"
                iconColor="text-green-600"
                value={stats?.stats?.totalContests || 0}
                label="Concorsi"
              />
              <StatCard
                icon={<FileText size={20} />}
                iconBg="bg-orange-50"
                iconColor="text-orange-600"
                value={stats?.stats?.totalProposals || 0}
                label="Proposte"
              />
              <StatCard
                icon={<FileText size={20} />}
                iconBg="bg-purple-50"
                iconColor="text-purple-600"
                value={stats?.stats?.totalPractices || 0}
                label="Pratiche"
              />
            </div>

            {/* Role Distribution */}
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

            {/* Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-bold">Ultimi Utenti Registrati</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {(stats?.recentUsers || []).map((u: any) => (
                    <div key={u.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{u.name}</p>
                        <p className="text-xs text-neutral-muted">{u.email}</p>
                      </div>
                      <RoleBadge role={u.role} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-bold">Ultimi Concorsi</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {(stats?.recentContests || []).map((c: any) => (
                    <div key={c.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{c.title}</p>
                        <p className="text-xs text-neutral-muted">di {c.client?.name}</p>
                      </div>
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
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold">Gestione Utenti</h3>
              <span className="text-sm text-neutral-muted">{users.length} utenti</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-left text-xs text-neutral-muted uppercase">
                  <tr>
                    <th className="px-4 py-3">Utente</th>
                    <th className="px-4 py-3">Ruolo</th>
                    <th className="px-4 py-3">Concorsi</th>
                    <th className="px-4 py-3">Proposte</th>
                    <th className="px-4 py-3">Data Reg.</th>
                    <th className="px-4 py-3">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-sm">{u.name}</p>
                          <p className="text-xs text-neutral-muted">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={(e) => updateUserRole(u.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded px-2 py-1"
                        >
                          <option value="CLIENT">CLIENT</option>
                          <option value="ARCHITECT">ARCHITECT</option>
                          <option value="ENGINEER">ENGINEER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm">{u._count?.contests || 0}</td>
                      <td className="px-4 py-3 text-sm">{u._count?.proposals || 0}</td>
                      <td className="px-4 py-3 text-xs text-neutral-muted">
                        {new Date(u.createdAt).toLocaleDateString('it-IT')}
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm">
                          <Eye size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Contests Tab */}
        {activeTab === 'contests' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold">Gestione Concorsi</h3>
              <span className="text-sm text-neutral-muted">{contests.length} concorsi</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-left text-xs text-neutral-muted uppercase">
                  <tr>
                    <th className="px-4 py-3">Concorso</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Budget</th>
                    <th className="px-4 py-3">Proposte</th>
                    <th className="px-4 py-3">Stato</th>
                    <th className="px-4 py-3">Featured</th>
                    <th className="px-4 py-3">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contests.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm">{c.title}</p>
                        <p className="text-xs text-neutral-muted">{c.location}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">{c.client?.name}</td>
                      <td className="px-4 py-3 text-sm font-mono">
                        €{c.budget?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">{c.proposalsCount || 0}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleFeatured(c.id, c.isFeatured)}
                          className={`p-1 rounded ${c.isFeatured ? 'text-yellow-500' : 'text-gray-300'}`}
                        >
                          <Star size={18} fill={c.isFeatured ? 'currentColor' : 'none'} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye size={14} />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Components
const StatCard: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
}> = ({ icon, iconBg, iconColor, value, label }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 ${iconBg} rounded-lg ${iconColor}`}>{icon}</div>
    </div>
    <div className="text-2xl font-bold font-mono">{value}</div>
    <div className="text-sm text-neutral-muted">{label}</div>
  </div>
);

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const styles: Record<string, string> = {
    CLIENT: 'bg-blue-100 text-blue-800',
    ARCHITECT: 'bg-green-100 text-green-800',
    ENGINEER: 'bg-orange-100 text-orange-800',
    ADMIN: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[role] || styles.CLIENT}`}>
      {role}
    </span>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    OPEN: 'bg-green-100 text-green-800',
    EVALUATING: 'bg-yellow-100 text-yellow-800',
    CLOSED: 'bg-blue-100 text-blue-800',
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || styles.DRAFT}`}>
      {status}
    </span>
  );
};
