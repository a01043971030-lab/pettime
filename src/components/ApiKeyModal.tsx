import React, { useState } from 'react';
import { KeyRound, X, Check, ShieldCheck, ExternalLink } from 'lucide-react';
import { getSavedApiKey, saveApiKey } from '../services/geminiPetService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (hasKey: boolean) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [keyInput, setKeyInput] = useState<string>(() => getSavedApiKey());

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveApiKey(keyInput);
    onSaved(Boolean(keyInput.trim()));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2D42]/60 backdrop-blur-sm">
      <div className="bg-[#FFFDF9] w-full max-w-md rounded-[24px] shadow-2xl border border-[#FFE3DE] overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-[#FFF2EF] to-[#FFF9F0] border-b border-[#FFE3DE] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#FF7E67]" />
            <h3 className="font-bold text-base text-[#4A4E69]">Gemini AI API 키 설정</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#FFE3DE]/60 text-[#4A4E69]"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="p-3.5 rounded-[16px] bg-[#FFF9F0] border border-[#F9E4C8] text-xs text-[#4A4E69] leading-relaxed space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#FF7E67]">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>실시간 Gemini 2.5 비전 분석 & 이미지 생성 연동</span>
            </div>
            <p className="text-[#6C708A]">
              Google AI Studio에서 발급받은 Gemini API 키를 입력하시면 <code>@google/genai</code> SDK를 통해{' '}
              <strong>gemini-2.5-flash</strong> 멀티모달 분석과 미래·2세 이미지 생성을 실시간으로 수행합니다.
              (API 키가 없거나 할당량 초과 시에도 내장된 스마트 사진 노화 시뮬레이션 엔진으로 모든 기능을 100% 체험하실 수 있어요!)
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A4E69] mb-1.5">
              Gemini API Key
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy... 형태의 API 키를 입력해 주세요"
              className="w-full px-4 py-3 rounded-[14px] border border-[#FFC5BB] bg-white text-sm text-[#4A4E69] focus:outline-none focus:ring-2 focus:ring-[#FF7E67]"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#FF7E67] font-semibold hover:underline"
            >
              <span>Google AI Studio에서 무료 키 발급받기</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            {keyInput && (
              <button
                type="button"
                onClick={() => setKeyInput('')}
                className="text-[#6C708A] hover:text-[#4A4E69] underline"
              >
                키 지우기
              </button>
            )}
          </div>

          <div className="pt-2 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-[14px] bg-[#FFF2EF] text-[#4A4E69] font-bold text-sm hover:bg-[#FFE3DE] transition cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-[14px] bg-[#FF7E67] text-white font-bold text-sm hover:bg-[#F5644A] shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>저장하기</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
