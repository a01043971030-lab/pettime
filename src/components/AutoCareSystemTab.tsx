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
  AlertCircle,
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

  const [checkScores, setCheckScores] = useState({
    overallScore: 95,
    bcsLevel: 5,
    bcsText: '표준 체형 (BCS 5/9)',
    coatScore: 96,
    eyeCleanScore: 93,
    recommendedFoodGrams: analysisResult.species.includes('고양이') ? 55 : 110,
    recommendedWaterMl: analysisResult.species.includes('고양이') ? 210 : 320,
  });

  // 1. 영양제 (Supplements)
  const [supplements, setSupplements] = useState([
    { id: 'sup-1', name: '장 면역 유산균', time: '아침', done: true },
    { id: 'sup-2', name: '피모·혈행 오메가-3', time: '저녁', done: true },
    { id: 'sup-3', name: '슬개골·관절 영양제', time: '저녁', done: false },
    { id: 'sup-4', name: '루테인 눈 영양제', time: '간식', done: false },
  ]);

  // 2. 임신상태 정밀 관리
  const [pregnancyMode, setPregnancyMode] = useState<'none' | 'suspected' | 'pregnant'>('none');
  const [pregnancyWeek, setPregnancyWeek] = useState<number>(4);

  // 3. 미용 (Grooming)
  const [groomingItems, setGroomingItems] = useState([
    { id: 'gr-1', label: '빗질 & 털 엉킴 케어', dDay: '완료', done: true },
    { id: 'gr-2', label: '눈가·귀 위생 세정', dDay: '오늘 권장', done: false },
    { id: 'gr-3', label: '발바닥 털·발톱 정리', dDay: 'D-3', done: false },
    { id: 'gr-4', label: '저자극 보습 목욕', dDay: 'D-9', done: false },
  ]);

  // 4. 예방접종 & 구충
  const [vaccines, setVaccines] = useState([
    { id: 'vac-1', name: '심장사상충 & 내외부 구충', cycle: '매월 15일', dDay: 'D-2 필수', done: false },
    { id: 'vac-2', name: '종합백신 (DHPPL)', cycle: '연 1회', dDay: '접종 완료', done: true },
    { id: 'vac-3', name: '광견병 예방접종', cycle: '연 1회', dDay: 'D-45', done: true },
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
        bcsText: '표준 체형 (BCS 5/9)',
      }));

      const today = new Date();
      const dateStr = `${today.getMonth() + 1}월 ${today.getDate()}일`;
      onAddDailyLog({
        id: `log-${Date.now()}`,
        dateStr,
        dataUrl: extracted.photoDataUrl,
        isFromVideo: extracted.isFromVideo,
        memo: `${analysisResult.petName} 오늘 컨디션 ${overallVal}점`,
        nutritionScore: overallVal,
        coatGlossScore: coatVal,
        bcsStage: 5,
        pregnancyNote:
          pregnancyMode === 'pregnant'
            ? `임신 ${pregnancyWeek}주차`
            : '정상',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPregnancyWeekGuide = (week: number) => {
    const remainingDays = Math.max(1, (9 - week) * 7);
    if (week <= 3) {
      return {
        dDayText: `출산 D-${remainingDays} (초기 착상기)`,
        fetusSize: '산딸기~포도알 크기 (신경계 형성)',
        photoAnalysis: '유두가 분홍빛으로 뚜렷해지는 초기 체형입니다.',
        careTip: '격렬한 점프를 피하고 산모용 엽산·고단백 식단을 급여하세요.',
        checkup: '교배 25~28일차 병원 초음파로 아기집 확인 권장',
      };
    } else if (week <= 6) {
      return {
        dDayText: `출산 D-${remainingDays} (중기 성장기)`,
        fetusSize: '호두~작은 사과 크기 (골격 급성장)',
        photoAnalysis: '배 라인이 둥글게 불러오며 유선이 발달하는 시기입니다.',
        careTip: '급여량을 1.3배로 늘리고 자견/자묘용 고영양 사료로 전환하세요.',
        checkup: '중기 초음파로 태아 심박수 및 건강 체크',
      };
    } else {
      return {
        dDayText: `출산 임박 D-${remainingDays} (후기 준비기)`,
        fetusSize: '골격 완성 및 태동 감지 시기',
        photoAnalysis: '복부가 뚜렷하게 팽창하고 출산 준비가 완료된 체형입니다.',
        careTip: '하루 4~5회 소량씩 자주 급여하고 조용한 출산실을 준비하세요.',
        checkup: '임신 55~58일경 X-ray 촬영으로 정확한 태아 마릿수 확인 필수!',
      };
    }
  };

  const pregGuide = getPregnancyWeekGuide(pregnancyWeek);
  const completedSupplements = supplements.filter((s) => s.done).length;

  return (
    <div className="space-y-3">
      {/* 1. MOBILE CAMERA & ALBUM INSTANT AI CHECKUP CARD */}
      <div className="bg-white rounded-[20px] p-3.5 border border-[#FFE3DE] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4 text-[#FF7E67]" />
            <h2 className="text-sm font-extrabold text-[#4A4E69]">
              오늘 사진·영상 AI 종합 판독
            </h2>
          </div>
          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-[#E8F6F5] text-[#2F6F6B]">
            종합 {checkScores.overallScore}점
          </span>
        </div>

        {/* Photo + 4 Key Scores */}
        <div className="grid grid-cols-12 gap-2.5 items-center bg-[#FFFDF9] p-2.5 rounded-[16px] border border-[#F3E3D3]">
          <div
            onClick={() => cameraCaptureRef.current?.click()}
            className="col-span-5 relative aspect-square rounded-[14px] overflow-hidden border-2 border-[#FF7E67] cursor-pointer active:scale-95 transition"
          >
            <img
              src={latestCheckPhoto}
              alt="오늘의 체크"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full bg-[#2B2D42]/80 text-white text-[9px] font-bold">
              {isFromVideo ? '🎬 영상' : '📷 사진'}
            </div>
            <div className="absolute inset-x-0 bottom-0 py-1 bg-[#FF7E67]/95 text-white text-[10px] font-extrabold text-center">
              {isAnalyzing ? '판독 중...' : '터치 재촬영'}
            </div>
          </div>

          <div className="col-span-7 grid grid-cols-2 gap-1.5 text-center">
            <div className="p-2 rounded-[12px] bg-white border border-[#FFE3DE]">
              <span className="text-[10px] text-[#6C708A] font-bold block">영양·체형</span>
              <span className="text-xs font-extrabold text-[#2F6F6B] mt-0.5 block">5/9 표준</span>
            </div>
            <div className="p-2 rounded-[12px] bg-white border border-[#FFE3DE]">
              <span className="text-[10px] text-[#6C708A] font-bold block">피모 윤기</span>
              <span className="text-xs font-extrabold text-[#FF7E67] mt-0.5 block">{checkScores.coatScore}점</span>
            </div>
            <div className="p-2 rounded-[12px] bg-white border border-[#FFE3DE]">
              <span className="text-[10px] text-[#6C708A] font-bold block">눈·귀 위생</span>
              <span className="text-xs font-extrabold text-[#4A4E69] mt-0.5 block">{checkScores.eyeCleanScore}점</span>
            </div>
            <div className="p-2 rounded-[12px] bg-[#FFF9F0] border border-[#F9E4C8]">
              <span className="text-[10px] text-[#6C708A] font-bold block">임신·복부</span>
              <span className="text-xs font-extrabold text-[#D9822B] mt-0.5 block">
                {pregnancyMode === 'pregnant' ? `${pregnancyWeek}주차` : '정상'}
              </span>
            </div>
          </div>
        </div>

        {/* Big Mobile Buttons: Direct Camera vs Phone Gallery vs 1-Touch Shorts */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => cameraCaptureRef.current?.click()}
            className="min-h-[46px] px-2 rounded-[14px] bg-[#FF7E67] text-white font-extrabold text-xs shadow-xs flex items-center justify-center gap-1 active:scale-95 transition cursor-pointer"
          >
            <Camera className="w-4 h-4 shrink-0" />
            <span>카메라 촬영</span>
          </button>
          <button
            type="button"
            onClick={() => albumUploadRef.current?.click()}
            className="min-h-[46px] px-2 rounded-[14px] bg-[#FFF2EF] text-[#FF7E67] border border-[#FFC5BB] font-extrabold text-xs flex items-center justify-center gap-1 active:scale-95 transition cursor-pointer"
          >
            <Upload className="w-4 h-4 shrink-0" />
            <span>사진·영상 선택</span>
          </button>
          <button
            type="button"
            onClick={onGoToSnsStudio}
            className="min-h-[46px] px-2 rounded-[14px] bg-[#4A4E69] text-white font-extrabold text-xs flex items-center justify-center gap-1 active:scale-95 transition cursor-pointer"
          >
            <Film className="w-4 h-4 text-[#FFD166] shrink-0" />
            <span>쇼츠 만들기</span>
          </button>
        </div>

        {/* Hidden Mobile Inputs */}
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

      {/* 2. ONE-HANDED 4-CATEGORY PILL BAR (Zero Long Scrolling on Phone!) */}
      <div className="grid grid-cols-4 gap-1.5 bg-white p-1.5 rounded-[16px] border border-[#FFE3DE]">
        {[
          { id: 'nutrition', label: '🥗 영양·사료' },
          { id: 'pregnancy', label: '🤰 임신관리' },
          { id: 'supplements', label: `💊 영양제(${completedSupplements}/4)` },
          { id: 'grooming_vaccine', label: '✂️ 미용·접종' },
        ].map((item) => {
          const active = activeSub === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSub(item.id as CareSubSection)}
              className={`min-h-[42px] rounded-[12px] text-[11px] font-extrabold transition cursor-pointer ${
                active
                  ? 'bg-[#FF7E67] text-white shadow-xs'
                  : 'bg-transparent text-[#4A4E69]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: 영양상태 & 오늘 급여량 */}
      {activeSub === 'nutrition' && (
        <div className="bg-white rounded-[20px] p-4 border border-[#FFE3DE] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#4A4E69]">
              🥗 영양상태 판독 & 오늘 급여 가이드
            </h3>
            <span className="text-xs font-extrabold text-[#2F6F6B]">
              {checkScores.bcsText}
            </span>
          </div>

          <div className="p-3 rounded-[14px] bg-[#FFFDF9] border border-[#F3E3D3] space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-[#6C708A]">
              <span>저체중(1~3)</span>
              <span className="text-[#2F6F6B] font-extrabold">★ 이상적 표준(4~5)</span>
              <span>과체중(6~9)</span>
            </div>
            <div className="grid grid-cols-9 gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <div
                  key={n}
                  className={`h-2.5 rounded-full ${
                    n === 5
                      ? 'bg-[#FF7E67] ring-2 ring-[#FFC5BB]'
                      : n === 4 || n === 6
                      ? 'bg-[#68B0AB]/60'
                      : 'bg-[#E8E2DC]'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-[14px] bg-[#FFF9F0] border border-[#F9E4C8]">
              <span className="text-[11px] font-bold text-[#6C708A] block">
                오늘 권장 사료량
              </span>
              <span className="text-base font-extrabold text-[#FF7E67] mt-0.5 block">
                하루 {pregnancyMode === 'pregnant' ? Math.round(checkScores.recommendedFoodGrams * 1.3) : checkScores.recommendedFoodGrams}g
              </span>
              <span className="text-[10px] text-[#6C708A] block mt-0.5">
                아침·저녁 2~3회 나누어 급여
              </span>
            </div>
            <div className="p-3.5 rounded-[14px] bg-[#E8F6F5] border border-[#68B0AB]/30">
              <span className="text-[11px] font-bold text-[#6C708A] block">
                오늘 권장 음수량
              </span>
              <span className="text-base font-extrabold text-[#2F6F6B] mt-0.5 block">
                하루 {checkScores.recommendedWaterMl}ml
              </span>
              <span className="text-[10px] text-[#6C708A] block mt-0.5">
                신선한 물 수시 보충
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: 임신상태 정밀 관리 */}
      {activeSub === 'pregnancy' && (
        <div className="bg-white rounded-[20px] p-4 border border-[#FFE3DE] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#4A4E69] flex items-center gap-1.5">
              <Baby className="w-4 h-4 text-[#FF7E67]" />
              <span>임신상태 정밀 관리 & 출산 D-Day</span>
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'none', label: '일상(비임신)' },
              { id: 'suspected', label: '임신 의심' },
              { id: 'pregnant', label: '임신 집중관리' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPregnancyMode(m.id as 'none' | 'suspected' | 'pregnant')}
                className={`min-h-[42px] px-2 rounded-[12px] text-xs font-extrabold border transition cursor-pointer ${
                  pregnancyMode === m.id
                    ? 'bg-[#FF7E67] text-white border-[#FF7E67]'
                    : 'bg-[#FFFDF9] text-[#4A4E69] border-[#FFE3DE]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {pregnancyMode === 'none' && (
            <div className="p-3.5 rounded-[14px] bg-[#FFFDF9] border border-[#F3E3D3] text-xs text-[#6C708A] leading-relaxed">
              <strong className="text-[#4A4E69] block mb-1">
                ✓ 사진 판독 결과: 복부 팽창 없는 건강한 일상 체형입니다.
              </strong>
              교배 후이거나 임신 시 <strong>[임신 의심]</strong> 또는 <strong>[임신 집중관리]</strong>를 터치하면 주수별 태아 크기·출산 D-Day·산모 영양을 자동 관리합니다.
            </div>
          )}

          {pregnancyMode === 'suspected' && (
            <div className="p-3.5 rounded-[14px] bg-[#FFF9F0] border border-[#F9E4C8] space-y-1.5 text-xs text-[#4A4E69]">
              <div className="font-extrabold text-[#FF7E67] flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                <span>초기 임신 판독 핵심 포인트</span>
              </div>
              <p className="text-[#6C708A] leading-relaxed">
                • <strong>유두 핑크업:</strong> 교배 2~3주 후 유두가 선명한 분홍빛으로 커집니다.
              </p>
              <p className="text-[#6C708A] leading-relaxed">
                • <strong>초음파 검진일:</strong> 교배 후 <strong>25~28일차</strong>에 병원 초음파로 아기집을 확인하세요.
              </p>
            </div>
          )}

          {pregnancyMode === 'pregnant' && (
            <div className="p-3.5 rounded-[16px] bg-[#FFF2EF]/70 border border-[#FFC5BB] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#4A4E69]">
                  임신 <strong className="text-[#FF7E67]">{pregnancyWeek}주차 (약 {pregnancyWeek * 7}일)</strong>
                </span>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-[#FF7E67] text-white">
                  {pregGuide.dDayText}
                </span>
              </div>

              <input
                type="range"
                min={1}
                max={9}
                step={1}
                value={pregnancyWeek}
                onChange={(e) => setPregnancyWeek(Number(e.target.value))}
                className="w-full accent-[#FF7E67] h-2.5 bg-white rounded-lg cursor-pointer"
              />

              <div className="p-3 rounded-[12px] bg-white border border-[#FFE3DE] space-y-1.5 text-xs">
                <div>
                  <strong className="text-[#FF7E67]">🍼 태아 크기:</strong>{' '}
                  <span className="text-[#4A4E69] font-semibold">{pregGuide.fetusSize}</span>
                </div>
                <div>
                  <strong className="text-[#2F6F6B]">🥗 산모 영양:</strong>{' '}
                  <span className="text-[#4A4E69]">{pregGuide.careTip}</span>
                </div>
                <div className="pt-1 border-t border-[#F3E3D3] text-[#DC4B31] font-bold">
                  🩺 필수 검진: {pregGuide.checkup}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: 오늘의 맞춤 영양제 원터치 체크 */}
      {activeSub === 'supplements' && (
        <div className="bg-white rounded-[20px] p-4 border border-[#FFE3DE] space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#4A4E69] flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-[#FF7E67]" />
              <span>오늘의 영양제 (터치하여 복용 체크)</span>
            </h3>
            <span className="text-xs font-extrabold text-[#FF7E67]">
              {completedSupplements}/{supplements.length} 완료
            </span>
          </div>

          <div className="space-y-2">
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
                className={`w-full min-h-[50px] flex items-center justify-between px-3.5 py-2.5 rounded-[14px] border transition active:scale-[0.98] cursor-pointer ${
                  sup.done
                    ? 'bg-[#FFF2EF]/70 border-[#FFC5BB]'
                    : 'bg-[#FFFDF9] border-[#F3E3D3]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2
                    className={`w-5 h-5 shrink-0 ${
                      sup.done ? 'text-[#FF7E67]' : 'text-[#C8C2BC]'
                    }`}
                  />
                  <span
                    className={`text-xs font-extrabold ${
                      sup.done ? 'text-[#4A4E69]' : 'text-[#6C708A]'
                    }`}
                  >
                    {sup.name}
                  </span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white text-[#6C708A] border border-[#E8E2DC]">
                  {sup.done ? '복용완료' : sup.time}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: 미용·위생 & 예방접종 자동 알리미 */}
      {activeSub === 'grooming_vaccine' && (
        <div className="bg-white rounded-[20px] p-4 border border-[#FFE3DE] space-y-3.5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-extrabold text-[#4A4E69] flex items-center gap-1">
                <Scissors className="w-3.5 h-3.5 text-[#FF7E67]" />
                <span>미용 · 위생 체크 (터치 완료)</span>
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
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
                  className={`min-h-[56px] p-2.5 rounded-[14px] border text-left transition active:scale-95 cursor-pointer ${
                    g.done
                      ? 'bg-[#E8F6F5] border-[#68B0AB]/40'
                      : 'bg-[#FFFDF9] border-[#F3E3D3]'
                  }`}
                >
                  <span
                    className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full mb-1 ${
                      g.done
                        ? 'bg-[#2F6F6B] text-white'
                        : 'bg-[#FFF2EF] text-[#FF7E67]'
                    }`}
                  >
                    {g.dDay}
                  </span>
                  <div className="text-xs font-extrabold text-[#4A4E69]">
                    {g.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-[#F3E3D3]">
            <h3 className="text-xs font-extrabold text-[#4A4E69] flex items-center gap-1 mb-2">
              <Syringe className="w-3.5 h-3.5 text-[#FF7E67]" />
              <span>예방접종 · 구충 스케줄</span>
            </h3>
            <div className="space-y-1.5">
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
                              dDay: !item.done ? '접종 완료' : 'D-2 필수',
                            }
                          : item
                      )
                    )
                  }
                  className="w-full min-h-[48px] flex items-center justify-between px-3 py-2 rounded-[12px] bg-[#FFFDF9] border border-[#F3E3D3] active:scale-[0.98] cursor-pointer"
                >
                  <div className="text-left">
                    <div className="text-xs font-extrabold text-[#4A4E69]">
                      {v.name}
                    </div>
                    <div className="text-[10px] text-[#6C708A]">{v.cycle}</div>
                  </div>
                  <span
                    className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                      v.done
                        ? 'bg-[#E8F6F5] text-[#2F6F6B]'
                        : 'bg-[#FFF2EF] text-[#FF7E67]'
                    }`}
                  >
                    {v.dDay}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
