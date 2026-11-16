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
  Scissors,
  Share2,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  PawPrint,
  SlidersHorizontal,
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

type MobileTab = 'timeline' | 'profile' | 'offspring' | 'health' | 'grooming';

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
  const [petInput, setPetInput] = useState<PetInputInfo>(() => {
    const defaultPreset = SAMPLE_PET_PRESETS[0];
    const presetPhoto = createSamplePresetPhoto(defaultPreset);
    return {
      name: defaultPreset.name,
      birthYear: defaultPreset.birthYear,
      birthMonth: defaultPreset.birthMonth,
      gender: defaultPreset.gender,
      breedHint: defaultPreset.breedHint,
      speciesHint: defaultPreset.species,
      photoDataUrl: presetPhoto,
      photoMimeType: 'image/jpeg',
    };
  });

  const [selectedPresetId, setSelectedPresetId] = useState<string>(SAMPLE_PET_PRESETS[0].id);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<PetTimeAnalysisResult | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedPetImages | null>(null);

  // Mobile-first tab navigation
  const [activeTab, setActiveTab] = useState<MobileTab>('profile');
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(2);
  const [customYearOffset, setCustomYearOffset] = useState<number>(3);
  const [customYearImageUrl, setCustomYearImageUrl] = useState<string>('');
  const [selectedHealthIdx, setSelectedHealthIdx] = useState<number>(0);
  const [checkedLongevityTips, setCheckedLongevityTips] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: false,
  });

  const [isResultCardOpen, setIsResultCardOpen] = useState<boolean>(false);
  const [showInputForm, setShowInputForm] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectPreset = (preset: SamplePetPreset) => {
    const photoUrl = createSamplePresetPhoto(preset);
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
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleStartTimeMachine = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!petInput.photoDataUrl) return;

    setIsLoading(true);
    setLoadingMessage('사진 속 외모 특징과 생애 주기를 분석하고 있어요...');

    try {
      const { result } = await analyzePetWithGemini(
        petInput,
        (msg) => setLoadingMessage(msg)
      );

      const images = await generatePetFutureImagesWithGemini(
        petInput,
        result,
        (msg) => setLoadingMessage(msg)
      );

      setAnalysisResult(result);
      setGeneratedImages(images);

      const defaultIdx = result.timelineStages.length > 2 ? 2 : 0;
      setSelectedStageIndex(defaultIdx);
      const initialOffset = result.timelineStages[defaultIdx]?.offsetYears ?? 3;
      setCustomYearOffset(initialOffset);
      setCustomYearImageUrl(
        images.perStageUrls[result.timelineStages[defaultIdx]?.id] || images.primeAdult
      );
      setSelectedHealthIdx(0);
      setActiveTab('profile');
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
        : customYearOffset <= 3
        ? 'prime'
        : customYearOffset <= 7
        ? 'mature'
        : 'senior';

    renderConsistentPetStagePhoto(
      generatedImages.original,
      stageType,
      customYearOffset,
      `${customYearOffset}년 후 (${targetYear}년)`,
      `${yrs}세 시절의 ${analysisResult.petName}`
    ).then((url) => {
      if (!cancelled) setCustomYearImageUrl(url);
    });

    return () => {
      cancelled = true;
    };
  }, [customYearOffset, analysisResult, generatedImages]);

  const handleSelectStageMilestone = (idx: number) => {
    if (!analysisResult) return;
    setSelectedStageIndex(idx);
    const stage = analysisResult.timelineStages[idx];
    if (stage) {
      setCustomYearOffset(stage.offsetYears);
    }
  };

  const currentSelectedStage =
    analysisResult?.timelineStages[selectedStageIndex] ||
    analysisResult?.timelineStages[0];

  const activeBonusYears = Object.values(checkedLongevityTips).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#F7F3EE] text-[#4A4E69] flex justify-center">
      {/* Mobile-First App Container (Centered smartphone view on desktop, 100% full width on mobile) */}
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
                  <span>다시하기</span>
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

          {/* Main Content Area */}
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
                      우리 아이 미래 타임머신
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
                    <span>우리 아이 미래 타임머신 가동하기</span>
                  </button>
                </div>
              </form>
            )}

            {/* 3. MOBILE RESULT DASHBOARD (Clean, Focused, Practical) */}
            {!isLoading && !showInputForm && analysisResult && generatedImages && currentSelectedStage && (
              <div className="space-y-4">
                {/* Always-Visible Compact Pet Summary Header Card */}
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
                    TAB 1: 수명 예측 & 프로필 (간단·명료·핵심만)
                ========================================================= */}
                {activeTab === 'profile' && (
                  <div className="space-y-3.5">
                    {/* Expected Together Year Highlight Card */}
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

                    {/* 2x2 Key Metrics */}
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

                    {/* Longevity Boosters Checklist */}
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

                    {/* Quick Button to Timeline */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('timeline')}
                      className="w-full py-3.5 rounded-[16px] bg-[#FFF2EF] text-[#FF7E67] font-extrabold text-sm border border-[#FFC5BB] cursor-pointer"
                    >
                      연도별 미래 성장·노화 모습 보러가기 →
                    </button>
                  </div>
                )}

                {/* =========================================================
                    TAB 2: 1년 단위 성장·노화 타임라인 & 비교 슬라이더
                ========================================================= */}
                {activeTab === 'timeline' && (
                  <div className="bg-white rounded-[20px] p-4 border border-[#FFE3DE] space-y-4">
                    {/* Quick Stage Chips */}
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

                    {/* 1-Year Granular Slider */}
                    <div className="p-3 rounded-[14px] bg-[#FFF9F0] border border-[#F9E4C8] space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-extrabold">
                        <span className="flex items-center gap-1 text-[#4A4E69]">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF7E67]" />
                          <span>1년 단위 이동</span>
                        </span>
                        <span className="text-[#FF7E67]">
                          {customYearOffset === 0
                            ? `현재 (${CURRENT_YEAR}년)`
                            : `${customYearOffset}년 후 (${CURRENT_YEAR + customYearOffset}년)`}
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

                    {/* Draggable Before & After Slider */}
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

                    {/* Concise Stage Summary & Pet Quote */}
                    <div className="p-3.5 rounded-[16px] bg-[#FFFDF9] border border-[#F3E3D3] space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-[#FF7E67]">
                          {currentSelectedStage.targetYear}년 ({currentSelectedStage.petAgeText})
                        </span>
                        <span className="text-[#6C708A]">{currentSelectedStage.humanAgeText}</span>
                      </div>
                      <p className="text-xs text-[#4A4E69] leading-relaxed">
                        {currentSelectedStage.physicalChangeDesc}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-[16px] bg-[#FFF2EF] border border-[#FFC5BB]">
                      <div className="text-[11px] font-extrabold text-[#FF7E67] mb-1">
                        💌 {currentSelectedStage.targetYear}년의 {analysisResult.petName} 한마디
                      </div>
                      <p className="text-xs font-bold text-[#4A4E69] leading-relaxed">
                        “{currentSelectedStage.petDiaryQuote}”
                      </p>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    TAB 3: 미래 2세(새끼) 예측 시뮬레이터
                ========================================================= */}
                {activeTab === 'offspring' && (
                  <div className="bg-white rounded-[20px] p-4 border border-[#FFE3DE] space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-extrabold text-[#4A4E69]">
                        만약 우리 아이가 2세를 낳는다면?
                      </h2>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#FFF8E6] text-[#D9822B]">
                        닮은꼴 {analysisResult.offspringPrediction.parentResemblanceScore}%
                      </span>
                    </div>

                    <div className="relative rounded-[20px] overflow-hidden border-2 border-[#FFC5BB] aspect-square w-full max-w-[300px] mx-auto">
                      <img
                        src={generatedImages.offspring}
                        alt="2세 예측 모습"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-3 right-3 w-16 h-16 rounded-full border-2 border-white shadow-md overflow-hidden bg-white">
                        <img
                          src={generatedImages.original}
                          alt="부모 원본"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-[16px] bg-[#FFF9F0] border border-[#F9E4C8] space-y-1.5">
                      <div className="text-sm font-extrabold text-[#4A4E69]">
                        🍼 애칭: {analysisResult.offspringPrediction.babyNickname}
                      </div>
                      <p className="text-xs text-[#4A4E69] leading-relaxed">
                        {analysisResult.offspringPrediction.furAndEyeDesc}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-[16px] bg-[#FFFDF9] border border-[#F3E3D3] space-y-2">
                      <div className="text-xs font-extrabold text-[#4A4E69]">
                        🧬 물려받은 외모 & 성격 포인트
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResult.offspringPrediction.personalityTraits.map((trait, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-full bg-[#FFF2EF] text-[#FF7E67] text-xs font-bold"
                          >
                            #{trait}
                          </span>
                        ))}
                      </div>
                      <ul className="space-y-1 pt-1">
                        {analysisResult.offspringPrediction.inheritedFeatures.map((feat, i) => (
                          <li key={i} className="text-xs text-[#4A4E69] flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#FF7E67] shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    TAB 4: 연도별 건강 주의보 & 예방 로드맵 (모바일 탭 선택형)
                ========================================================= */}
                {activeTab === 'health' && (
                  <div className="bg-white rounded-[20px] p-4 border border-[#FFE3DE] space-y-4">
                    <h2 className="text-base font-extrabold text-[#4A4E69]">
                      연도별 아플 곳 주의보 & 검진 로드맵
                    </h2>

                    {/* Year Selector Pills */}
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

                    {/* Selected Year Health Card */}
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

                {/* =========================================================
                    TAB 5: 미용·스타일링 & 케어 꿀팁 (간결·실용 요약)
                ========================================================= */}
                {activeTab === 'grooming' && (
                  <div className="bg-white rounded-[20px] p-4 border border-[#FFE3DE] space-y-3.5">
                    <h2 className="text-base font-extrabold text-[#4A4E69]">
                      맞춤 미용 · 목욕 주기 · 장수 놀이법
                    </h2>

                    {/* Brushing & Bathing Quick Box */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-[16px] bg-[#FFF9F0] border border-[#F9E4C8]">
                        <span className="text-[11px] font-extrabold text-[#FF7E67] block">
                          🪮 권장 빗질 주기
                        </span>
                        <span className="text-xs font-extrabold text-[#4A4E69] mt-1 block">
                          {analysisResult.groomingAndCare.brushingSchedule.frequency}
                        </span>
                        <span className="text-[11px] text-[#6C708A] mt-1 block">
                          {analysisResult.groomingAndCare.brushingSchedule.toolRecommendation}
                        </span>
                      </div>
                      <div className="p-3 rounded-[16px] bg-[#E8F6F5] border border-[#68B0AB]/30">
                        <span className="text-[11px] font-extrabold text-[#2F6F6B] block">
                          🛁 권장 목욕 주기
                        </span>
                        <span className="text-xs font-extrabold text-[#4A4E69] mt-1 block">
                          {analysisResult.groomingAndCare.bathingAndHygiene.frequency}
                        </span>
                        <span className="text-[11px] text-[#6C708A] mt-1 block">
                          36.5~37.5°C 미온수 케어
                        </span>
                      </div>
                    </div>

                    {/* Recommended Styles */}
                    <div className="space-y-2">
                      <div className="text-xs font-extrabold text-[#4A4E69]">
                        ✂️ 추천 스타일링 BEST 3
                      </div>
                      {analysisResult.groomingAndCare.recommendedStyles.map((st, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-[14px] bg-[#FFFDF9] border border-[#F3E3D3]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-[#4A4E69]">
                              {st.styleName}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF2EF] text-[#FF7E67]">
                              {st.suitabilityBadge}
                            </span>
                          </div>
                          <p className="text-xs text-[#6C708A] mt-1 leading-relaxed">
                            {st.tip}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Longevity Play & Environment Tips */}
                    <div className="space-y-2">
                      <div className="text-xs font-extrabold text-[#4A4E69]">
                        🎾 수명 늘리는 산책·놀이 꿀팁
                      </div>
                      {analysisResult.groomingAndCare.longevityPlayTips.map((play, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-[14px] bg-[#FFF2EF]/60 border border-[#FFE3DE]"
                        >
                          <div className="text-xs font-extrabold text-[#4A4E69]">
                            {play.title}
                          </div>
                          <p className="text-xs text-[#6C708A] mt-0.5 leading-relaxed">
                            {play.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        {/* Fixed Bottom Mobile Tab Bar (Shown when analysis results are active) */}
        {!isLoading && !showInputForm && analysisResult && (
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[460px] z-40 bg-white/95 backdrop-blur-md border-t border-[#FFE3DE] px-2 py-1.5 grid grid-cols-5 gap-1 shadow-[0_-4px_20px_rgba(74,78,105,0.08)]">
            {[
              { id: 'profile', label: '수명예측', icon: Heart },
              { id: 'timeline', label: '미래모습', icon: Clock },
              { id: 'offspring', label: '2세예측', icon: Baby },
              { id: 'health', label: '건강체크', icon: Stethoscope },
              { id: 'grooming', label: '케어꿀팁', icon: Scissors },
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
                  className={`py-2 rounded-[14px] flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                    active
                      ? 'bg-[#FFF2EF] text-[#FF7E67] font-extrabold'
                      : 'text-[#6C708A] font-semibold'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  <span className="text-[11px]">{tab.label}</span>
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
