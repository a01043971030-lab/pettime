export type PetSpeciesCategory = '강아지' | '고양이' | '토끼' | '햄스터/소동물' | '새/앵무' | '파충류/거북이' | '기타 반려동물';

export interface PetInputInfo {
  name: string;
  birthYear: number;
  birthMonth: number;
  gender: '선택 안 함' | '남아' | '여아' | '중성화 완료';
  breedHint: string;
  speciesHint: PetSpeciesCategory | '자동 분석';
  photoDataUrl: string;
  photoMimeType: string;
}

export interface TimelineStage {
  id: string;
  offsetYears: number; // 0, 1, 3, 5, 8, 12
  label: string; // "현재", "1년 후", "3년 후", "5년 후", "8년 후", "12년 후 (노년기)"
  targetYear: number;
  petAgeText: string;
  humanAgeText: string;
  stageCategory: 'current' | 'young_adult' | 'prime' | 'mature' | 'senior';
  stageTitle: string;
  physicalChangeDesc: string;
  personalityChangeDesc: string;
  petDiaryQuote: string;
  careFocusTag: string;
}

export interface OffspringPrediction {
  babyNickname: string;
  inheritedFeatures: string[];
  furAndEyeDesc: string;
  personalityTraits: string[];
  cutePointsDesc: string;
  parentResemblanceScore: number; // e.g., 96%
  imagePromptEn: string;
}

export interface YearlyHealthRoadmapItem {
  year: number;
  offsetLabel: string;
  petAge: string;
  humanAge: string;
  riskLevel: '안심 관리' | '집중 케어' | '정밀 검진';
  vulnerableParts: string[]; // 관절/슬개골, 치아/치주, 신장, 심장, 눈/백내장 등
  geneticAndAgeRisks: string[];
  essentialCheckups: string[];
  nutritionAndCareGuide: string;
}

export interface GroomingStyleItem {
  styleName: string;
  suitabilityBadge: string;
  description: string;
  tip: string;
}

export interface GroomingAndCareGuide {
  coatAndFeatureSummary: string;
  recommendedStyles: GroomingStyleItem[];
  brushingSchedule: {
    frequency: string;
    toolRecommendation: string;
    methodTip: string;
  };
  bathingAndHygiene: {
    frequency: string;
    temperatureAndShampoo: string;
    cautionTip: string;
  };
  skinAndCoatSecret: string;
  longevityPlayTips: {
    title: string;
    description: string;
    longevityBonus: string;
  }[];
  walkAndEnvironmentTips: {
    category: string;
    content: string;
  }[];
}

export interface PetTimeAnalysisResult {
  petName: string;
  species: string;
  estimatedBreed: string;
  confidencePercent: number;
  birthYear: number;
  birthMonth: number;
  currentAgeMonths: number;
  currentAgeLabel: string;
  humanAgeEquivalent: string;
  appearanceSummaryKo: string;
  appearancePromptEn: string;
  distinctiveFeatures: {
    coatColorAndPattern: string;
    eyeColorAndShape: string;
    earAndFaceTrait: string;
    bodyBuild: string;
  };
  lifespanPrediction: {
    breedAverageYears: string;
    expectedTogetherYear: number;
    expectedAgeAtTargetYear: number;
    remainingHappyYears: number;
    headlineMessage: string; // e.g. "2040년까지 건강하게 함께할 수 있어요!"
    hopeSubMessage: string; // 관리에 따라 수명이 더 늘어날 수 있다는 희망 메시지
    potentialBonusYears: number;
    keyLongevityFactors: string[];
  };
  timelineStages: TimelineStage[];
  offspringPrediction: OffspringPrediction;
  healthRoadmap: YearlyHealthRoadmapItem[];
  groomingAndCare: GroomingAndCareGuide;
}

export interface GeneratedPetImages {
  original: string;
  primeAdult: string; // 성년기 모습
  senior: string; // 노년기 모습
  offspring: string; // 2세(새끼) 모습
  perStageUrls: Record<string, string>; // 각 타임라인 단계별 시뮬레이션 이미지
  sourceMode: 'gemini-ai' | 'smart-simulation';
  statusNote?: string;
}
