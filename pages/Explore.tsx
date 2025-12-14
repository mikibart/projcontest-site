import React, { useState } from 'react';
import { MOCK_CONTESTS } from '../constants';
import { ContestCard } from '../components/ContestCard';
import { Category } from '../types';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { Button } from '../components/Button';

interface ExploreProps {
  onContestClick: (id: string) => void;
}

export const Explore: React.FC<ExploreProps> = ({ onContestClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');

  const filteredContests = MOCK_CONTESTS.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-neutral-text">Concorsi</h1>
          <p className="text-neutral-muted mt-1">Trova progetti adatti alle tue competenze.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cerca per parola chiave..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-light focus:ring-2 focus:ring-primary-light/20 outline-none transition-all"
            />
          </div>
          <Button variant="outline" className="md:hidden">
            <Filter size={18} />
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-8">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-neutral-text flex items-center">
                <SlidersHorizontal size={18} className="mr-2" /> Filtri
              </h3>
              <span className="text-xs text-primary cursor-pointer hover:underline">Reset</span>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-neutral-text mb-3">Categoria</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" checked={selectedCategory === 'All'} onChange={() => setSelectedCategory('All')} className="text-primary focus:ring-primary" />
                    <span className="text-sm text-neutral-600">Tutte</span>
                  </label>
                  {Object.values(Category).map(cat => (
                    <label key={cat} className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="radio" 
                        checked={selectedCategory === cat} 
                        onChange={() => setSelectedCategory(cat)} 
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-neutral-600">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-neutral-text mb-3">Budget</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">                                              
                    <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                    <span className="text-sm text-neutral-600">€100 - €500</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                    <span className="text-sm text-neutral-600">€500 - €2.000</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                    <span className="text-sm text-neutral-600">€2.000+</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Grid Results */}
        <div className="flex-1">
          {filteredContests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredContests.map(contest => (
                <ContestCard key={contest.id} contest={contest} onClick={onContestClick} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-100 border-dashed">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                <Search className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-medium text-neutral-text">Nessun risultato trovato</h3>
              <p className="text-neutral-muted">Prova a modificare i filtri o la ricerca.</p>
              <Button variant="ghost" className="mt-4" onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}>
                Cancella filtri
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};