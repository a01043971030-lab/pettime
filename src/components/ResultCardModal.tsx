import React, { useEffect, useState } from 'react';
import { Download, Share2, X, CheckCircle2, Sparkles } from 'lucide-react';
import { GeneratedPetImages, PetTimeAnalysisResult, TimelineStage } from '../types';
import { generateResultSummaryCardDataUrl } from '../utils/petImageProcessor';

interface ResultCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: PetTimeAnalysisResult;
  images: GeneratedPetImages;
  selectedStage: TimelineStage;
}

export const ResultCardModal: React.FC<ResultCardModalProps> = ({
  isOpen,
  onClose,
  result,
  images,
  selectedStage,
}) => {
  const [cardDataUrl, setCardDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [copiedMessage, setCopiedMessage] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setIsGenerating(true);
    generateResultSummaryCardDataUrl(result, images, selectedStage)
      .then((url) => {
        if (active) {
          setCardDataUrl(url);
          setIsGenerating(false);
        }
      })
      .catch(() => {
        if (active) setIsGenerating(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, result, images, selectedStage]);

  if (!isOpen) return null;

  const handleDownloadCard = () => {
    if (!cardDataUrl) return;
    const link = document.createElement('a');
    link.href = cardDataUrl;
    link.download = `펫타임_${result.petName}_미래타임머신_포토카드.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setCopiedMessage('고화질 결과 포토카드가 저장되었어요!');
    setTimeout(() => setCopiedMessage(''), 3000);
  };

  const handleShareCard = async () => {
    const shareText = `🐾 [펫타임 PetTime] ${result.petName}(${result.estimatedBreed})의 미래 타임머신 결과!\n✨ "${result.lifespanPrediction.headlineMessage}"\n💌 ${selectedStage.targetYear}년의 편지: "${selectedStage.petDiaryQuote}"`;
    try {
      if (navigator.share && cardDataUrl) {
        const res = await fetch(cardDataUrl);
        const blob = await res.blob();
        const file = new File([blob], `pettime_${result.petName}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `펫타임 - ${result.petName} 미래 타임머신`,
            text: shareText,
            files: [file],
          });
          return;
        }
        await navigator.share({
          title: `펫타임 - ${result.petName} 미래 타임머신`,
          text: shareText,
        });
        return;
      }
    } catch {
      // Fallback to clipboard copy
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedMessage('공유용 요약 문구가 클립보드에 복사되었어요! SNS에 붙여넣어 보세요.');
      setTimeout(() => setCopiedMessage(''), 3500);
    } catch {
      setCopiedMessage('아래 [이미지로 저장하기] 버튼을 눌러 포토카드를 소장해 보세요!');
      setTimeout(() => setCopiedMessage(''), 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2D42]/65 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FFFDF9] w-full max-w-lg rounded-[24px] shadow-2xl border border-[#FFE3DE] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#FFF2EF] to-[#FFF9F0] border-b border-[#FFE3DE] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FF7E67]" />
            <h3 className="font-bold text-lg text-[#4A4E69]">
              {result.petName}의 미래 타임머신 포토카드
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#FFE3DE]/60 text-[#4A4E69] transition"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body preview */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col items-center">
          {isGenerating ? (
            <div className="py-20 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full border-4 border-[#FFE3DE] border-t-[#FF7E67] animate-spin" />
              <p className="text-sm font-semibold text-[#4A4E69]">
                예쁜 한 장의 추억 포토카드로 디자인하고 있어요...
              </p>
            </div>
          ) : (
            <div className="w-full rounded-[20px] overflow-hidden shadow-md border border-[#F3E3D3] bg-white">
              <img
                src={cardDataUrl}
                alt={`${result.petName} 결과 카드`}
                className="w-full h-auto object-contain"
              />
            </div>
          )}

          {copiedMessage && (
            <div className="mt-3 w-full px-4 py-2.5 rounded-xl bg-[#E8F6F5] text-[#2F6F6B] text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{copiedMessage}</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-white border-t border-[#FFE3DE] grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleDownloadCard}
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-[16px] bg-[#FF7E67] hover:bg-[#F5644A] text-white font-bold text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>포토카드 이미지 저장</span>
          </button>
          <button
            type="button"
            onClick={handleShareCard}
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-[16px] bg-[#FFF2EF] hover:bg-[#FFE3DE] text-[#FF7E67] font-bold text-sm border border-[#FFC5BB] transition disabled:opacity-50 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>SNS 공유 / 문구 복사</span>
          </button>
        </div>
      </div>
    </div>
  );
};
