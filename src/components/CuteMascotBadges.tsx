import React from 'react';

export const CutePetBannerIllustration: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-3 py-1">
      {/* Cute Puppy SVG (Orange accent) */}
      <div className="w-12 h-12 rounded-2xl bg-[#FFF3E8] border border-[#FFD5B5] flex items-center justify-center shadow-xs">
        <svg viewBox="0 0 64 64" className="w-9 h-9">
          <ellipse cx="14" cy="30" rx="8" ry="14" transform="rotate(15 14 30)" fill="#FF8A3D" />
          <ellipse cx="50" cy="30" rx="8" ry="14" transform="rotate(-15 50 30)" fill="#FF8A3D" />
          <circle cx="32" cy="32" r="18" fill="#FFE0C2" />
          <circle cx="25" cy="29" r="3" fill="#3B281E" />
          <circle cx="39" cy="29" r="3" fill="#3B281E" />
          <circle cx="24" cy="28" r="1" fill="#FFFFFF" />
          <circle cx="38" cy="28" r="1" fill="#FFFFFF" />
          <ellipse cx="32" cy="35" rx="3.5" ry="2.5" fill="#FF6B9D" />
          <path d="M28 39 Q32 43 36 39" stroke="#3B281E" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <circle cx="20" cy="35" r="3" fill="#FF6B9D" opacity="0.45" />
          <circle cx="44" cy="35" r="3" fill="#FF6B9D" opacity="0.45" />
        </svg>
      </div>

      {/* Cute Kitty SVG (Pink accent) */}
      <div className="w-12 h-12 rounded-2xl bg-[#FFF0F6] border border-[#FFC4DC] flex items-center justify-center shadow-xs">
        <svg viewBox="0 0 64 64" className="w-9 h-9">
          <polygon points="14,28 16,12 28,20" fill="#FF6B9D" />
          <polygon points="50,28 48,12 36,20" fill="#FF6B9D" />
          <circle cx="32" cy="34" r="17" fill="#FFE8F0" />
          <circle cx="25" cy="31" r="3" fill="#2B2D42" />
          <circle cx="39" cy="31" r="3" fill="#2B2D42" />
          <circle cx="24" cy="30" r="1" fill="#FFFFFF" />
          <circle cx="38" cy="30" r="1" fill="#FFFFFF" />
          <polygon points="32,37 29,34 35,34" fill="#FF8A3D" />
          <path d="M28 40 Q32 43 36 40" stroke="#2B2D42" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      </div>

      {/* Cute Bunny SVG (Blue accent) */}
      <div className="w-12 h-12 rounded-2xl bg-[#EEF6FF] border border-[#BFE0FF] flex items-center justify-center shadow-xs">
        <svg viewBox="0 0 64 64" className="w-9 h-9">
          <ellipse cx="25" cy="15" rx="5" ry="12" fill="#FFFFFF" stroke="#4A90E2" strokeWidth="2" />
          <ellipse cx="39" cy="15" rx="5" ry="12" fill="#FFFFFF" stroke="#4A90E2" strokeWidth="2" />
          <ellipse cx="25" cy="16" rx="2.5" ry="8" fill="#FF9EBB" />
          <ellipse cx="39" cy="16" rx="2.5" ry="8" fill="#FF9EBB" />
          <circle cx="32" cy="36" r="16" fill="#FFFFFF" stroke="#4A90E2" strokeWidth="2" />
          <circle cx="26" cy="34" r="2.8" fill="#2B2D42" />
          <circle cx="38" cy="34" r="2.8" fill="#2B2D42" />
          <circle cx="32" cy="38" r="2.5" fill="#FF6B9D" />
          <circle cx="21" cy="38" r="3" fill="#FF6B9D" opacity="0.4" />
          <circle cx="43" cy="38" r="3" fill="#FF6B9D" opacity="0.4" />
        </svg>
      </div>
    </div>
  );
};
