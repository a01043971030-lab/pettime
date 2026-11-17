import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  CheckCircle2,
  Pill,
  Scissors,
  Syringe,
  HeartPulse,
  Baby,
  Film,
} from 'lucide-react';
import { PetTimeAnalysisResult } from '../types';
import {
  analyzeUploadedPhotoColors,
  extractPartnerPetMedia,
} from '../utils/petImageProcessor';

export interface DailyCareMediaItem {
  id: string;
  dateStr: string;
  dataUrl: string;
  isFromVideo: boolean;
  memo: string;
  nutritionScore: number;
  coatGlossScore: number;
  bcsStage: number;
  pregnancyNote: string;
}

interface AutoCareSystemTabProps {
  analysisResult: PetTimeAnalysisResult;
  basePhotoUrl: string;
  dailyLogs: DailyCareMediaItem[];
  onAddDailyLog: (item: DailyCareMediaItem) => void;
  onGoToSnsStudio: () => void;
}

type CareSubSection = 'nutrition' | 'pregnancy' | 'supplements' | 'grooming_vaccine';

export const AutoCareSystemTab: React.FC<AutoCareSystemTabProps> = ({
  analysisResult,
  basePhotoUrl,
  dailyLogs,
  onAddDailyLog,
  onGoToSnsStudio,
}) => {
  const [activeSub, setActiveSub] = useState<CareSubSection>('nutrition');
  const [latestCheckPhoto, setLatestCheckPhoto] = useState<string>(
    dailyLogs[0]?.dataUrl || basePhotoUrl
  );
  const [isFromVideo, setIsFromVideo] = useState<boolean>(
    dailyLogs[0]?.isFromVideo || false
  );
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Input notes with faint placeholder that disappears when typed!
  const [dailyMemoInput, setDailyMemoInput] = useState<string>('');
  const [pregNoteInput, setPregNoteInput] = useState<string>('');
  const [customSupInput, setCustomSupInput] = useState<string>('');

  const [checkScores, setCheckScores] = useState({
    overallScore: 95,
    bcsLevel: 5,
    coatScore: 96,
    eyeCleanScore: 93,
    recommendedFoodGrams: analysisResult.species.includes('고양이') ? 55 : 110,
    recommendedWaterMl: analysisResult.species.includes('고양이') ? 210 : 320,
  });

  const [supplements, setSupplements] = useState([
    { id: 'sup-1', name: '🦠 유산균', time: '아침', done: true },
    { id: 'sup-2', name: '🐟 오메가-3', time: '저녁', done: true },
    { id: 'sup-3', name: '🦴 관절 영양제', time: '저녁', done: false },
    { id: 'sup-4', name: '👁️ 눈 루테인', time: '간식', done: false },
  ]);

  const [pregnancyMode, setPregnancyMode] = useState<'none' | 'suspected' | 'pregnant'>('none');
  const [pregnancyWeek, setPregnancyWeek] = useState<number>(4);

  const [groomingItems, setGroomingItems] = useState([
    { id: 'gr-1', label: '🪮 빗질 케어', dDay: '완료', done: true },
    { id: 'gr-2', label: '💧 눈·귀 세정', dDay: '오늘', done: false },
    { id: 'gr-3', label: '🐾 발바닥·발톱', dDay: 'D-3', done: false },
    { id: 'gr-4', label: '🛁 보습 목욕', dDay: 'D-9', done: false },
  ]);

  const [vaccines, setVaccines] = useState([
    { id: 'vac-1', name: '💊 심장사상충 · 구충', cycle: '매월', dDay: 'D-2', done: false },
    { id: 'vac-2', name: '💉 종합백신', cycle: '연 1회', dDay: '완료', done: true },
    { id: 'vac-3', name: '🛡️ 광견병 접종', cycle: '연 1회', dDay: 'D-45', done: true },
  ]);

  const cameraCaptureRef = useRef<HTMLInputElement | null>(null);
  const albumUploadRef = useRef<HTMLInputElement | null>(null);

  const handleDailyMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const extracted = await extractPartnerPetMedia(file, analysisResult.petName);
      const colorMetrics = await analyzeUploadedPhotoColors(extracted.photoDataUrl);

      const coatVal = colorMetrics.brightness === '밝은 톤' ? 97 : 95;
      const overallVal = Math.min(99, Math.max(88, Math.round((coatVal + 94) / 2)));

      setLatestCheckPhoto(extracted.photoDataUrl);
      setIsFromVideo(extracted.isFromVideo);
      setCheckScores((prev) => ({
        ...prev,
        overallScore: overallVal,
        coatScore: coatVal,
        eyeCleanScore: 94,
      }));

      const today = new Date();
      const dateStr = `${today.getMonth() + 1}/${today.getDate()}`;
      onAddDailyLog({
        id: `log-${Date.now()}`,
        dateStr,
        dataUrl: extracted.photoDataUrl,
        isFromVideo: extracted.isFromVideo,
        memo: dailyMemoInput.trim() || `${analysisResult.petName} ${overallVal}점`,
        nutritionScore: overallVal,
        coatGlossScore: coatVal,
        bcsStage: 5,
        pregnancyNote: pregnancyMode === 'pregnant' ? `${pregnancyWeek}주차` : '정상',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddSupplement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSupInput.trim()) return;
    setSupplements((prev) => [
      ...prev,
      {
        id: `sup-${Date.now()}`,
        name: `💊 ${customSupInput.trim()}`,
        time: '매일',
        done: true,
      },
    ]);
    setCustomSupInput('');
  };

  const remainingDays = Math.max(1, (9 - pregnancyWeek) * 7);
  const completedSupplements = supplements.filter((s) => s.done).length;

  return (
    <div className="space-y-2.5">
      {/* 1. COMPACT PHOTO/VIDEO CHECK CARD */}
      <div className="bg-white rounded-[20px] p-3.5 border border-[#FFD5B5] shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4 text-[#FF8A3D]" />
            <h2 className="text-sm font-extrabold text-[#2B2D42]">오늘 체크</h2>
          </div>
          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-[#EEF6FF] text-[#4A90E2]">
            종합 {checkScores.overallScore}점
          </span>
        </div>

        {/* Photo + 4 Visual Score Badges */}
        <div className="grid grid-cols-12 gap-2.5 items-center">
          <div
            onClick={() => cameraCaptureRef.current?.click()}
            className="col-span-5 relative aspect-square rounded-[16px] overflow-hidden border-2 border-[#FF8A3D] cursor-pointer active:scale-95 transition"
          >
            <img
              src={latestCheckPhoto}
              alt="오늘 체크"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full bg-[#2B2D42]/75 text-white text-[9px] font-bold">
              {isFromVideo ? '🎬영상' : '📷사진'}
            </div>
            <div className="absolute inset-x-0 bottom-0 py-1 bg-[#FF8A3D] text-white text-[10px] font-extrabold text-center">
              {isAnalyzing ? '분석중' : '사진변경'}
            </div>
          </div>

          <div className="col-span-7 grid grid-cols-2 gap-1.5 text-center">
            <div className="p-2 rounded-[14px] bg-[#EEF6FF] border border-[#BFE0FF]">
              <span className="text-[10px] text-[#4A90E2] font-bold block">⚖️ 체형</span>
              <span className="text-xs font-extrabold text-[#2B2D42] mt-0.5 block">표준(5/9)</span>
            </div>
            <div className="p-2 rounded-[14px] bg-[#FFF3E8] border border-[#FFD5B5]">
              <span className="text-[10px] text-[#FF8A3D] font-bold block">✨ 윤기</span>
              <span className="text-xs font-extrabold text-[#2B2D42] mt-0.5 block">{checkScores.coatScore}점</span>
            </div>
            <div className="p-2 rounded-[14px] bg-[#EEF6FF] border border-[#BFE0FF]">
              <span className="text-[10px] text-[#4A90E2] font-bold block">💧 위생</span>
              <span className="text-xs font-extrabold text-[#2B2D42] mt-0.5 block">{checkScores.eyeCleanScore}점</span>
            </div>
            <div className="p-2 rounded-[14px] bg-[#FFF0F6] border border-[#FFC4DC]">
              <span className="text-[10px] text-[#FF6B9D] font-bold block">🍼 임신</span>
              <span className="text-xs font-extrabold text-[#2B2D42] mt-0.5 block">
                {pregnancyMode === 'pregnant' ? `${pregnancyWeek}주차` : '정상'}
              </span>
            </div>
          </div>
        </div>

        {/* 3 Big Action Buttons: Orange / Blue / Pink */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => cameraCaptureRef.current?.click()}
            className="min-h-[44px] rounded-[12px] bg-[#FF8A3D] text-white font-extrabold text-xs flex items-center justify-center gap-1 active:scale-95 transition cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>촬영</span>
          </button>
          <button
            type="button"
            onClick={() => albumUploadRef.current?.click()}
            className="min-h-[44px] rounded-[12px] bg-[#EEF6FF] text-[#4A90E2] border border-[#BFE0FF] font-extrabold text-xs flex items-center justify-center gap-1 active:scale-95 transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>앨범</span>
          </button>
          <button
            type="button"
            onClick={onGoToSnsStudio}
            className="min-h-[44px] rounded-[12px] bg-[#FF6B9D] text-white font-extrabold text-xs flex items-center justify-center gap-1 active:scale-95 transition cursor-pointer"
          >
            <Film className="w-4 h-4" />
            <span>쇼츠제작</span>
          </button>
        </div>

        <input
          ref={cameraCaptureRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleDailyMediaUpload}
          className="hidden"
        />
        <input
          ref={albumUploadRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleDailyMediaUpload}
          className="hidden"
        />
      </div>

      {/* 2. 4-CATEGORY PILL BAR */}
      <div className="grid grid-cols-4 gap-1.5 bg-white p-1.5 rounded-[16px] border border-[#FFD5B5]">
        {[
          { id: 'nutrition', label: '🥗 사료·물' },
          { id: 'pregnancy', label: '🤰 임신' },
          { id: 'supplements', label: `💊 영양제(${completedSupplements})` },
          { id: 'grooming_vaccine', label: '✂️ 미용·접종' },
        ].map((item) => {
          const active = activeSub === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSub(item.id as CareSubSection)}
              className={`min-h-[40px] rounded-[12px] text-[11px] font-extrabold transition cursor-pointer ${
                active
                  ? 'bg-gradient-to-r from-[#FF8A3D] to-[#FF6B9D] text-white shadow-xs'
                  : 'text-[#4A4E69]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: 사료·물 (Minimal Text + Faint Placeholder Input) */}
      {activeSub === 'nutrition' && (
        <div className="bg-white rounded-[20px] p-3.5 border border-[#BFE0FF] space-y-2.5">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-3 rounded-[14px] bg-[#FFF3E8] border border-[#FFD5B5]">
              <span className="text-[11px] font-bold text-[#FF8A3D] block">🥣 권장 사료</span>
              <span className="text-lg font-extrabold text-[#2B2D42] mt-0.5 block">
                {pregnancyMode === 'pregnant'
                  ? Math.round(checkScores.recommendedFoodGrams * 1.3)
                  : checkScores.recommendedFoodGrams}g / 일
              </span>
            </div>
            <div className="p-3 rounded-[14px] bg-[#EEF6FF] border border-[#BFE0FF]">
              <span className="text-[11px] font-bold text-[#4A90E2] block">💧 권장 음수</span>
              <span className="text-lg font-extrabold text-[#2B2D42] mt-0.5 block">
                {checkScores.recommendedWaterMl}ml / 일
              </span>
            </div>
          </div>

          <input
            type="text"
            value={dailyMemoInput}
            onChange={(e) => setDailyMemoInput(e.target.value)}
            placeholder="오늘 식사량·음수량 메모 (적으면 안내글이 사라져요)"
            className="w-full min-h-[42px] px-3 rounded-[12px] bg-[#F8FAFC] border border-[#BFE0FF] text-xs font-bold text-[#2B2D42] placeholder:text-[#94A3B8] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#4A90E2]"
          />
        </div>
      )}

      {/* SUB-TAB 2: 임신 D-Day (Visual & Concise) */}
      {activeSub === 'pregnancy' && (
        <div className="bg-white rounded-[20px] p-3.5 border border-[#FFC4DC] space-y-2.5">
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'none', label: '일상' },
              { id: 'suspected', label: '임신 의심' },
              { id: 'pregnant', label: '임신 중' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPregnancyMode(m.id as 'none' | 'suspected' | 'pregnant')}
                className={`min-h-[40px] rounded-[12px] text-xs font-extrabold border transition cursor-pointer ${
                  pregnancyMode === m.id
                    ? 'bg-[#FF6B9D] text-white border-[#FF6B9D]'
                    : 'bg-[#FFF0F6] text-[#FF6B9D] border-[#FFC4DC]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {pregnancyMode === 'pregnant' && (
            <div className="p-3 rounded-[14px] bg-[#FFF0F6] border border-[#FFC4DC] space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="text-[#2B2D42]">🤰 임신 {pregnancyWeek}주차</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FF6B9D] text-white">
                  출산 D-{remainingDays}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={9}
                step={1}
                value={pregnancyWeek}
                onChange={(e) => setPregnancyWeek(Number(e.target.value))}
                className="w-full accent-[#FF6B9D] h-2 bg-white rounded-lg cursor-pointer"
              />
              <div className="grid grid-cols-2 gap-1.5 text-center text-xs">
                <div className="p-2 rounded-[10px] bg-white font-bold text-[#FF6B9D]">
                  {pregnancyWeek <= 3 ? '🍓 초기 착상기' : pregnancyWeek <= 6 ? '🍎 골격 성장기' : '🍼 출산 준비기'}
                </div>
                <div className="p-2 rounded-[10px] bg-white font-bold text-[#4A90E2]">
                  {pregnancyWeek <= 4 ? '초음파 검진' : 'X-ray 마릿수 확인'}
                </div>
              </div>
            </div>
          )}

          <input
            type="text"
            value={pregNoteInput}
            onChange={(e) => setPregNoteInput(e.target.value)}
            placeholder={
              pregnancyMode === 'suspected'
                ? '교배일·유두 핑크업·초음파 일정 메모 (교배 25일차 초음파 권장)'
                : '교배일·병원 검진일·몸무게 메모 (입력 시 사라짐)'
            }
            className="w-full min-h-[42px] px-3 rounded-[12px] bg-[#FFF8FB] border border-[#FFC4DC] text-xs font-bold text-[#2B2D42] placeholder:text-[#B08D9E] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]"
          />
        </div>
      )}

      {/* SUB-TAB 3: 영양제 (1-Tap Grid + Add Input) */}
      {activeSub === 'supplements' && (
        <div className="bg-white rounded-[20px] p-3.5 border border-[#FFD5B5] space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            {supplements.map((sup) => (
              <button
                key={sup.id}
                type="button"
                onClick={() =>
                  setSupplements((prev) =>
                    prev.map((item) =>
                      item.id === sup.id ? { ...item, done: !item.done } : item
                    )
                  )
                }
                className={`min-h-[48px] px-3 py-2 rounded-[14px] border flex items-center justify-between transition active:scale-95 cursor-pointer ${
                  sup.done
                    ? 'bg-[#FFF3E8] border-[#FF8A3D] text-[#2B2D42]'
                    : 'bg-white border-[#E2E8F0] text-[#94A3B8]'
                }`}
              >
                <span className="text-xs font-extrabold truncate">{sup.name}</span>
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    sup.done ? 'text-[#FF8A3D]' : 'text-[#CBD5E1]'
                  }`}
                />
              </button>
            ))}
          </div>

          <form onSubmit={handleAddSupplement} className="flex gap-1.5">
            <input
              type="text"
              value={customSupInput}
              onChange={(e) => setCustomSupInput(e.target.value)}
              placeholder="추가 영양제 입력 (예: 심장·신장 영양제)"
              className="flex-1 min-h-[40px] px-3 rounded-[12px] bg-[#FFFDF9] border border-[#FFD5B5] text-xs font-bold text-[#2B2D42] placeholder:text-[#94A3B8] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#FF8A3D]"
            />
            <button
              type="submit"
              className="px-3.5 rounded-[12px] bg-[#FF8A3D] text-white text-xs font-extrabold cursor-pointer"
            >
              추가
            </button>
          </form>
        </div>
      )}

      {/* SUB-TAB 4: 미용·접종 (Compact 1-Tap Badges) */}
      {activeSub === 'grooming_vaccine' && (
        <div className="bg-white rounded-[20px] p-3.5 border border-[#BFE0FF] space-y-2.5">
          <div className="grid grid-cols-2 gap-1.5">
            {groomingItems.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() =>
                  setGroomingItems((prev) =>
                    prev.map((item) =>
                      item.id === g.id
                        ? {
                            ...item,
                            done: !item.done,
                            dDay: !item.done ? '완료' : 'D-3',
                          }
                        : item
                    )
                  )
                }
                className={`min-h-[46px] px-2.5 py-2 rounded-[12px] border flex items-center justify-between transition active:scale-95 cursor-pointer ${
                  g.done
                    ? 'bg-[#EEF6FF] border-[#4A90E2]'
                    : 'bg-white border-[#E2E8F0]'
                }`}
              >
                <span className="text-xs font-extrabold text-[#2B2D42]">{g.label}</span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    g.done
                      ? 'bg-[#4A90E2] text-white'
                      : 'bg-[#FFF3E8] text-[#FF8A3D]'
                  }`}
                >
                  {g.dDay}
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-1.5 pt-1 border-t border-[#E2E8F0]">
            {vaccines.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() =>
                  setVaccines((prev) =>
                    prev.map((item) =>
                      item.id === v.id
                        ? {
                            ...item,
                            done: !item.done,
                            dDay: !item.done ? '완료' : 'D-2',
                          }
                        : item
                    )
                  )
                }
                className="w-full min-h-[42px] px-3 rounded-[12px] bg-[#F8FAFC] border border-[#BFE0FF] flex items-center justify-between active:scale-98 cursor-pointer"
              >
                <span className="text-xs font-extrabold text-[#2B2D42]">{v.name}</span>
                <span
                  className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                    v.done
                      ? 'bg-[#4A90E2] text-white'
                      : 'bg-[#FF6B9D] text-white'
                  }`}
                >
                  {v.dDay}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
