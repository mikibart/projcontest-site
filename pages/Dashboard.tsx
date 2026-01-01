import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { ProposalsModal } from '../components/ProposalsModal';
import { PaymentModal } from '../components/PaymentModal';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Trophy, Clock, TrendingUp, Sparkles, FileText, Download,
  HardHat, Activity, AlertTriangle, CheckCircle2, Calendar,
  ChevronRight, Calculator, Siren, Zap, Loader2, LogIn,
  Briefcase, Users, Eye, CreditCard
} from 'lucide-react';

interface DashboardProps {
  onLoginClick?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLoginClick }) => {
  const [activeTab, setActiveTab] = useState<'contests' | 'technical'>('contests');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/user/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, clear and show login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setUser(null);
          setLoading(false);
          return;
        }
        throw new Error('Errore nel caricamento della dashboard');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Not logged in state
  if (!user) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-neutral-text mb-4">
            Accedi per vedere la tua Dashboard
          </h1>
          <p className="text-neutral-muted mb-8">
            Effettua il login per accedere ai tuoi concorsi, proposte e pratiche edilizie.
          </p>
          <Button onClick={onLoginClick} size="lg">
            Accedi al tuo account
          </Button>
          <p className="text-sm text-neutral-muted mt-4">
            Demo: <code className="bg-gray-100 px-2 py-1 rounded">cliente@demo.it</code> / <code className="bg-gray-100 px-2 py-1 rounded">demo123</code>
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-neutral-muted">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-display font-bold text-neutral-text mb-4">
            Errore
          </h1>
          <p className="text-neutral-muted mb-8">{error}</p>
          <Button onClick={fetchDashboardData}>Riprova</Button>
        </div>
      </div>
    );
  }

  const isArchitect = user?.role === 'ARCHITECT';
  const isEngineer = user?.role === 'ENGINEER';

  // Architect Dashboard
  if (isArchitect) {
    return <ArchitectDashboard data={dashboardData} user={user} />;
  }

  // Engineer Dashboard
  if (isEngineer) {
    return <EngineerDashboard data={dashboardData} user={user} />;
  }

  // Client Dashboard
  return <ClientDashboard data={dashboardData} user={user} activeTab={activeTab} setActiveTab={setActiveTab} />;
};

