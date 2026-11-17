import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Heart,
  Calendar,
  Clock,
  Baby,
  Share2,
  RotateCcw,
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
import { CutePetBannerIllustration } from './components/CuteMascotBadges';

type MobileTab = 'autocare' | 'sns' | 'timeline' | 'offspring' | 'longevity_health';

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

  // Input starts with empty text fields so faint placeholder guide text shows and disappears when user types!
  const [petInput, setPetInput] = useState<PetInputInfo>(() => {
    const defaultPreset = SAMPLE_PET_PRESETS[0];
    const presetPhoto = createSamplePresetPhoto(defaultPreset, 0);
    return {
      name: '',
      birthYear: defaultPreset.birthYear,
      birthMonth: defaultPreset.birthMonth,
      gender: defaultPreset.gender,
      breedHint: '',
      speciesHint: defaultPreset.species,
      photoDataUrl: presetPhoto,
      photoMimeType: 'image/jpeg',
      presetId: defaultPreset.id,
    };
  });

  const [futureDiaryInput, setFutureDiaryInput] = useState<string>('');
  const [healthMemoInput, setHealthMemoInput] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<PetTimeAnalysisResult | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedPetImages | null>(null);

  const [activeTab, setActiveTab] = useState<MobileTab>('autocare');
  const [healthSubTab, setHealthSubTab] = useState<'lifespan' | 'roadmap'>('lifespan');
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(4);
  const [customYearOffset, setCustomYearOffset] = useState<number>(8);
  const [customYearImageUrl, setCustomYearImageUrl] = useState<string>('');
  const [selectedHealthIdx, setSelectedHealthIdx] = useState<number>(0);
  const [checkedLongevityTips, setCheckedLongevityTips] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: false,
  });

  const [dailyLogs, setDailyLogs] = useState<DailyCareMediaItem[]>([]);
  const [isResultCardOpen, setIsResultCardOpen] = useState<boolean>(false);
  const [showInputForm, setShowInputForm] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectPreset = (preset: SamplePetPreset) => {
    const photoUrl = createSamplePresetPhoto(preset, 0);
    setSelectedPresetId(preset.id);
    setPetInput({
      name: '',
      birthYear: preset.birthYear,
      birthMonth: preset.birthMonth,
      gender: preset.gender,
      breedHint: '',
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
    setLoadingMessage('AI 분석 중...');

    try {
      const activePreset = SAMPLE_PET_PRESETS.find((p) => p.id === selectedPresetId);
      const effectiveName = petInput.name.trim() || activePreset?.name || '우리 아이';
      const effectiveBreed = petInput.breedHint.trim() || activePreset?.breedHint || '';

      const inputWithPreset: PetInputInfo = {
        ...petInput,
        name: effectiveName,
        breedHint: effectiveBreed,
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

      const today = new Date();
      const dateStr = `${today.getMonth() + 1}/${today.getDate()}`;
      setDailyLogs([
        {
          id: 'log-init-1',
          dateStr,
          dataUrl: images.original,
          isFromVideo: false,
          memo: `${result.petName}`,
          nutritionScore: 96,
          coatGlossScore: 97,
          bcsStage: 5,
          pregnancyNote: '정상',
        },
        {
          id: 'log-init-2',
          dateStr: '성년기',
          dataUrl: images.primeAdult,
          isFromVideo: false,
          memo: `${result.petName}`,
          nutritionScore: 98,
          coatGlossScore: 98,
          bcsStage: 5,
          pregnancyNote: '정상',
        },
        {
          id: 'log-init-3',
          dateStr: '2세예측',
          dataUrl: images.offspring,
          isFromVideo: false,
          memo: `${result.petName}`,
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

  const activePresetForPlaceholder = SAMPLE_PET_PRESETS.find((p) => p.id === selectedPresetId);

  return (
    <div className="min-h-screen flex justify-center">
      {/* Smartphone Shell with Orange + Pink + Blue + White Theme */}
      <div className="w-full max-w-[440px] min-h-screen bg-gradient-to-b from-[#FFF6F0] via-[#FFF0F6] to-[#EEF6FF] shadow-[0_0_40px_rgba(74,144,226,0.12)] flex flex-col justify-between pb-24">
        <div>
          {/* Sticky Top Mobile App Bar */}
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#FFD5B5] px-3.5 py-2.5 flex items-center justify-between">
            <div
              onClick={() => {
                if (analysisResult) setShowInputForm(false);
              }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-[#FF8A3D] to-[#FF6B9D] flex items-center justify-center text-white shadow-xs">
                <PawPrint className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-[#2B2D42]">
                펫타임 <span className="text-[#FF8A3D]">Pet</span><span className="text-[#FF6B9D]">Time</span>
              </span>
            </div>

            {analysisResult && !showInputForm && !isLoading && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowInputForm(true)}
                  className="min-h-[34px] px-2.5 rounded-full bg-[#EEF6FF] text-[#4A90E2] text-xs font-extrabold flex items-center gap-1 cursor-pointer active:scale-95 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>처음</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsResultCardOpen(true)}
                  className="min-h-[34px] px-3 rounded-full bg-gradient-to-r from-[#FF8A3D] to-[#FF6B9D] text-white text-xs font-extrabold flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>카드저장</span>
                </button>
              </div>
            )}
          </header>

          <main className="px-3.5 pt-3 space-y-3">
            {/* 1. LOADING SCREEN */}
            {isLoading && (
              <LoadingTimeMachine
                petName={petInput.name || activePresetForPlaceholder?.name || '우리 아이'}
                progressText={loadingMessage}
                photoPreviewUrl={petInput.photoDataUrl}
              />
            )}

            {/* 2. MOBILE ONE-SCREEN INPUT FORM (Ultra-Simple, Cute Icons, Faint Placeholders) */}
            {!isLoading && (showInputForm || !analysisResult) && (
              <form onSubmit={handleStartTimeMachine} className="space-y-3">
                <div className="bg-white rounded-[22px] p-3.5 shadow-[0_6px_20px_-4px_rgba(74,144,226,0.08)] border border-[#FFD5B5] space-y-3">
                  {/* Cute Pet Characters Banner */}
                  <CutePetBannerIllustration />

                  <div className="flex items-center justify-between">
                    <h1 className="text-base font-extrabold text-[#2B2D42]">
                      사진 선택
                    </h1>
                    {analysisResult && (
                      <button
                        type="button"
                        onClick={() => setShowInputForm(false)}
                        className="text-xs font-extrabold text-[#4A90E2] underline cursor-pointer"
                      >
                        결과 보기 →
                      </button>
                    )}
                  </div>

                  {/* Mobile Touch Photo Box */}
                  <div className="relative rounded-[18px] overflow-hidden border-2 border-dashed border-[#FF8A3D] bg-[#FFFDF9] aspect-square w-full max-h-[240px] mx-auto flex flex-col items-center justify-center">
                    <img
                      src={petInput.photoDataUrl}
                      alt="반려동물 사진"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-[#2B2D42]/80 to-transparent grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="min-h-[42px] rounded-[12px] bg-[#FF8A3D] text-white text-xs font-extrabold shadow flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>촬영</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="min-h-[42px] rounded-[12px] bg-[#4A90E2] text-white text-xs font-extrabold shadow flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>앨범</span>
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

                  {/* 4 Cute Sample Chips */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {SAMPLE_PET_PRESETS.map((preset) => {
                      const isSelected = selectedPresetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`min-h-[38px] px-1 rounded-[12px] text-xs font-extrabold border text-center transition active:scale-95 cursor-pointer ${
                            isSelected
                              ? 'bg-[#FF6B9D] text-white border-[#FF6B9D]'
                              : 'bg-[#FFF0F6] text-[#2B2D42] border-[#FFC4DC]'
                          }`}
                        >
                          {preset.avatarEmoji} {preset.name}
                        </button>
                      );
                    })}
                  </div>

                  {/* Birth Year & Month */}
                  <div className="p-3 rounded-[16px] bg-[#EEF6FF] border border-[#BFE0FF]">
                    <label className="flex items-center gap-1.5 text-xs font-extrabold text-[#4A90E2] mb-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>태어난 연·월</span>
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
                        className="w-full min-h-[42px] px-3 rounded-[12px] bg-white border border-[#BFE0FF] text-sm font-extrabold text-[#2B2D42] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]"
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
                        className="w-full min-h-[42px] px-3 rounded-[12px] bg-white border border-[#BFE0FF] text-sm font-extrabold text-[#2B2D42] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]"
                      >
                        {BIRTH_MONTHS.map((m) => (
                          <option key={m} value={m}>
                            {m}월생
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Faint Placeholder Inputs (Disappear when typed!) */}
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={petInput.name}
                      onChange={(e) =>
                        setPetInput((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder={`이름 (예: ${activePresetForPlaceholder?.name || '보리'})`}
                      className="w-full min-h-[42px] px-3 rounded-[12px] bg-[#FFF3E8] border border-[#FFD5B5] text-xs font-bold text-[#2B2D42] placeholder:text-[#B88B68] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#FF8A3D]"
                    />
                    <input
                      type="text"
                      value={petInput.breedHint}
                      onChange={(e) =>
                        setPetInput((prev) => ({ ...prev, breedHint: e.target.value }))
                      }
                      placeholder="품종·특징 (비워두면 자동분석)"
                      className="w-full min-h-[42px] px-3 rounded-[12px] bg-[#FFF0F6] border border-[#FFC4DC] text-xs font-bold text-[#2B2D42] placeholder:text-[#B08D9E] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]"
                    />
                  </div>

                  {/* Start CTA Button */}
                  <button
                    type="submit"
                    className="w-full min-h-[52px] rounded-[16px] bg-gradient-to-r from-[#FF8A3D] via-[#FF6B9D] to-[#4A90E2] text-white font-extrabold text-base shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>시작하기</span>
                  </button>
                </div>
              </form>
            )}

            {/* 3. MOBILE RESULT DASHBOARD */}
            {!isLoading && !showInputForm && analysisResult && generatedImages && currentSelectedStage && (
              <div className="space-y-2.5">
                {/* Compact Pet Summary Bar */}
                <div className="bg-white rounded-[18px] p-2.5 border border-[#FFD5B5] shadow-xs flex items-center gap-2.5">
                  <img
                    src={generatedImages.original}
                    alt={analysisResult.petName}
                    className="w-11 h-11 rounded-[12px] object-cover border-2 border-[#FF8A3D] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm text-[#2B2D42] truncate">
                        {analysisResult.petName}
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FFF0F6] text-[#FF6B9D] shrink-0">
                        {analysisResult.estimatedBreed}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#4A90E2] font-bold mt-0.5">
                      {analysisResult.currentAgeLabel.split(' ')[0]} · {analysisResult.humanAgeEquivalent}
                    </p>
                  </div>
                </div>

                {/* TAB 1: 오늘케어 */}
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

                {/* TAB 2: 쇼츠·앨범 */}
                {activeTab === 'sns' && (
                  <DailyAlbumSnsTab
                    analysisResult={analysisResult}
                    dailyLogs={dailyLogs}
                    onAddDailyLog={handleAddDailyLog}
                  />
                )}

                {/* TAB 3: 미래모습 (Minimal Text + Faint Placeholder Diary Input) */}
                {activeTab === 'timeline' && (
                  <div className="bg-white rounded-[20px] p-3.5 border border-[#FFD5B5] space-y-2.5">
                    <div className="grid grid-cols-3 gap-1.5">
                      {analysisResult.timelineStages.map((stage, idx) => {
                        const isSelected =
                          selectedStageIndex === idx && customYearOffset === stage.offsetYears;
                        return (
                          <button
                            key={stage.id}
                            type="button"
                            onClick={() => handleSelectStageMilestone(idx)}
                            className={`min-h-[42px] py-1 px-1 rounded-[12px] text-center border text-xs font-extrabold transition active:scale-95 cursor-pointer ${
                              isSelected
                                ? 'bg-[#FF8A3D] text-white border-[#FF8A3D]'
                                : 'bg-[#FFF3E8] text-[#2B2D42] border-[#FFD5B5]'
                            }`}
                          >
                            <div>{stage.label}</div>
                            <div
                              className={`text-[10px] font-bold ${
                                isSelected ? 'text-white/90' : 'text-[#FF8A3D]'
                              }`}
                            >
                              {stage.targetYear}년
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-2.5 rounded-[14px] bg-[#EEF6FF] border border-[#BFE0FF] space-y-1">
                      <div className="flex items-center justify-between text-xs font-extrabold">
                        <span className="flex items-center gap-1 text-[#4A90E2]">
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>연도 이동</span>
                        </span>
                        <span className="text-[#FF8A3D]">
                          {customYearOffset === 0
                            ? `현재 (${CURRENT_YEAR}년)`
                            : `${customYearOffset}년 후 (${exactSliderYear}년 · ${exactPetAgeText})`}
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
                        className="w-full accent-[#FF8A3D] h-2 bg-white rounded-lg cursor-pointer"
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

                    {/* Faint Placeholder Diary Input instead of wall of text! */}
                    <input
                      type="text"
                      value={futureDiaryInput}
                      onChange={(e) => setFutureDiaryInput(e.target.value)}
                      placeholder={`💌 ${exactSliderYear}년의 우리 아이에게 남길 한마디 (입력 시 사라짐)`}
                      className="w-full min-h-[42px] px-3 rounded-[12px] bg-[#FFF0F6] border border-[#FFC4DC] text-xs font-bold text-[#2B2D42] placeholder:text-[#B08D9E] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]"
                    />
                  </div>
                )}

                {/* TAB 4: 2세만들기 */}
                {activeTab === 'offspring' && (
                  <OffspringSimulatorTab
                    analysisResult={analysisResult}
                    parent1PhotoUrl={generatedImages.original}
                  />
                )}

                {/* TAB 5: 수명·건강 (Visual & Concise + Faint Placeholder Input) */}
                {activeTab === 'longevity_health' && (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-1.5 bg-white p-1.5 rounded-[16px] border border-[#BFE0FF]">
                      <button
                        type="button"
                        onClick={() => setHealthSubTab('lifespan')}
                        className={`min-h-[40px] rounded-[12px] text-xs font-extrabold transition cursor-pointer ${
                          healthSubTab === 'lifespan'
                            ? 'bg-[#FF6B9D] text-white shadow-xs'
                            : 'text-[#4A4E69]'
                        }`}
                      >
                        💗 기대 수명
                      </button>
                      <button
                        type="button"
                        onClick={() => setHealthSubTab('roadmap')}
                        className={`min-h-[40px] rounded-[12px] text-xs font-extrabold transition cursor-pointer ${
                          healthSubTab === 'roadmap'
                            ? 'bg-[#4A90E2] text-white shadow-xs'
                            : 'text-[#4A4E69]'
                        }`}
                      >
                        💙 연도별 주의보
                      </button>
                    </div>

                    {healthSubTab === 'lifespan' ? (
                      <div className="space-y-2.5">
                        <div className="rounded-[20px] bg-gradient-to-r from-[#FF8A3D] via-[#FF6B9D] to-[#4A90E2] text-white p-4 shadow-md text-center space-y-1">
                          <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/25">
                            평균 {analysisResult.lifespanPrediction.breedAverageYears} + 케어 보너스 {activeBonusYears}년
                          </span>
                          <h2 className="text-xl font-extrabold">
                            🎉 {analysisResult.lifespanPrediction.expectedTogetherYear + activeBonusYears}년까지 함께해요!
                          </h2>
                        </div>

                        <div className="bg-white rounded-[20px] p-3.5 border border-[#FFD5B5] space-y-2">
                          <div className="text-xs font-extrabold text-[#2B2D42]">
                            ✅ 수명 연장 체크 (+{activeBonusYears}년)
                          </div>
                          {[
                            '🦷 매일 양치 케어 (+1년)',
                            '🦴 슬개골·적정체중 유지 (+1년)',
                            '🩺 연 1회 정기 혈액검진 (+1년)',
                          ].map((label, idx) => {
                            const checked = Boolean(checkedLongevityTips[idx]);
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() =>
                                  setCheckedLongevityTips((prev) => ({
                                    ...prev,
                                    [idx]: !prev[idx],
                                  }))
                                }
                                className={`w-full min-h-[44px] flex items-center gap-2.5 px-3 rounded-[12px] border text-left text-xs font-extrabold transition active:scale-98 cursor-pointer ${
                                  checked
                                    ? 'bg-[#FFF3E8] border-[#FF8A3D] text-[#2B2D42]'
                                    : 'bg-white border-[#E2E8F0] text-[#94A3B8]'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  readOnly
                                  className="w-4 h-4 accent-[#FF8A3D] pointer-events-none"
                                />
                                <span>{label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-[20px] p-3.5 border border-[#BFE0FF] space-y-2.5">
                        <div className="grid grid-cols-5 gap-1">
                          {analysisResult.healthRoadmap.map((item, idx) => {
                            const active = selectedHealthIdx === idx;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedHealthIdx(idx)}
                                className={`min-h-[42px] rounded-[12px] text-xs font-extrabold border transition cursor-pointer ${
                                  active
                                    ? 'bg-[#4A90E2] text-white border-[#4A90E2]'
                                    : 'bg-[#EEF6FF] text-[#2B2D42] border-[#BFE0FF]'
                                }`}
                              >
                                <div>{item.year}년</div>
                                <div className={`text-[10px] ${active ? 'text-white/90' : 'text-[#4A90E2]'}`}>
                                  {item.petAge}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {analysisResult.healthRoadmap[selectedHealthIdx] && (() => {
                          const h = analysisResult.healthRoadmap[selectedHealthIdx];
                          return (
                            <div className="space-y-2">
                              <div className="p-3 rounded-[14px] bg-[#FFF0F6] border border-[#FFC4DC]">
                                <div className="text-xs font-extrabold text-[#FF6B9D] mb-1.5">
                                  ⚠️ {h.year}년 주의 부위
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {h.vulnerableParts.map((part, i) => (
                                    <span
                                      key={i}
                                      className="px-2.5 py-1 rounded-full bg-white text-[#2B2D42] text-xs font-extrabold border border-[#FFC4DC]"
                                    >
                                      {part}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="p-3 rounded-[14px] bg-[#EEF6FF] border border-[#BFE0FF]">
                                <div className="text-xs font-extrabold text-[#4A90E2] mb-1">
                                  🩺 필수 검진
                                </div>
                                <div className="text-xs font-bold text-[#2B2D42]">
                                  {h.essentialCheckups[0]}
                                </div>
                              </div>

                              <input
                                type="text"
                                value={healthMemoInput}
                                onChange={(e) => setHealthMemoInput(e.target.value)}
                                placeholder="병원 검진일·주의사항 메모 (입력 시 안내글 사라짐)"
                                className="w-full min-h-[40px] px-3 rounded-[12px] bg-[#F8FAFC] border border-[#BFE0FF] text-xs font-bold text-[#2B2D42] placeholder:text-[#94A3B8] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#4A90E2]"
                              />
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        {/* Fixed Bottom 5-Tab Smartphone Navigation Bar (Orange + Pink + Blue + White) */}
        {!isLoading && !showInputForm && analysisResult && (
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] z-40 bg-white/95 backdrop-blur-md border-t border-[#FFD5B5] px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] grid grid-cols-5 gap-1.5 shadow-[0_-4px_20px_rgba(74,144,226,0.1)]">
            {[
              { id: 'autocare', label: '오늘케어', icon: HeartPulse, color: 'bg-[#FFF3E8] text-[#FF8A3D]' },
              { id: 'sns', label: '쇼츠·앨범', icon: Film, color: 'bg-[#FFF0F6] text-[#FF6B9D]' },
              { id: 'timeline', label: '미래모습', icon: Clock, color: 'bg-[#EEF6FF] text-[#4A90E2]' },
              { id: 'offspring', label: '2세만들기', icon: Baby, color: 'bg-[#FFF0F6] text-[#FF6B9D]' },
              { id: 'longevity_health', label: '수명·건강', icon: Heart, color: 'bg-[#FFF3E8] text-[#FF8A3D]' },
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
                  className={`min-h-[50px] rounded-[14px] flex flex-col items-center justify-center gap-1 transition active:scale-95 cursor-pointer ${
                    active ? `${tab.color} font-extrabold` : 'text-[#6C708A] font-bold'
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
