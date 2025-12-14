import React from 'react';
import { Contest } from '../types';
import { Clock, MapPin } from 'lucide-react';

interface ContestCardProps {
  contest: Contest;
  onClick: (id: string) => void;
}

export const ContestCard: React.FC<ContestCardProps> = ({ contest, onClick }) => {
  return (
    <div 
      onClick={() => onClick(contest.id)}
      className="group cursor-pointer flex flex-col gap-3"
    >
      {/* Image Container - Architectural Ratio 4:3 or Square */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img 
          src={contest.imageUrl} 
          alt={contest.title} 
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 filter grayscale-[20%] group-hover:grayscale-0"
        />
        
        {/* Minimalist Overlay Tags */}
        <div className="absolute top-4 left-4 flex gap-2">
          {contest.isFeatured && (
            <span className="bg-secondary text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest backdrop-blur-md">
              Featured
            </span>
          )}
        </div>

        {/* Price Tag - Floating minimalist */}
        <div className="absolute bottom-0 right-0 bg-white px-4 py-2 text-primary font-mono font-bold text-lg border-t border-l border-gray-100">
          €{contest.budget.toLocaleString()}
        </div>
      </div>

      {/* Content - Editorial Style */}
      <div className="space-y-1">
        <div className="flex justify-between items-start">
           <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-muted group-hover:text-secondary transition-colors">
             {contest.category}
           </span>
           {contest.daysRemaining < 7 && (
             <span className="text-[10px] text-functional-error font-medium flex items-center">
               <Clock size={10} className="mr-1"/> {contest.daysRemaining} days left
             </span>
           )}
        </div>
        
        <h3 className="font-display text-xl leading-tight text-neutral-text group-hover:underline decoration-1 underline-offset-4 decoration-secondary">
          {contest.title}
        </h3>
        
        <p className="text-sm text-neutral-muted flex items-center font-sans mt-1">
          <MapPin size={12} className="mr-1" />
          {contest.location}
        </p>
      </div>
    </div>
  );
};