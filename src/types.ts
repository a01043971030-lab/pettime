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
  presetId?: string;
}

export interface PartnerPetInfo {
  name: string;
  photoDataUrl: string;
  isFromVideo: boolean;
  primaryColorHex: string;
  secondaryColorHex: string;
  colorDesc: string;
}

export interface OffspringPhotoItem {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  poseType: 'newborn' | 'head_tilt' | 'wink_play' | 'grown_baby' | 'family_portrait';
  imageUrl: string;
}

export interface TimelineStage {
  id: string;
  offsetYears: number;
  label: string;
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
  parentResemblanceScore: number;
  imagePromptEn: string;
}

export interface YearlyHealthRoadmapItem {
  year: number;
  offsetLabel: string;
  petAge: string;
  humanAge: string;
  riskLevel: '안심 관리' | '집중 케어' | '정밀 검진';
  vulnerableParts: string[];
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
    headlineMessage: string;
    hopeSubMessage: string;
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
  primeAdult: string;
  senior: string;
  offspring: string;
  offspringGallery: OffspringPhotoItem[];
  perStageUrls: Record<string, string>;
  sourceMode: 'gemini-ai' | 'smart-simulation';
  statusNote?: string;
}
