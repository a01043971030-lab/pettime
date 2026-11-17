import React, { useEffect, useState } from 'react';
import { Sparkles, Clock } from 'lucide-react';
import { CutePetBannerIllustration } from './CuteMascotBadges';

interface LoadingTimeMachineProps {
  petName: string;
  progressText: string;
  photoPreviewUrl: string;
}

export const LoadingTimeMachine: React.FC<LoadingTimeMachineProps> = ({
  petName,
  photoPreviewUrl,
}) => {
  const [stepPercent, setStepPercent] = useState<number>(25);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setStepPercent((prev) => (prev < 92 ? prev + 10 : prev));
    }, 350);

    return () => {
      clearInterval(progressTimer);
    };
  }, []);

  return (
    <div className="w-full mx-auto my-4 bg-white rounded-[24px] p-6 shadow-md border border-[#FFD5B5] text-center space-y-4">
      <CutePetBannerIllustration />

      <div className="relative w-32 h-32 mx-auto">
        <div
          className="absolute inset-0 rounded-full border-4 border-dashed border-[#FF8A3D] animate-spin"
          style={{ animationDuration: '8s' }}
        />
        <img
          src={photoPreviewUrl}
          alt={petName}
          className="w-full h-full rounded-full object-cover p-2"
        />
        <div className="absolute -bottom-1 right-1 w-9 h-9 rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#4A90E2] text-white flex items-center justify-center shadow">
          <Clock className="w-4 h-4" />
        </div>
      </div>

      <h2 className="text-lg font-extrabold text-[#2B2D42] flex items-center justify-center gap-1.5">
        <Sparkles className="w-4 h-4 text-[#FF8A3D]" />
        <span>{petName} AI 분석 중...</span>
      </h2>

      <div className="w-full h-3 bg-[#FFF0F6] rounded-full overflow-hidden p-0.5">
        <div
          className="h-full rounded-full animate-shimmer transition-all duration-300"
          style={{ width: `${stepPercent}%` }}
        />
      </div>
    </div>
  );
};
