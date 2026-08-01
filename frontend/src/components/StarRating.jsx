/**
 * StarRating – interactive 1-5 star selector.
 *
 * Props
 * -----
 * value       : number  – currently selected rating (1-5)
 * onChange    : fn      – called with new rating when user clicks/hovers
 * label       : string  – accessible label rendered above the stars
 * size        : "sm" | "md" | "lg"  (default "md")
 * readonly    : bool    – disables interaction when true
 */
import React, { useState } from 'react';
import { Star } from 'lucide-react';

const SIZE_MAP = {
  sm: 'w-5 h-5',
  md: 'w-7 h-7',
  lg: 'w-9 h-9',
};

const StarRating = ({
  value = 0,
  onChange,
  label,
  size = 'md',
  readonly = false,
}) => {
  const [hovered, setHovered] = useState(0);
  const starSize = SIZE_MAP[size] || SIZE_MAP.md;
  const display  = hovered || value;

  return (
    <div>
      {label && (
        <span className="block text-xs font-semibold uppercase tracking-wider text-dark-300 mb-2">
          {label}
        </span>
      )}
      <div
        className="flex items-center gap-1.5"
        onMouseLeave={() => !readonly && setHovered(0)}
        role="radiogroup"
        aria-label={label}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            className={`transition-all duration-150 focus:outline-none ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            }`}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          >
            <Star
              className={`${starSize} transition-colors duration-150 ${
                star <= display
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-dark-700 fill-dark-900'
              }`}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-xs font-semibold text-amber-400">
            {value} / 5
          </span>
        )}
      </div>
    </div>
  );
};

export default StarRating;
