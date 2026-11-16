import React, { useEffect, useState } from 'react';
import { Sparkles, Clock, Heart } from 'lucide-react';
import { PET_TRIVIA_LIST } from '../data/petTriviaAndPresets';

interface LoadingTimeMachineProps {
  petName: string;
  progressText: string;
  photoPreviewUrl: string;
}

export const LoadingTimeMachine: React.FC<LoadingTimeMachineProps> = ({
  petName,
  progressText,
  photoPreviewUrl,
}) => {
  const [triviaIndex, setTriviaIndex] = useState<number>(0);
  const [stepPercent, setStepPercent] = useState<number>(18);

  useEffect(() => {
    const triviaTimer = setInterval(() => {
      setTriviaIndex((prev) => (prev + 1) % PET_TRIVIA_LIST.length);
    }, 3200);

    const progressTimer = setInterval(() => {
      setStepPercent((prev) => (prev < 92 ? prev + 7 : prev));
    }, 450);

    return () => {
      clearInterval(triviaTimer);
      clearInterval(progressTimer);
    };
  }, []);

  const currentTrivia = PET_TRIVIA_LIST[triviaIndex];

  return (
    <div className="w-full max-w-xl mx-auto my-6 bg-white rounded-[24px] p-6 sm:p-8 shadow-[0_18px_40px_-8px_rgba(74,78,105,0.12)] border border-[#FFE3DE] text-center">
      {/* Animated Pet Avatar inside Time Machine Ring */}
      <div className="relative w-36 h-36 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-dashed border-[#FF7E67] animate-spin" style={{ animationDuration: '9s' }} />
        <div className="absolute inset-2 rounded-full border-2 border-[#FFD166] animate-ping opacity-25" />
        <img
          src={photoPreviewUrl}
          alt={petName}
          className="w-full h-full rounded-full object-cover p-2.5"
        />
        <div className="absolute -bottom-2 right-1 w-10 h-10 rounded-full bg-[#FF7E67] text-white flex items-center justify-center shadow-md animate-bounce">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      {/* Status Headline */}
      <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFF2EF] text-[#FF7E67] text-xs font-bold mb-3">
        <Sparkles className="w-3.5 h-3.5" />
        <span>AI 반려동물 미래 타임머신 가동 중</span>
      </div>

      <h2 className="text-xl sm:text-2xl font-extrabold text-[#4A4E69] mb-2">
        {petName || '우리 아이'}의 시간 여행을 준비하고 있어요
      </h2>
      <p className="text-sm text-[#6C708A] font-medium mb-5 min-h-[2.5rem] flex items-center justify-center">
        {progressText}
      </p>

      {/* Smooth Progress Bar */}
      <div className="w-full h-3 bg-[#FFF2EF] rounded-full overflow-hidden mb-7 p-0.5">
        <div
          className="h-full rounded-full animate-shimmer transition-all duration-500"
          style={{ width: `${stepPercent}%` }}
        />
      </div>

      {/* Fun Pet Trivia Card */}
      <div className="bg-[#FFFDF9] rounded-[20px] p-5 border border-[#F9E4C8] text-left relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-[#FFF8E6] text-[#D9822B]">
            <span>{currentTrivia.emoji}</span>
            <span>기다리는 동안 보는 {currentTrivia.category}</span>
          </span>
          <span className="text-[11px] text-[#6C708A] font-medium">
            상식 {triviaIndex + 1} / {PET_TRIVIA_LIST.length}
          </span>
        </div>
        <h3 className="font-bold text-base text-[#4A4E69] mb-1.5 flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-[#FF7E67] fill-[#FF7E67] shrink-0" />
          <span>{currentTrivia.title}</span>
        </h3>
        <p className="text-xs sm:text-sm text-[#6C708A] leading-relaxed">
          {currentTrivia.fact}
        </p>
      </div>
    </div>
  );
};
