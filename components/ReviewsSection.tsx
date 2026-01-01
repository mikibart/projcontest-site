import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Star, Loader2, User, AlertCircle } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  reviewer: { id: string; name: string; avatarUrl?: string; role: string };
  reviewee: { id: string; name: string; avatarUrl?: string };
  contest?: { id: string; title: string };
  createdAt: string;
}

interface ReviewsSectionProps {
  userId: string;
  showWriteReview?: boolean;
  contestId?: string;
  onReviewSubmitted?: () => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  userId,
  showWriteReview = false,
  contestId,
  onReviewSubmitted,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  useEffect(() => {
    fetchReviews();
  }, [userId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reviews?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setAverageRating(data.averageRating || 0);
        setTotalReviews(data.totalReviews || 0);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (newRating === 0) {
      setError('Seleziona una valutazione');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          revieweeId: userId,
          rating: newRating,
          comment: newComment.trim() || null,
          contestId: contestId || null,
        }),
      });

      if (response.ok) {
        const review = await response.json();
        setReviews(prev => [review, ...prev]);
        setTotalReviews(prev => prev + 1);
        setAverageRating(prev => (prev * totalReviews + newRating) / (totalReviews + 1));
        setNewRating(0);
        setNewComment('');
        setShowForm(false);
        onReviewSubmitted?.();
      } else {
        const data = await response.json();
        setError(data.error || 'Errore nell\'invio della recensione');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={sizeClass}
            className={star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-gray-50 rounded-xl p-6 flex items-center gap-6">
        <div className="text-center">
          <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
          <div className="mt-1">{renderStars(Math.round(averageRating), 'md')}</div>
          <p className="text-sm text-neutral-muted mt-1">{totalReviews} recensioni</p>
        </div>
        <div className="flex-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter(r => r.rating === star).length;
            const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 mb-1">
                <span className="text-sm w-4">{star}</span>
                <Star size={12} className="text-yellow-500 fill-yellow-500" />
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-xs text-neutral-muted w-8">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Write Review Button/Form */}
      {showWriteReview && currentUser.id && currentUser.id !== userId && (
        <div>
          {!showForm ? (
            <Button onClick={() => setShowForm(true)} variant="outline">
              Scrivi una recensione
            </Button>
          ) : (
            <div className="bg-white border rounded-xl p-6 space-y-4">
              <h4 className="font-bold">La tua recensione</h4>

              {/* Star Rating */}
              <div>
                <p className="text-sm text-neutral-muted mb-2">Valutazione</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setNewRating(star)}
                      className="p-1"
                    >
                      <Star
                        size={32}
                        className={`transition-colors ${
                          star <= (hoverRating || newRating)
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="text-sm text-neutral-muted mb-2 block">
                  Commento (opzionale)
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Condividi la tua esperienza..."
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                  rows={4}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Annulla
                </Button>
                <Button onClick={submitReview} disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  Pubblica recensione
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-center text-neutral-muted py-8">
            Nessuna recensione ancora
          </p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white border rounded-xl p-4">
              <div className="flex items-start gap-3">
                {review.reviewer.avatarUrl ? (
                  <img src={review.reviewer.avatarUrl} className="w-10 h-10 rounded-full" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User size={20} className="text-gray-500" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{review.reviewer.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      review.reviewer.role === 'ARCHITECT' ? 'bg-green-100 text-green-800' :
                      review.reviewer.role === 'CLIENT' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
                    }`}>{review.reviewer.role}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {renderStars(review.rating, 'sm')}
                    <span className="text-xs text-neutral-muted">{formatDate(review.createdAt)}</span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-neutral-muted">{review.comment}</p>
                  )}
                  {review.contest && (
                    <p className="text-xs text-primary mt-2">
                      Per il concorso: {review.contest.title}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
