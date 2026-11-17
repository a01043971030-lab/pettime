import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Heart,
  Calendar,
  Clock,
  Baby,
  Stethoscope,
  Share2,
  RotateCcw,
  ShieldAlert,
  PawPrint,
  SlidersHorizontal,
  HeartPulse,
  Film,
} from 'lucide-react';
import {
  GeneratedPetImages,
  PetInputInfo,
  PetSpeciesCategory,
  PetTimeAnalysisResult,
} from './types';
import { SAMPLE_PET_PRESETS, SamplePetPreset } from './data/petTriviaAndPresets';
import {
  createSamplePresetPhoto,
  renderConsistentPetStagePhoto,
} from './utils/petImageProcessor';
import {
  analyzePetWithGemini,
  generatePetFutureImagesWithGemini,
} from './services/geminiPetService';
import { BeforeAfterSlider } from './components/BeforeAfterSlider';
import { LoadingTimeMachine } from './components/LoadingTimeMachine';
import { ResultCardModal } from './components/ResultCardModal';
import { OffspringSimulatorTab } from './components/OffspringSimulatorTab';
import { AutoCareSystemTab, DailyCareMediaItem } from './components/AutoCareSystemTab';
import { DailyAlbumSnsTab } from './components/DailyAlbumSnsTab';

type MobileTab = 'timeline' | 'offspring' | 'autocare' | 'sns' | 'profile' | 'health';

const SPECIES_OPTIONS: (PetSpeciesCategory | '자동 분석')[] = [
  '자동 분석',
  '강아지',
  '고양이',
  '토끼',
  '햄스터/소동물',
  '새/앵무',
  '파충류/거북이',
  '기타 반려동물',
];

