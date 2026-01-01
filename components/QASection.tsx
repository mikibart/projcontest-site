import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import {
  MessageCircle, Send, Loader2, User, ChevronDown, ChevronUp,
  Clock, CheckCircle, AlertCircle
} from 'lucide-react';

interface QAMessage {
  id: string;
  question: string;
  answer?: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
  answeredAt?: string;
}

interface QASectionProps {
  contestId: string;
  isOwner: boolean;
  contestStatus: string;
}

export const QASection: React.FC<QASectionProps> = ({
  contestId,
  isOwner,
  contestStatus,
}) => {
  const [qaMessages, setQaMessages] = useState<QAMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [newAnswer, setNewAnswer] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  useEffect(() => {
    fetchQA();
  }, [contestId]);

  const fetchQA = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/contests/${contestId}/qa`);
      if (response.ok) {
        const data = await response.json();
        setQaMessages(data.qaMessages || []);
      }
    } catch (err) {
      console.error('Failed to fetch Q&A:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitQuestion = async () => {
    if (!newQuestion.trim()) return;

    if (!currentUser.id) {
      setError('Devi effettuare il login per inviare una domanda');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/contests/${contestId}/qa`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ question: newQuestion.trim() }),
      });

      if (response.ok) {
        const qa = await response.json();
        setQaMessages(prev => [qa, ...prev]);
        setNewQuestion('');
        setShowForm(false);
      } else {
        const data = await response.json();
        setError(data.error || 'Errore nell\'invio della domanda');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setSubmitting(false);
    }
  };

  const submitAnswer = async (qaId: string) => {
    if (!newAnswer.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/contests/${contestId}/qa`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ qaId, answer: newAnswer.trim() }),
      });

      if (response.ok) {
        const qa = await response.json();
        setQaMessages(prev => prev.map(q => q.id === qaId ? qa : q));
        setNewAnswer('');
        setAnsweringId(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Errore nell\'invio della risposta');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Meno di un\'ora fa';
    if (hours < 24) return `${hours} ore fa`;
    if (days < 7) return `${days} giorni fa`;
    return date.toLocaleDateString('it-IT');
  };

  const canAskQuestion = contestStatus === 'OPEN' && currentUser.id;

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <MessageCircle size={20} />
          Domande & Risposte
          <span className="text-sm font-normal text-neutral-muted">({qaMessages.length})</span>
        </h3>
        {canAskQuestion && !showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            Fai una domanda
          </Button>
        )}
      </div>

      {/* Ask Question Form */}
      {showForm && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-4">
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Scrivi la tua domanda..."
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none bg-white"
            rows={3}
          />
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setNewQuestion(''); }}>
              Annulla
            </Button>
            <Button size="sm" onClick={submitQuestion} disabled={submitting || !newQuestion.trim()}>
              {submitting ? <Loader2 className="animate-spin mr-2" size={14} /> : <Send size={14} className="mr-2" />}
              Invia domanda
            </Button>
          </div>
        </div>
      )}

      {/* Q&A List */}
      {qaMessages.length === 0 ? (
        <div className="text-center py-8 text-neutral-muted">
          <MessageCircle size={40} className="mx-auto mb-4 opacity-50" />
          <p>Nessuna domanda ancora.</p>
          {canAskQuestion && (
            <p className="text-sm mt-2">Sii il primo a fare una domanda!</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {qaMessages.map((qa) => {
            const isExpanded = expandedIds.has(qa.id);
            const hasAnswer = !!qa.answer;

            return (
              <div key={qa.id} className="bg-white border rounded-xl overflow-hidden">
                {/* Question */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleExpand(qa.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {hasAnswer ? (
                          <CheckCircle size={16} className="text-green-500" />
                        ) : (
                          <Clock size={16} className="text-orange-500" />
                        )}
                        <span className="text-sm font-medium">
                          {hasAnswer ? 'Risposta' : 'In attesa di risposta'}
                        </span>
                      </div>
                      <p className={`font-medium ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {qa.question}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-neutral-muted">
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {qa.authorName}
                        </span>
                        <span>{formatDate(qa.createdAt)}</span>
                      </div>
                    </div>
                    <button className="p-1 text-neutral-muted">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>

                {/* Answer */}
                {isExpanded && (
                  <div className="border-t">
                    {hasAnswer ? (
                      <div className="p-4 bg-green-50">
                        <p className="text-sm font-medium text-green-800 mb-2">Risposta del committente:</p>
                        <p className="text-sm">{qa.answer}</p>
                        {qa.answeredAt && (
                          <p className="text-xs text-neutral-muted mt-2">
                            Risposto {formatDate(qa.answeredAt)}
                          </p>
                        )}
                      </div>
                    ) : isOwner ? (
                      // Owner can answer
                      answeringId === qa.id ? (
                        <div className="p-4 space-y-4">
                          <textarea
                            value={newAnswer}
                            onChange={(e) => setNewAnswer(e.target.value)}
                            placeholder="Scrivi la tua risposta..."
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                            rows={3}
                          />
                          <div className="flex gap-3">
                            <Button variant="outline" size="sm" onClick={() => { setAnsweringId(null); setNewAnswer(''); }}>
                              Annulla
                            </Button>
                            <Button size="sm" onClick={() => submitAnswer(qa.id)} disabled={submitting || !newAnswer.trim()}>
                              {submitting ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
                              Pubblica risposta
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4">
                          <Button variant="outline" size="sm" onClick={() => setAnsweringId(qa.id)}>
                            Rispondi a questa domanda
                          </Button>
                        </div>
                      )
                    ) : (
                      <div className="p-4 text-center text-sm text-neutral-muted">
                        In attesa di risposta dal committente
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
