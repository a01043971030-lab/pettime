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
    <div className="w-full select-none">
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-full aspect-square max-h-[420px] mx-auto rounded-[20px] overflow-hidden shadow-lg border-2 border-[#FFE3DE] cursor-ew-resize touch-none bg-[#FFF9F0]"
      >
        {/* Background: AFTER image (Future pet photo) */}
        <img
          src={afterImage}
          alt={afterLabel}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Foreground clipped: BEFORE image (Original pet photo) */}
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

        {/* Top-left & Top-right floating comparison badges */}
        <div className="absolute bottom-3 left-3 z-10 bg-[#4A4E69]/85 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
          BEFORE · {beforeLabel}
        </div>
        <div className="absolute bottom-3 right-3 z-10 bg-[#FF7E67]/95 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
          AFTER · {afterLabel}
        </div>

        {/* Vertical divider line & draggable handle */}
        <div
          className="absolute top-0 bottom-0 z-20 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.45)] pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#FF7E67] border-3 border-white shadow-lg flex items-center justify-center text-white transition-transform scale-100">
            <MoveHorizontal className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Helper caption & quick range slider for accessibility */}
      <div className="mt-2.5 flex items-center justify-between gap-3 px-1">
        <span className="text-xs font-medium text-[#6C708A]">
          👆 사진을 좌우로 드래그하여 현재 모습과 미래 모습을 비교해 보세요
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setSliderPos(85)}
            className="text-xs px-2.5 py-1 rounded-full bg-[#FFF2EF] text-[#4A4E69] hover:bg-[#FFE3DE] font-semibold transition"
          >
            원본 크게
          </button>
          <button
            type="button"
            onClick={() => setSliderPos(50)}
            className="text-xs px-2.5 py-1 rounded-full bg-[#FFF2EF] text-[#FF7E67] hover:bg-[#FFE3DE] font-semibold transition"
          >
            반반 비교
          </button>
          <button
            type="button"
            onClick={() => setSliderPos(15)}
            className="text-xs px-2.5 py-1 rounded-full bg-[#FF7E67] text-white hover:bg-[#F5644A] font-semibold transition"
          >
            미래 크게
          </button>
        </div>
      </div>
    </div>
  );
};