// ==================== ARCHITECT DASHBOARD ====================
const ArchitectDashboard: React.FC<{ data: any; user: any }> = ({ data, user }) => {
  const stats = data?.stats || {};
  const proposals = data?.proposals || [];
  const recommendedContests = data?.recommendedContests || [];

  const chartData = [
    { name: 'Gen', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'Mag', value: 500 },
    { name: 'Giu', value: stats.totalEarnings || 0 },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold text-neutral-text">
            Ciao, {user.name}!
          </h1>
          <p className="text-neutral-muted">
            Ecco il riepilogo della tua attività come Architetto.
          </p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<FileText size={20} />}
            iconBg="bg-blue-50"
            iconColor="text-primary"
            value={stats.totalProposals || 0}
            label="Proposte inviate"
          />
          <StatCard
            icon={<Trophy size={20} />}
            iconBg="bg-yellow-50"
            iconColor="text-yellow-600"
            value={stats.winningProposals || 0}
            label="Concorsi vinti"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            iconBg="bg-green-50"
            iconColor="text-green-600"
            value={`€${(stats.totalEarnings || 0).toLocaleString()}`}
            label="Guadagni totali"
          />
          <StatCard
            icon={<Clock size={20} />}
            iconBg="bg-orange-50"
            iconColor="text-orange-600"
            value={stats.activeProposals || 0}
            label="In valutazione"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">

            {/* AI Suggestions */}
            <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2A4D7A] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="text-yellow-400" />
                  <h3 className="font-bold text-lg">Concorsi consigliati per te</h3>
                </div>
                <p className="text-blue-100 mb-6 text-sm max-w-md">
                  Basato sul tuo profilo e le tue competenze.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recommendedContests.slice(0, 2).map((c: any) => (
                    <div key={c.id} className="bg-white/10 backdrop-blur border border-white/20 p-4 rounded-xl hover:bg-white/20 transition-colors cursor-pointer">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs bg-white/20 px-2 py-1 rounded text-white">
                          {c.daysRemaining}gg rimasti
                        </span>
                        <span className="text-xs font-bold">€{c.budget?.toLocaleString()}</span>
                      </div>
                      <h4 className="font-bold text-sm truncate">{c.title}</h4>
                      <p className="text-xs text-blue-200 mt-1">{c.proposalsCount} proposte</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            </div>

            {/* Active Proposals */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-lg">Le tue proposte</h3>
              </div>
              {proposals.length === 0 ? (
                <div className="p-8 text-center text-neutral-muted">
                  <FileText size={40} className="mx-auto mb-4 opacity-30" />
                  <p>Non hai ancora inviato proposte.</p>
                  <p className="text-sm mt-2">Esplora i concorsi disponibili!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {proposals.slice(0, 5).map((proposal: any) => (
                    <div key={proposal.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={proposal.contest?.imageUrl || `https://picsum.photos/100/100?random=${proposal.id}`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-medium text-neutral-text">{proposal.contest?.title}</h4>
                          <p className="text-xs text-neutral-muted">
                            €{proposal.contest?.budget?.toLocaleString()} • {proposal.contest?.daysRemaining || 0}gg rimasti
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <ProposalStatusBadge status={proposal.status} />
                        <Button variant="ghost" size="sm">Dettagli</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Chart */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-lg mb-6">Andamento Guadagni</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
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
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== ENGINEER DASHBOARD ====================
const EngineerDashboard: React.FC<{ data: any; user: any }> = ({ data, user }) => {
  const [availableRequests, setAvailableRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const assignedRequests = data?.assignedPractices || [];
  const stats = data?.stats || {};

  useEffect(() => {
    fetchAvailableRequests();
  }, []);

  const fetchAvailableRequests = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/practices/requests?available=true', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableRequests(data.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleClaimRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/practices/requests/${requestId}/claim`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        // Refresh data
        fetchAvailableRequests();
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold text-neutral-text">
            Ciao, {user.name}!
          </h1>
          <p className="text-neutral-muted">
            Gestisci le pratiche edilizie assegnate e trova nuovi incarichi.
          </p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<FileText size={20} />}
            iconBg="bg-blue-50"
            iconColor="text-primary"
            value={stats.totalAssigned || assignedRequests.length}
            label="Pratiche assegnate"
          />
          <StatCard
            icon={<Clock size={20} />}
            iconBg="bg-yellow-50"
            iconColor="text-yellow-600"
            value={assignedRequests.filter((p: any) => p.status === 'IN_PROGRESS').length}
            label="In lavorazione"
          />
          <StatCard
            icon={<CheckCircle2 size={20} />}
            iconBg="bg-green-50"
            iconColor="text-green-600"
            value={stats.completedPractices || 0}
            label="Completate"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            value={`€${(stats.totalEarnings || 0).toLocaleString()}`}
            label="Guadagni totali"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Requests */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-transparent">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Sparkles className="text-green-600" size={20} />
                Richieste Disponibili
              </h3>
              <p className="text-sm text-neutral-muted mt-1">Nuovi incarichi da acquisire</p>
            </div>
            {loadingRequests ? (
              <div className="p-8 text-center">
                <Loader2 className="animate-spin mx-auto text-primary" size={24} />
              </div>
            ) : availableRequests.length === 0 ? (
              <div className="p-8 text-center text-neutral-muted">
                <HardHat size={40} className="mx-auto mb-4 opacity-30" />
                <p>Nessuna richiesta disponibile al momento.</p>
                <p className="text-sm mt-2">Controlla più tardi!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {availableRequests.map((request: any) => (
                  <div key={request.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-neutral-text">{request.type}</h4>
                        <p className="text-xs text-neutral-muted">{request.address}</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Disponibile
                      </span>
                    </div>
                    <p className="text-sm text-neutral-muted mb-3 line-clamp-2">
                      {request.description}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleClaimRequest(request.id)}
                    >
                      Accetta Incarico
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assigned Requests */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-lg">Le tue Pratiche</h3>
              <p className="text-sm text-neutral-muted mt-1">Incarichi assegnati a te</p>
            </div>
            {assignedRequests.length === 0 ? (
              <div className="p-8 text-center text-neutral-muted">
                <FileText size={40} className="mx-auto mb-4 opacity-30" />
                <p>Non hai pratiche assegnate.</p>
                <p className="text-sm mt-2">Accetta un incarico dalla lista!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {assignedRequests.map((practice: any) => (
                  <div key={practice.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-neutral-text">{practice.type}</h4>
                        <p className="text-xs text-neutral-muted">{practice.address}</p>
                      </div>
                      <PracticeStatusBadge status={practice.status} />
                    </div>
                    <p className="text-sm text-neutral-muted mb-3 line-clamp-2">
                      {practice.description}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Dettagli</Button>
                      {practice.status === 'IN_PROGRESS' && (
                        <Button size="sm">Completa</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== CLIENT DASHBOARD ====================
const ClientDashboard: React.FC<{
  data: any;
  user: any;
  activeTab: 'contests' | 'technical';
  setActiveTab: (tab: 'contests' | 'technical') => void;
}> = ({ data, user, activeTab, setActiveTab }) => {
  const [selectedContest, setSelectedContest] = useState<{ id: string; title: string } | null>(null);
  const [paymentContest, setPaymentContest] = useState<{ id: string; title: string; budget: number } | null>(null);

  const stats = data?.stats || {};
  const contests = data?.contests || [];
  const practiceRequests = data?.practiceRequests || [];
  const notifications = data?.notifications || [];

  // Check for payment success/failure in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    if (paymentStatus === 'success') {
      // Show success notification or refresh
      window.history.replaceState({}, '', '/dashboard');
      window.location.reload();
    } else if (paymentStatus === 'cancelled' || paymentStatus === 'failed') {
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  const handleViewProposals = (contest: any) => {
    setSelectedContest({ id: contest.id, title: contest.title });
  };

  const handleCloseProposals = () => {
    setSelectedContest(null);
  };

  const handleWinnerSelected = () => {
    // Reload page to refresh data
    window.location.reload();
  };

  const handlePayContest = (contest: any) => {
    setPaymentContest({ id: contest.id, title: contest.title, budget: contest.budget });
  };

  const handleClosePayment = () => {
    setPaymentContest(null);
  };

  const handlePaymentSuccess = () => {
    setPaymentContest(null);
    window.location.reload();
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-neutral-text">
              Ciao, {user.name}!
            </h1>
            <p className="text-neutral-muted">
              {activeTab === 'contests'
                ? 'Gestisci i tuoi concorsi e le proposte ricevute.'
                : 'Monitoraggio delle tue pratiche edilizie.'}
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
              Pratiche Edilizie
            </button>
          </div>
        </header>

        {activeTab === 'contests' ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={<Briefcase size={20} />}
                iconBg="bg-blue-50"
                iconColor="text-primary"
                value={stats.totalContests || 0}
                label="Concorsi creati"
              />
              <StatCard
                icon={<Clock size={20} />}
                iconBg="bg-green-50"
                iconColor="text-green-600"
                value={stats.activeContests || 0}
                label="Concorsi attivi"
              />
              <StatCard
                icon={<Users size={20} />}
                iconBg="bg-orange-50"
                iconColor="text-orange-600"
                value={stats.totalProposalsReceived || 0}
                label="Proposte ricevute"
              />
              <StatCard
                icon={<FileText size={20} />}
                iconBg="bg-purple-50"
                iconColor="text-purple-600"
                value={stats.activePractices || 0}
                label="Pratiche attive"
              />
            </div>

            {/* Contests List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-lg">I tuoi concorsi</h3>
                <Button size="sm">+ Nuovo Concorso</Button>
              </div>
              {contests.length === 0 ? (
                <div className="p-8 text-center text-neutral-muted">
                  <Briefcase size={40} className="mx-auto mb-4 opacity-30" />
                  <p>Non hai ancora creato concorsi.</p>
                  <Button className="mt-4">Crea il tuo primo concorso</Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {contests.map((contest: any) => (
                    <div key={contest.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                            <img
                              src={contest.imageUrl || `https://picsum.photos/100/100?random=${contest.id}`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="font-medium text-neutral-text">{contest.title}</h4>
                            <p className="text-sm text-neutral-muted">
                              €{contest.budget?.toLocaleString()} • {contest.location}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-neutral-muted">
                              <span className="flex items-center gap-1">
                                <Users size={12} /> {contest.proposalsCount} proposte
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={12} /> {contest.daysRemaining}gg rimasti
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <ContestStatusBadge status={contest.status} />
                          {contest.status === 'PENDING_APPROVAL' ? (
                            <Button
                              size="sm"
                              onClick={() => handlePayContest(contest)}
                            >
                              <CreditCard size={14} className="mr-1" /> Paga e pubblica
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewProposals(contest)}
                            >
                              <Eye size={14} className="mr-1" /> Vedi proposte ({contest.proposalsCount || 0})
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Practices Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                icon={<FileText size={20} />}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                value={practiceRequests.length}
                label="Pratiche totali"
              />
              <StatCard
                icon={<Clock size={20} />}
                iconBg="bg-yellow-50"
                iconColor="text-yellow-600"
                value={practiceRequests.filter((p: any) => p.status === 'IN_PROGRESS').length}
                label="In lavorazione"
              />
              <StatCard
                icon={<CheckCircle2 size={20} />}
                iconBg="bg-green-50"
                iconColor="text-green-600"
                value={practiceRequests.filter((p: any) => p.status === 'COMPLETED').length}
                label="Completate"
              />
            </div>

            {/* Practices List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-lg">Le tue pratiche edilizie</h3>
                <Button size="sm">+ Nuova Richiesta</Button>
              </div>
              {practiceRequests.length === 0 ? (
                <div className="p-8 text-center text-neutral-muted">
                  <FileText size={40} className="mx-auto mb-4 opacity-30" />
                  <p>Non hai ancora richiesto pratiche.</p>
                  <Button className="mt-4">Richiedi un preventivo</Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {practiceRequests.map((practice: any) => (
                    <div key={practice.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-neutral-text">{practice.type}</h4>
                        <p className="text-sm text-neutral-muted">{practice.location}</p>
                      </div>
                      <PracticeStatusBadge status={practice.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Proposals Modal for Winner Selection */}
      {selectedContest && (
        <ProposalsModal
          contestId={selectedContest.id}
          contestTitle={selectedContest.title}
          isOpen={true}
          onClose={handleCloseProposals}
          onWinnerSelected={handleWinnerSelected}
        />
      )}

      {/* Payment Modal */}
      {paymentContest && (
        <PaymentModal
          contest={paymentContest}
          isOpen={true}
          onClose={handleClosePayment}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

// ==================== HELPER COMPONENTS ====================
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

const ProposalStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    SUBMITTED: 'bg-blue-100 text-blue-800',
    UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
    SELECTED: 'bg-purple-100 text-purple-800',
    WINNER: 'bg-green-100 text-green-800',
    REJECTED: 'bg-gray-100 text-gray-800',
  };
  const labels: Record<string, string> = {
    SUBMITTED: 'Inviata',
    UNDER_REVIEW: 'In valutazione',
    SELECTED: 'Selezionata',
    WINNER: 'Vincitrice',
    REJECTED: 'Non selezionata',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || styles.SUBMITTED}`}>
      {labels[status] || status}
    </span>
  );
};

const ContestStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PENDING_APPROVAL: 'bg-blue-100 text-blue-800',
    OPEN: 'bg-green-100 text-green-800',
    EVALUATING: 'bg-yellow-100 text-yellow-800',
    CLOSED: 'bg-blue-100 text-blue-800',
    HIDDEN: 'bg-red-100 text-red-800',
  };
  const labels: Record<string, string> = {
    DRAFT: 'Bozza',
    PENDING_APPROVAL: 'In attesa pagamento',
    OPEN: 'Aperto',
    EVALUATING: 'In valutazione',
    CLOSED: 'Chiuso',
    HIDDEN: 'Nascosto',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || styles.DRAFT}`}>
      {labels[status] || status}
    </span>
  );
};

const PracticeStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    PENDING_QUOTE: 'bg-gray-100 text-gray-800',
    QUOTE_SENT: 'bg-blue-100 text-blue-800',
    ACCEPTED: 'bg-purple-100 text-purple-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };
  const labels: Record<string, string> = {
    PENDING_QUOTE: 'In attesa preventivo',
    QUOTE_SENT: 'Preventivo inviato',
    ACCEPTED: 'Accettato',
    IN_PROGRESS: 'In lavorazione',
    COMPLETED: 'Completata',
    CANCELLED: 'Annullata',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || styles.PENDING_QUOTE}`}>
      {labels[status] || status}
    </span>
  );
};