const CURRENT_YEAR = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: 26 }, (_, i) => CURRENT_YEAR - i);
const BIRTH_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function App() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(SAMPLE_PET_PRESETS[0].id);

  const [petInput, setPetInput] = useState<PetInputInfo>(() => {
    const defaultPreset = SAMPLE_PET_PRESETS[0];
    const presetPhoto = createSamplePresetPhoto(defaultPreset, 0);
    return {
      name: defaultPreset.name,
      birthYear: defaultPreset.birthYear,
      birthMonth: defaultPreset.birthMonth,
      gender: defaultPreset.gender,
      breedHint: defaultPreset.breedHint,
      speciesHint: defaultPreset.species,
      photoDataUrl: presetPhoto,
      photoMimeType: 'image/jpeg',
      presetId: defaultPreset.id,
    };
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<PetTimeAnalysisResult | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedPetImages | null>(null);

  const [activeTab, setActiveTab] = useState<MobileTab>('autocare');
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(4);
  const [customYearOffset, setCustomYearOffset] = useState<number>(8);
  const [customYearImageUrl, setCustomYearImageUrl] = useState<string>('');
  const [selectedHealthIdx, setSelectedHealthIdx] = useState<number>(0);
  const [checkedLongevityTips, setCheckedLongevityTips] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: false,
  });

  // Daily Care & SNS Shorts Media Log
  const [dailyLogs, setDailyLogs] = useState<DailyCareMediaItem[]>([]);

  const [isResultCardOpen, setIsResultCardOpen] = useState<boolean>(false);
  const [showInputForm, setShowInputForm] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectPreset = (preset: SamplePetPreset) => {
    const photoUrl = createSamplePresetPhoto(preset, 0);
    setSelectedPresetId(preset.id);
    setPetInput({
      name: preset.name,
      birthYear: preset.birthYear,
      birthMonth: preset.birthMonth,
      gender: preset.gender,
      breedHint: preset.breedHint,
      speciesHint: preset.species,
      photoDataUrl: photoUrl,
      photoMimeType: 'image/jpeg',
      presetId: preset.id,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSelectedPresetId('custom');
      setPetInput((prev) => ({
        ...prev,
        photoDataUrl: dataUrl,
        photoMimeType: file.type || 'image/jpeg',
        presetId: 'custom',
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleStartTimeMachine = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!petInput.photoDataUrl) return;

    setIsLoading(true);
    setLoadingMessage('사진 속 외모·영양 상태와 생애 주기를 정밀 분석하고 있어요...');

    try {
      const inputWithPreset: PetInputInfo = {
        ...petInput,
        presetId: selectedPresetId,
      };

      const { result } = await analyzePetWithGemini(
        inputWithPreset,
        (msg) => setLoadingMessage(msg)
      );

      const images = await generatePetFutureImagesWithGemini(
        inputWithPreset,
        result,
        (msg) => setLoadingMessage(msg)
      );

      setAnalysisResult(result);
      setGeneratedImages(images);

      // Initialize Daily Logs with today's checkup & milestone snapshots so SNS Shorts works immediately
      const today = new Date();
      const dateStr = `${today.getMonth() + 1}월 ${today.getDate()}일`;
      setDailyLogs([
        {
          id: 'log-init-1',
          dateStr,
          dataUrl: images.original,
          isFromVideo: false,
          memo: `${result.petName} 오늘의 건강·영양 체크 완료`,
          nutritionScore: 96,
          coatGlossScore: 97,
          bcsStage: 5,
          pregnancyNote: '정상',
        },
        {
          id: 'log-init-2',
          dateStr: '성년기 예측',
          dataUrl: images.primeAdult,
          isFromVideo: false,
          memo: `${result.petName} 전성기 모습`,
          nutritionScore: 98,
          coatGlossScore: 98,
          bcsStage: 5,
          pregnancyNote: '정상',
        },
        {
          id: 'log-init-3',
          dateStr: '2세 아기',
          dataUrl: images.offspring,
          isFromVideo: false,
          memo: `${result.petName} 2세 예측 스냅`,
          nutritionScore: 99,
          coatGlossScore: 99,
          bcsStage: 5,
          pregnancyNote: '정상',
        },
      ]);

      const defaultIdx = result.timelineStages.length > 4 ? 4 : result.timelineStages.length - 1;
      setSelectedStageIndex(defaultIdx);
      const initialOffset = result.timelineStages[defaultIdx]?.offsetYears ?? 8;
      setCustomYearOffset(initialOffset);
      setCustomYearImageUrl(
        images.perStageUrls[result.timelineStages[defaultIdx]?.id] || images.senior
      );
      setSelectedHealthIdx(0);
      setActiveTab('autocare');
      setShowInputForm(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!analysisResult || !generatedImages) return;
    let cancelled = false;

    const matchingStage = analysisResult.timelineStages.find(
      (s) => s.offsetYears === customYearOffset
    );
    if (matchingStage && generatedImages.perStageUrls[matchingStage.id]) {
      setCustomYearImageUrl(generatedImages.perStageUrls[matchingStage.id]);
      return;
    }

    const targetYear = CURRENT_YEAR + customYearOffset;
    const totalMonths = analysisResult.currentAgeMonths + customYearOffset * 12;
    const yrs = Math.floor(totalMonths / 12);
    const stageType =
      customYearOffset === 0
        ? 'current'
        : customYearOffset <= 4
        ? 'prime'
        : customYearOffset <= 7
        ? 'mature'
        : 'senior';

    renderConsistentPetStagePhoto(
      generatedImages.original,
      stageType,
      customYearOffset,
      `${customYearOffset}년 후 (${targetYear}년)`,
      `${yrs}세 시절의 ${analysisResult.petName}`,
      selectedPresetId
    ).then((url) => {
      if (!cancelled) setCustomYearImageUrl(url);
    });

    return () => {
      cancelled = true;
    };
  }, [customYearOffset, analysisResult, generatedImages, selectedPresetId]);

  const handleSelectStageMilestone = (idx: number) => {
    if (!analysisResult) return;
    setSelectedStageIndex(idx);
    const stage = analysisResult.timelineStages[idx];
    if (stage) {
      setCustomYearOffset(stage.offsetYears);
    }
  };

  const handleAddDailyLog = (item: DailyCareMediaItem) => {
    setDailyLogs((prev) => [item, ...prev]);
  };

  const currentSelectedStage =
    analysisResult?.timelineStages[selectedStageIndex] ||
    analysisResult?.timelineStages[0];

  const activeBonusYears = Object.values(checkedLongevityTips).filter(Boolean).length;

  const exactSliderYear = CURRENT_YEAR + customYearOffset;
  const exactTotalMonths = (analysisResult?.currentAgeMonths || 12) + customYearOffset * 12;
  const exactYears = Math.floor(exactTotalMonths / 12);
  const exactRemMonths = exactTotalMonths % 12;
  const exactPetAgeText =
    exactYears > 0
      ? exactRemMonths > 0
        ? `${exactYears}세 ${exactRemMonths}개월`
        : `${exactYears}세`
      : `${exactTotalMonths}개월`;

  const baseHumanAge =
    Number(analysisResult?.humanAgeEquivalent.replace(/[^0-9]/g, '')) || 24;
  const exactHumanAge =
    baseHumanAge +
    customYearOffset * (analysisResult?.species.includes('햄스터') ? 16 : 4);

  return (
    <div className="min-h-screen bg-[#F7F3EE] text-[#4A4E69] flex justify-center">
      <div className="w-full max-w-[460px] min-h-screen bg-[#FFFDF9] shadow-[0_0_40px_rgba(74,78,105,0.08)] flex flex-col justify-between pb-24">
        <div>
          {/* Compact Mobile Header */}
          <header className="sticky top-0 z-30 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#FFE3DE] px-4 py-3 flex items-center justify-between">
            <div
              onClick={() => {
                if (analysisResult) setShowInputForm(false);
              }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-[10px] bg-[#FF7E67] flex items-center justify-center text-white shadow-xs">
                <PawPrint className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-[#4A4E69]">
                펫타임 <span className="text-[#FF7E67]">PetTime</span>
              </span>
            </div>

            {analysisResult && !showInputForm && !isLoading && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowInputForm(true)}
                  className="px-2.5 py-1.5 rounded-full bg-[#FFF2EF] text-[#4A4E69] text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#FF7E67]" />
                  <span>처음으로</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsResultCardOpen(true)}
                  className="px-3 py-1.5 rounded-full bg-[#FF7E67] text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>카드저장</span>
                </button>
              </div>
            )}
          </header>

          <main className="px-4 pt-4 space-y-4">
            {/* 1. LOADING SCREEN */}
            {isLoading && (
              <LoadingTimeMachine
                petName={petInput.name}
                progressText={loadingMessage}
                photoPreviewUrl={petInput.photoDataUrl}
              />
            )}

            {/* 2. MOBILE INPUT SCREEN */}
            {!isLoading && (showInputForm || !analysisResult) && (
              <form onSubmit={handleStartTimeMachine} className="space-y-4">
                <div className="bg-white rounded-[20px] p-4 shadow-[0_6px_20px_-4px_rgba(74,78,105,0.06)] border border-[#FFE3DE] space-y-4">
                  <div className="flex items-center justify-between">
                    <h1 className="text-lg font-extrabold text-[#4A4E69]">
                      AI 반려동물 자동케어 & 타임머신
                    </h1>
                    {analysisResult && (
                      <button
                        type="button"
                        onClick={() => setShowInputForm(false)}
                        className="text-xs font-bold text-[#FF7E67] underline cursor-pointer"
                      >
                        이전 결과 보기
                      </button>
                    )}
                  </div>

                  {/* Large Touch-Friendly Photo Box */}
                  <div className="relative rounded-[20px] overflow-hidden border-2 border-dashed border-[#FFA090] bg-[#FFFDF9] aspect-square w-full max-h-[280px] mx-auto flex flex-col items-center justify-center">
                    <img
                      src={petInput.photoDataUrl}
                      alt="반려동물 사진"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-[#2B2D42]/85 via-[#2B2D42]/45 to-transparent grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="py-2.5 rounded-[12px] bg-[#FF7E67] text-white text-xs font-extrabold shadow flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>카메라 촬영</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="py-2.5 rounded-[12px] bg-white text-[#4A4E69] text-xs font-extrabold shadow flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-[#FF7E67]" />
                        <span>앨범 선택</span>
                      </button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {/* Quick 1-Tap Sample Chips */}
                  <div>
                    <span className="block text-[11px] font-bold text-[#6C708A] mb-1.5">
                      샘플로 바로 테스트
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {SAMPLE_PET_PRESETS.map((preset) => {
                        const isSelected = selectedPresetId === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleSelectPreset(preset)}
                            className={`py-2 px-1 rounded-[12px] text-xs font-bold border text-center transition cursor-pointer ${
                              isSelected
                                ? 'bg-[#FF7E67] text-white border-[#FF7E67]'
                                : 'bg-[#FFFDF9] text-[#4A4E69] border-[#FFE3DE]'
                            }`}
                          >
                            {preset.avatarEmoji} {preset.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Required: Birth Year & Month */}
                  <div className="p-3.5 rounded-[16px] bg-[#FFF9F0] border border-[#F9E4C8]">
                    <label className="flex items-center gap-1.5 text-xs font-extrabold text-[#FF7E67] mb-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>태어난 연도 · 월</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={petInput.birthYear}
                        onChange={(e) =>
                          setPetInput((prev) => ({
                            ...prev,
                            birthYear: Number(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-3 rounded-[12px] bg-white border border-[#FFC5BB] text-sm font-extrabold text-[#4A4E69] focus:outline-none focus:ring-2 focus:ring-[#FF7E67]"
                      >
                        {BIRTH_YEARS.map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}년생
                          </option>
                        ))}
                      </select>
                      <select
                        value={petInput.birthMonth}
                        onChange={(e) =>
                          setPetInput((prev) => ({
                            ...prev,
                            birthMonth: Number(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-3 rounded-[12px] bg-white border border-[#FFC5BB] text-sm font-extrabold text-[#4A4E69] focus:outline-none focus:ring-2 focus:ring-[#FF7E67]"
                      >
                        {BIRTH_MONTHS.map((m) => (
                          <option key={m} value={m}>
                            {m}월생
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Compact Optional Info Row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-[#6C708A] mb-1">
                        이름 (선택)
                      </label>
                      <input
                        type="text"
                        value={petInput.name}
                        onChange={(e) =>
                          setPetInput((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="보리"
                        className="w-full px-2.5 py-2.5 rounded-[12px] bg-[#FFFDF9] border border-[#E8D8C8] text-xs font-bold text-[#4A4E69] focus:outline-none focus:ring-2 focus:ring-[#FF7E67]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#6C708A] mb-1">
                        동물 종류
                      </label>
                      <select
                        value={petInput.speciesHint}
                        onChange={(e) =>
                          setPetInput((prev) => ({
                            ...prev,
                            speciesHint: e.target.value as PetSpeciesCategory | '자동 분석',
                          }))
                        }
                        className="w-full px-2 py-2.5 rounded-[12px] bg-[#FFFDF9] border border-[#E8D8C8] text-xs font-bold text-[#4A4E69] focus:outline-none focus:ring-2 focus:ring-[#FF7E67]"
                      >
                        {SPECIES_OPTIONS.map((sp) => (
                          <option key={sp} value={sp}>
                            {sp}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#6C708A] mb-1">
                        성별 (선택)
                      </label>
                      <select
                        value={petInput.gender}
                        onChange={(e) =>
                          setPetInput((prev) => ({
                            ...prev,
                            gender: e.target.value as PetInputInfo['gender'],
                          }))
                        }
                        className="w-full px-2 py-2.5 rounded-[12px] bg-[#FFFDF9] border border-[#E8D8C8] text-xs font-bold text-[#4A4E69] focus:outline-none focus:ring-2 focus:ring-[#FF7E67]"
                      >
                        <option value="선택 안 함">미선택</option>
                        <option value="여아">여아 ♀</option>
                        <option value="남아">남아 ♂</option>
                        <option value="중성화 완료">중성화</option>
                      </select>
                    </div>
                  </div>

                  {/* Start CTA Button */}
                  <button
                    type="submit"
                    className="w-full py-4 rounded-[18px] bg-[#FF7E67] hover:bg-[#F5644A] text-white font-extrabold text-base shadow-[0_8px_20px_-4px_rgba(255,126,103,0.5)] flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>AI 자동 관리 & 미래 타임머신 시작하기</span>
                  </button>
                </div>
              </form>
            )}

            {/* 3. MOBILE RESULT DASHBOARD */}
            {!isLoading && !showInputForm && analysisResult && generatedImages && currentSelectedStage && (
              <div className="space-y-4">
                {/* Compact Pet Summary Header Card */}
                <div className="bg-white rounded-[20px] p-3.5 border border-[#FFE3DE] shadow-xs flex items-center gap-3">
                  <img
                    src={generatedImages.original}
                    alt={analysisResult.petName}
                    className="w-14 h-14 rounded-[14px] object-cover border border-[#FFC5BB] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-base text-[#4A4E69] truncate">
                        {analysisResult.petName}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FFF2EF] text-[#FF7E67] shrink-0">
                        {analysisResult.estimatedBreed}
                      </span>
                    </div>
                    <p className="text-xs text-[#6C708A] font-medium mt-0.5">
                      현재 {analysisResult.currentAgeLabel} · {analysisResult.humanAgeEquivalent}
                    </p>
                  </div>
                </div>

                {/* =========================================================
                    TAB: 자동케어 (영양제·미용·예방접종·영양상태·임신상태 정밀 관리)
                ========================================================= */}
                {activeTab === 'autocare' && (
                  <AutoCareSystemTab
                    analysisResult={analysisResult}
                    basePhotoUrl={generatedImages.original}
                    dailyLogs={dailyLogs}
                    onAddDailyLog={handleAddDailyLog}
                    onGoToSnsStudio={() => {
                      setActiveTab('sns');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                )}

                {/* =========================================================
                    TAB: SNS쇼츠 (그날그날 사진·영상 원터치 앨범 & 유튜브 쇼츠)
                ========================================================= */}
                {activeTab === 'sns' && (
                  <DailyAlbumSnsTab
                    analysisResult={analysisResult}
                    dailyLogs={dailyLogs}
                    onAddDailyLog={handleAddDailyLog}
                  />
                )}

                {/* =========================================================
                    TAB: 미래모습 (1년 단위 성장·노화 타임라인 & 비교 슬라이더)
                ========================================================= */}
                {activeTab === 'timeline' && (
                  <div className="bg-white rounded-[20px] p-4 border border-[#FFE3DE] space-y-4">
                    <div className="grid grid-cols-3 gap-1.5">
                      {analysisResult.timelineStages.map((stage, idx) => {
                        const isSelected =
                          selectedStageIndex === idx && customYearOffset === stage.offsetYears;
                        return (
                          <button
                            key={stage.id}
                            type="button"
                            onClick={() => handleSelectStageMilestone(idx)}
                            className={`py-2 px-2 rounded-[12px] text-center border text-xs font-extrabold transition cursor-pointer ${
                              isSelected
                                ? 'bg-[#FF7E67] text-white border-[#FF7E67]'
                                : 'bg-[#FFFDF9] text-[#4A4E69] border-[#FFE3DE]'
                            }`}
                          >
                            <div>{stage.label}</div>
                            <div
                              className={`text-[10px] font-medium ${
                                isSelected ? 'text-[#FFF2EF]' : 'text-[#6C708A]'
                              }`}
                            >
                              {stage.targetYear}년 · {stage.petAgeText.split(' ')[0]}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-3 rounded-[14px] bg-[#FFF9F0] border border-[#F9E4C8] space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-extrabold">
                        <span className="flex items-center gap-1 text-[#4A4E69]">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF7E67]" />
                          <span>1년 단위 이동</span>
                        </span>
                        <span className="text-[#FF7E67]">
                          {customYearOffset === 0
                            ? `현재 (${CURRENT_YEAR}년)`
                            : `${customYearOffset}년 후 (${exactSliderYear}년)`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={15}
                        step={1}
                        value={customYearOffset}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCustomYearOffset(val);
                          const nearestIdx = analysisResult.timelineStages.reduce(
                            (bestIdx, st, curIdx, arr) =>
                              Math.abs(st.offsetYears - val) <
                              Math.abs(arr[bestIdx].offsetYears - val)
                                ? curIdx
                                : bestIdx,
                            0
                          );
                          setSelectedStageIndex(nearestIdx);
                        }}
                        className="w-full accent-[#FF7E67] h-2 bg-[#FFE3DE] rounded-lg cursor-pointer"
                      />
                    </div>

                    <BeforeAfterSlider
                      beforeImage={generatedImages.original}
                      afterImage={
                        customYearImageUrl ||
                        generatedImages.perStageUrls[currentSelectedStage.id] ||
                        generatedImages.senior
                      }
                      beforeLabel="현재"
                      afterLabel={
                        customYearOffset === 0 ? '현재' : `${customYearOffset}년 후`
                      }
                    />

                    <div className="p-3.5 rounded-[16px] bg-[#FFFDF9] border border-[#F3E3D3] space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-[#FF7E67]">
                          {exactSliderYear}년 ({exactPetAgeText})
                        </span>
                        <span className="text-[#6C708A]">사람 나이 약 {exactHumanAge}세</span>
                      </div>
                      <p className="text-xs text-[#4A4E69] leading-relaxed">
                        {currentSelectedStage.physicalChangeDesc}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-[16px] bg-[#FFF2EF] border border-[#FFC5BB]">
                      <div className="text-[11px] font-extrabold text-[#FF7E67] mb-1">
                        💌 {exactSliderYear}년의 {analysisResult.petName} 한마디
                      </div>
                      <p className="text-xs font-bold text-[#4A4E69] leading-relaxed">
                        “{currentSelectedStage.petDiaryQuote}”
                      </p>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    TAB: 2세예측 (상대 펫 업로드 + 사진 5장 + 3초 영상!)
                ========================================================= */}
                {activeTab === 'offspring' && (
                  <OffspringSimulatorTab
                    analysisResult={analysisResult}
                    parent1PhotoUrl={generatedImages.original}
                  />
                )}

                {/* =========================================================
                    TAB: 수명예측 & 프로필
                ========================================================= */}
                {activeTab === 'profile' && (
                  <div className="space-y-3.5">
                    <div className="rounded-[20px] bg-gradient-to-br from-[#FF7E67] to-[#F5644A] text-white p-5 shadow-md space-y-2">
                      <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20">
                        품종 평균 수명 {analysisResult.lifespanPrediction.breedAverageYears} 기준
                      </span>
                      <h2 className="text-xl font-extrabold leading-snug">
                        “{analysisResult.lifespanPrediction.expectedTogetherYear + activeBonusYears}년까지 건강하게 함께할 수 있어요!”
                      </h2>
                      <p className="text-xs text-[#FFF2EF] leading-relaxed">
                        꾸준한 관리 시 평균보다 <strong>+{activeBonusYears}년</strong> 더 오래 행복하게 함께할 수 있어요.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-white p-3.5 rounded-[16px] border border-[#FFE3DE]">
                        <span className="text-[11px] text-[#6C708A] font-semibold block">추정 품종</span>
                        <span className="text-sm font-extrabold text-[#4A4E69] mt-0.5 block">
                          {analysisResult.estimatedBreed}
                        </span>
                      </div>
                      <div className="bg-white p-3.5 rounded-[16px] border border-[#FFE3DE]">
                        <span className="text-[11px] text-[#6C708A] font-semibold block">현재 나이</span>
                        <span className="text-sm font-extrabold text-[#FF7E67] mt-0.5 block">
                          {analysisResult.currentAgeLabel}
                        </span>
                      </div>
                      <div className="bg-white p-3.5 rounded-[16px] border border-[#FFE3DE]">
                        <span className="text-[11px] text-[#6C708A] font-semibold block">사람 나이 환산</span>
                        <span className="text-sm font-extrabold text-[#4A4E69] mt-0.5 block">
                          {analysisResult.humanAgeEquivalent}
                        </span>
                      </div>
                      <div className="bg-white p-3.5 rounded-[16px] border border-[#FFE3DE]">
                        <span className="text-[11px] text-[#6C708A] font-semibold block">남은 행복 시간</span>
                        <span className="text-sm font-extrabold text-[#2F6F6B] mt-0.5 block">
                          약 {analysisResult.lifespanPrediction.remainingHappyYears + activeBonusYears}년 이상
                        </span>
                      </div>
                    </div>

                    <div className="bg-white rounded-[20px] p-4 border border-[#FFE3DE] space-y-2.5">
                      <h3 className="text-xs font-extrabold text-[#4A4E69]">
                        ✅ 수명을 늘리는 3가지 실천 (터치 시 예상 연도 반영)
                      </h3>
                      {analysisResult.lifespanPrediction.keyLongevityFactors.map((factor, idx) => {
                        const checked = Boolean(checkedLongevityTips[idx]);
                        return (
                          <label
                            key={idx}
                            className="flex items-center gap-2.5 p-3 rounded-[14px] bg-[#FFFDF9] border border-[#F3E3D3] cursor-pointer text-xs font-bold text-[#4A4E69]"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setCheckedLongevityTips((prev) => ({
                                  ...prev,
                                  [idx]: !prev[idx],
                                }))
                              }
                              className="w-4 h-4 accent-[#FF7E67]"
                            />
                            <span>{factor}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* =========================================================
                    TAB: 연도별 건강 주의보 & 맞춤 미용 로드맵
                ========================================================= */}
                {activeTab === 'health' && (
                  <div className="bg-white rounded-[20px] p-4 border border-[#FFE3DE] space-y-4">
                    <h2 className="text-base font-extrabold text-[#4A4E69]">
                      연도별 아플 곳 주의보 & 검진 로드맵
                    </h2>

                    <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                      {analysisResult.healthRoadmap.map((item, idx) => {
                        const active = selectedHealthIdx === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedHealthIdx(idx)}
                            className={`shrink-0 px-3 py-2 rounded-[12px] text-xs font-extrabold border transition cursor-pointer ${
                              active
                                ? 'bg-[#FF7E67] text-white border-[#FF7E67]'
                                : 'bg-[#FFFDF9] text-[#4A4E69] border-[#FFE3DE]'
                            }`}
                          >
                            <div>{item.year}년</div>
                            <div className={`text-[10px] ${active ? 'text-[#FFF2EF]' : 'text-[#6C708A]'}`}>
                              {item.petAge}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {analysisResult.healthRoadmap[selectedHealthIdx] && (() => {
                      const h = analysisResult.healthRoadmap[selectedHealthIdx];
                      return (
                        <div className="space-y-3">
                          <div className="p-3.5 rounded-[16px] bg-[#FFF2EF] border border-[#FFC5BB]">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-extrabold text-[#4A4E69] flex items-center gap-1">
                                <ShieldAlert className="w-4 h-4 text-[#FF7E67]" />
                                <span>{h.year}년 ({h.petAge}) 집중 주의 부위</span>
                              </span>
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-[#FF7E67]">
                                {h.riskLevel}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {h.vulnerableParts.map((part, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-1 rounded-full bg-white text-[#FF7E67] text-xs font-extrabold border border-[#FFC5BB]"
                                >
                                  {part}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="p-3.5 rounded-[16px] bg-[#FFFDF9] border border-[#F3E3D3] space-y-1.5">
                            <div className="text-xs font-extrabold text-[#4A4E69]">
                              ⚠️ 주의 질환
                            </div>
                            {h.geneticAndAgeRisks.map((r, i) => (
                              <p key={i} className="text-xs text-[#6C708A] leading-relaxed">
                                • {r}
                              </p>
                            ))}
                          </div>

                          <div className="p-3.5 rounded-[16px] bg-[#FFFDF9] border border-[#F3E3D3] space-y-1.5">
                            <div className="text-xs font-extrabold text-[#2F6F6B]">
                              🩺 필수 건강검진 항목
                            </div>
                            {h.essentialCheckups.map((c, i) => (
                              <p key={i} className="text-xs text-[#4A4E69] leading-relaxed">
                                • {c}
                              </p>
                            ))}
                          </div>

                          <div className="p-3.5 rounded-[16px] bg-[#FFF9F0] border border-[#F9E4C8] text-xs text-[#4A4E69] leading-relaxed">
                            <strong className="text-[#FF7E67] block mb-0.5">
                              🥗 맞춤 사료·영양제 팁
                            </strong>
                            {h.nutritionAndCareGuide}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        {/* Fixed Bottom 6-Tab Mobile Bar */}
        {!isLoading && !showInputForm && analysisResult && (
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[460px] z-40 bg-white/95 backdrop-blur-md border-t border-[#FFE3DE] px-1.5 py-1.5 grid grid-cols-6 gap-1 shadow-[0_-4px_20px_rgba(74,78,105,0.08)]">
            {[
              { id: 'autocare', label: '자동케어', icon: HeartPulse },
              { id: 'sns', label: 'SNS쇼츠', icon: Film },
              { id: 'timeline', label: '미래모습', icon: Clock },
              { id: 'offspring', label: '2세예측', icon: Baby },
              { id: 'profile', label: '수명예측', icon: Heart },
              { id: 'health', label: '건강체크', icon: Stethoscope },
            ].map((tab) => {
              const IconComp = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id as MobileTab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`py-2 rounded-[12px] flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                    active
                      ? 'bg-[#FFF2EF] text-[#FF7E67] font-extrabold'
                      : 'text-[#6C708A] font-semibold'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  <span className="text-[10px] tracking-tight">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* Result Photo Card Save/Share Modal */}
      {analysisResult && generatedImages && currentSelectedStage && (
        <ResultCardModal
          isOpen={isResultCardOpen}
          onClose={() => setIsResultCardOpen(false)}
          result={analysisResult}
          images={generatedImages}
          selectedStage={currentSelectedStage}
        />
      )}
    </div>
  );
}
export default App;
