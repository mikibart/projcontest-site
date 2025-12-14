import React, { useState, useEffect } from 'react';
import { X, Trophy, Loader2, User, CheckCircle, Star, ExternalLink } from 'lucide-react';
import { Button } from './Button';
import { apiFetch } from '../utils/api';

interface Proposal {
  id: string;
  description: string;
  status: string;
  createdAt: string;
  architect: {
    id: string;
    name: string;
    avatarUrl: string | null;
    bio: string | null;
  };
}

interface ProposalsModalProps {
  contestId: string;
  contestTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onWinnerSelected: () => void;
}

export const ProposalsModal: React.FC<ProposalsModalProps> = ({
  contestId,
  contestTitle,
  isOpen,
  onClose,
  onWinnerSelected,
}) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchProposals();
    }
  }, [isOpen, contestId]);

  const fetchProposals = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await apiFetch<{ proposals: Proposal[] }>(`/contests/${contestId}/proposals`);
    if (error) {
      setError(error);
    } else if (data) {
      setProposals(data.proposals || []);
    }
    setLoading(false);
  };

  const handleSelectWinner = async (proposalId: string) => {
    setSelecting(proposalId);
    setError(null);

    const { data, error } = await apiFetch<any>(`/contests/${contestId}/proposals/${proposalId}/winner`, {
      method: 'PUT',
    });

    setSelecting(null);

    if (error) {
      setError(error);
      return;
    }

    // Refresh proposals to show updated status
    await fetchProposals();
    onWinnerSelected();
  };

  if (!isOpen) return null;

  const hasWinner = proposals.some(p => p.status === 'WINNER');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h3 className="font-display font-bold text-xl text-neutral-text">Proposte Ricevute</h3>
            <p className="text-sm text-neutral-muted mt-1">{contestTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button variant="outline" onClick={fetchProposals}>Riprova</Button>
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-center py-12 text-neutral-muted">
              <User size={48} className="mx-auto mb-4 opacity-30" />
              <p>Nessuna proposta ricevuta ancora.</p>
              <p className="text-sm mt-2">Le proposte degli architetti appariranno qui.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {hasWinner && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
                  <div className="flex items-center gap-2 text-green-700">
                    <Trophy size={20} />
                    <span className="font-medium">Vincitore selezionato!</span>
                  </div>
                </div>
              )}

              {proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className={`border rounded-xl p-6 transition-all ${
                    proposal.status === 'WINNER'
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 hover:border-primary/30'
                  }`}
                >
                  {/* Architect Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                        {proposal.architect.avatarUrl ? (
                          <img
                            src={proposal.architect.avatarUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={24} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-neutral-text">{proposal.architect.name}</h4>
                          {proposal.status === 'WINNER' && (
                            <span className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                              <Trophy size={12} /> Vincitore
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-muted">
                          Inviata il {new Date(proposal.createdAt).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    </div>
                    {proposal.architect.bio && (
                      <button className="text-xs text-primary hover:underline flex items-center gap-1">
                        <ExternalLink size={12} /> Portfolio
                      </button>
                    )}
                  </div>

                  {/* Proposal Description */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-neutral-text whitespace-pre-wrap">
                      {proposal.description}
                    </p>
                  </div>

                  {/* Actions */}
                  {!hasWinner && (
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSelectWinner(proposal.id)}
                        disabled={selecting === proposal.id}
                      >
                        {selecting === proposal.id ? (
                          <><Loader2 size={14} className="mr-1 animate-spin" /> Selezione...</>
                        ) : (
                          <><Trophy size={14} className="mr-1" /> Seleziona Vincitore</>
                        )}
                      </Button>
                    </div>
                  )}

                  {proposal.status === 'WINNER' && (
                    <div className="flex justify-end">
                      <span className="text-sm text-green-700 flex items-center gap-1">
                        <CheckCircle size={16} /> Hai selezionato questo progettista
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
