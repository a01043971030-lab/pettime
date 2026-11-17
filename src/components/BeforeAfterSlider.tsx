import React, { useState, useRef, useCallback } from 'react';
import { MoveHorizontal } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel: string;
  afterLabel: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel,
  afterLabel,
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPos(Math.max(4, Math.min(96, percent)));
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    updatePosition(e.clientX);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div className="w-full select-none space-y-2">
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-full aspect-square max-h-[340px] mx-auto rounded-[20px] overflow-hidden shadow-md border-2 border-[#FFD5B5] cursor-ew-resize touch-none bg-white"
      >
        <img
          src={afterImage}
          alt={afterLabel}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          <img
            src={beforeImage}
            alt={beforeLabel}
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        <div className="absolute bottom-2.5 left-2.5 z-10 bg-[#4A90E2]/90 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow">
          {beforeLabel}
        </div>
        <div className="absolute bottom-2.5 right-2.5 z-10 bg-[#FF8A3D]/95 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow">
          {afterLabel}
        </div>

        <div
          className="absolute top-0 bottom-0 z-20 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.4)] pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gradient-to-r from-[#FF8A3D] to-[#FF6B9D] border-2 border-white shadow-lg flex items-center justify-center text-white">
            <MoveHorizontal className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Minimal 3-Button Switcher */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => setSliderPos(88)}
          className="min-h-[38px] rounded-[12px] bg-[#EEF6FF] text-[#4A90E2] text-xs font-extrabold cursor-pointer active:scale-95 transition"
        >
          현재 크게
        </button>
        <button
          type="button"
          onClick={() => setSliderPos(50)}
          className="min-h-[38px] rounded-[12px] bg-[#FFF0F6] text-[#FF6B9D] text-xs font-extrabold cursor-pointer active:scale-95 transition"
        >
          반반 비교
        </button>
        <button
          type="button"
          onClick={() => setSliderPos(12)}
          className="min-h-[38px] rounded-[12px] bg-[#FF8A3D] text-white text-xs font-extrabold cursor-pointer active:scale-95 transition"
        >
          미래 크게
        </button>
      </div>
    </div>
  );
};
