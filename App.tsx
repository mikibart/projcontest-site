import React, { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { ContestDetail } from './pages/ContestDetail';
import { Dashboard } from './pages/Dashboard';
import { LaunchWizard } from './pages/LaunchWizard';
import { HowItWorks } from './pages/HowItWorks';
import { Practices } from './pages/Practices';
import { PracticeWizard } from './pages/PracticeWizard';
import { Button } from './components/Button';
import { Logo } from './components/Logo';
import { LoginModal } from './components/LoginModal';
import { Page } from './types';
import { Menu, X, User, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('HOME');
  const [selectedContestId, setSelectedContestId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const handleContestClick = (id: string) => {
    setSelectedContestId(id);
    handleNavigate('CONTEST_DETAIL');
  };

  return (
    <div className="min-h-screen bg-neutral-bg flex flex-col font-sans text-neutral-text relative selection:bg-secondary selection:text-white">
      
      {/* Background Noise/Texture could go here */}
      
      {/* Navigation - Floating Glass Design */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center py-4 px-4 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl shadow-gray-200/20 rounded-full px-6 py-3 pointer-events-auto flex items-center justify-between gap-8 md:min-w-[700px] max-w-5xl w-full transition-all duration-300">
            
            {/* Logo */}
            <div 
              className="flex items-center cursor-pointer group"
              onClick={() => handleNavigate('HOME')}
            >
              <Logo className="h-8 transition-transform group-hover:scale-105" showText={false} />
              <span className="font-display font-bold text-xl ml-2 tracking-tight hidden md:block">ProjContest</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { id: 'EXPLORE', label: 'Concorsi' },
                { id: 'PRACTICES', label: 'Pratiche' },
                { id: 'HOW_IT_WORKS', label: 'Come Funziona' },
                { id: 'DASHBOARD', label: 'Dashboard' }
              ].map((item) => (
                <button 
                  key={item.id}
                  onClick={() => handleNavigate(item.id as Page)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 relative
                    ${currentPage === item.id 
                      ? 'text-primary bg-primary/5' 
                      : 'text-neutral-muted hover:text-neutral-text hover:bg-gray-100/50'}
                  `}
                >
                  {item.label}
                  {currentPage === item.id && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></span>
                  )}
                </button>
              ))}
            </div>

            {/* CTA & Mobile Toggle */}
            <div className="flex items-center gap-3">
              <div className="hidden md:block h-4 w-[1px] bg-gray-200 mx-2"></div>
              {user ? (
                <div className="hidden md:flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600">
                    {user.name}
                  </span>
                  <button
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    onClick={handleLogout}
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <button
                  className="hidden md:block text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setIsLoginModalOpen(true)}
                >
                  Log in
                </button>
              )}
              <Button 
                size="sm" 
                variant="primary" 
                className="rounded-full !px-5"
                onClick={() => handleNavigate('LAUNCH_WIZARD')}
              >
                Start Project
              </Button>
              
              <button className="md:hidden text-neutral-text p-1" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-40 pt-24 px-6 animate-fade-in flex flex-col gap-6">
           <button onClick={() => handleNavigate('EXPLORE')} className="text-3xl font-display font-bold text-neutral-text">Concorsi</button>
           <button onClick={() => handleNavigate('PRACTICES')} className="text-3xl font-display font-bold text-neutral-text">Pratiche Edilizie</button>
           <button onClick={() => handleNavigate('HOW_IT_WORKS')} className="text-3xl font-display font-bold text-neutral-text">Processo</button>
           <button onClick={() => handleNavigate('DASHBOARD')} className="text-3xl font-display font-bold text-neutral-text">Dashboard</button>
           <div className="h-[1px] bg-gray-100 my-4 w-full"></div>
           <Button fullWidth onClick={() => handleNavigate('LAUNCH_WIZARD')}>Lancia Concorso</Button>
        </div>
      )}

      {/* Main Content Spacer for Fixed Nav */}
      <div className="h-20"></div>

      {/* Main Content */}
      <main className="flex-1 relative z-0">
        {currentPage === 'HOME' && <Home onNavigate={handleNavigate} onContestClick={handleContestClick} />}
        {currentPage === 'EXPLORE' && <Explore onContestClick={handleContestClick} />}
        {currentPage === 'CONTEST_DETAIL' && selectedContestId && (
          <ContestDetail id={selectedContestId} onBack={() => handleNavigate('EXPLORE')} />
        )}
        {currentPage === 'DASHBOARD' && <Dashboard />}
        {currentPage === 'HOW_IT_WORKS' && <HowItWorks onNavigate={handleNavigate} />}
        {currentPage === 'PRACTICES' && <Practices onNavigate={handleNavigate} />}
        {currentPage === 'PRACTICE_WIZARD' && (
          <PracticeWizard 
             onComplete={() => {
                alert("Richiesta preventivo inviata! Sarai contattato entro 24h.");
                handleNavigate('DASHBOARD');
             }}
             onCancel={() => handleNavigate('PRACTICES')}
          />
        )}
        {currentPage === 'LAUNCH_WIZARD' && (
          <LaunchWizard 
            onComplete={() => {
              alert('Concorso Pubblicato! Reindirizzamento alla dashboard...');
              handleNavigate('HOME');
            }} 
            onCancel={() => handleNavigate('HOME')} 
          />
        )}
      </main>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(loggedInUser) => setUser(loggedInUser)}
      />

      {/* Footer - Minimalist */}
      <footer className="bg-primary text-white pt-20 pb-8 mt-auto relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-white/10"></div>
        {/* Large Typography Footer */}
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start mb-16">
             <div className="max-w-md">
               <h2 className="font-display text-4xl md:text-5xl mb-6">Let's build something <span className="italic text-secondary">iconic</span>.</h2>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-12 mt-8 md:mt-0 text-sm text-gray-400">
                <div className="flex flex-col gap-4">
                  <span className="text-white font-bold tracking-wider uppercase text-xs">Platform</span>
                  <button className="text-left hover:text-white transition-colors">How it works</button>
                  <button className="text-left hover:text-white transition-colors">Pratiche Edilizie</button>
                  <button className="text-left hover:text-white transition-colors">Architects</button>
                </div>
                <div className="flex flex-col gap-4">
                  <span className="text-white font-bold tracking-wider uppercase text-xs">Company</span>
                  <button className="text-left hover:text-white transition-colors">About</button>
                  <button className="text-left hover:text-white transition-colors">Manifesto</button>
                  <button className="text-left hover:text-white transition-colors">Careers</button>
                </div>
             </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10 text-xs text-gray-500">
             <p>© 2024 ProjContest Inc. Milan, Italy.</p>
             <div className="flex gap-6 mt-4 md:mt-0">
               <span>Privacy Policy</span>
               <span>Terms of Service</span>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;