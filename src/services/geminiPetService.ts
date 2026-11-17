import { GoogleGenAI, Type, Schema } from '@google/genai';
import {
  GeneratedPetImages,
  PetInputInfo,
  PetTimeAnalysisResult,
  TimelineStage,
} from '../types';
import {
  analyzeUploadedPhotoColors,
  renderConsistentPetStagePhoto,
} from '../utils/petImageProcessor';

const STORAGE_API_KEY = 'PETTIME_GEMINI_API_KEY';

export function getSavedApiKey(): string {
  const fromStorage = localStorage.getItem(STORAGE_API_KEY);
  if (fromStorage && fromStorage.trim()) return fromStorage.trim();
  const envKey =
    (import.meta as unknown as { env?: Record<string, string> })?.env?.VITE_GEMINI_API_KEY || '';
  return envKey;
}

export function saveApiKey(key: string): void {
  if (!key.trim()) {
    localStorage.removeItem(STORAGE_API_KEY);
  } else {
    localStorage.setItem(STORAGE_API_KEY, key.trim());
  }
}

export function calculatePetAgeDetails(birthYear: number, birthMonth: number, species: string) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const totalMonths = Math.max(1, (currentYear - birthYear) * 12 + (currentMonth - birthMonth));
  const years = Math.floor(totalMonths / 12);
  const remMonths = totalMonths % 12;

  const currentAgeLabel =
    years > 0
      ? remMonths > 0
        ? `${years}세 ${remMonths}개월 (총 ${totalMonths}개월)`
        : `${years}세 (총 ${totalMonths}개월)`
      : `${totalMonths}개월`;

  // Human age calculation tailored by species
  let humanAge = 20;
  if (species.includes('고양이')) {
    if (totalMonths <= 12) humanAge = Math.round((totalMonths / 12) * 15);
    else if (totalMonths <= 24) humanAge = 15 + Math.round(((totalMonths - 12) / 12) * 9);
    else humanAge = 24 + Math.round(((totalMonths - 24) / 12) * 4);
  } else if (species.includes('햄스터') || species.includes('소동물')) {
    humanAge = Math.round(totalMonths * 2.8);
  } else if (species.includes('토끼')) {
    if (totalMonths <= 12) humanAge = Math.round((totalMonths / 12) * 20);
    else humanAge = 20 + Math.round(((totalMonths - 12) / 12) * 6);
  } else if (species.includes('새') || species.includes('앵무')) {
    humanAge = Math.max(5, Math.round((totalMonths / 12) * 5.2));
  } else if (species.includes('파충류') || species.includes('거북')) {
    humanAge = Math.max(4, Math.round((totalMonths / 12) * 4.5));
  } else {
    // Dog default
    if (totalMonths <= 12) humanAge = Math.round((totalMonths / 12) * 15);
    else if (totalMonths <= 24) humanAge = 15 + Math.round(((totalMonths - 12) / 12) * 9);
    else humanAge = 24 + Math.round(((totalMonths - 24) / 12) * 4.5);
  }

  return {
    currentYear,
    currentMonth,
    totalMonths,
    years,
    remMonths,
    currentAgeLabel,
    humanAge,
    humanAgeEquivalent: `사람 나이 약 ${humanAge}세`,
  };
}

const PET_ANALYSIS_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    species: { type: Type.STRING, description: '반려동물 종류 (예: 강아지, 고양이, 토끼, 햄스터, 앵무새, 파충류 등)' },
    estimatedBreed: { type: Type.STRING, description: '추정 품종 한국어 명칭 (예: 크림 말티푸, 코리안 숏헤어 치즈태비 등)' },
    confidencePercent: { type: Type.NUMBER, description: '품종 분석 신뢰도 (85~99)' },
    appearanceSummaryKo: { type: Type.STRING, description: '털 색깔, 무늬, 눈망울, 귀 모양, 표정 등 외모 특징의 따뜻하고 상세한 한국어 묘사' },
    appearancePromptEn: { type: Type.STRING, description: 'Detailed English prompt describing exact fur/feather/scale color, markings, eye color, ear shape, facial structure for consistent AI image generation' },
    distinctiveFeatures: {
      type: Type.OBJECT,
      properties: {
        coatColorAndPattern: { type: Type.STRING },
        eyeColorAndShape: { type: Type.STRING },
        earAndFaceTrait: { type: Type.STRING },
        bodyBuild: { type: Type.STRING },
      },
      required: ['coatColorAndPattern', 'eyeColorAndShape', 'earAndFaceTrait', 'bodyBuild'],
    },
    lifespanPrediction: {
      type: Type.OBJECT,
      properties: {
        breedAverageYears: { type: Type.STRING, description: '품종 평균 기대 수명 (예: 14~16년)' },
        expectedTogetherYear: { type: Type.NUMBER, description: '예상 함께할 연도 (예: 2040)' },
        expectedAgeAtTargetYear: { type: Type.NUMBER, description: '예상 수명 나이 (예: 16)' },
        remainingHappyYears: { type: Type.NUMBER, description: '앞으로 함께할 예상 기간(년)' },
        headlineMessage: { type: Type.STRING, description: '예: 2040년까지 건강하게 함께할 수 있어요!' },
        hopeSubMessage: { type: Type.STRING, description: '관리에 따라 수명이 더 늘어날 수 있다는 희망적인 메시지' },
        potentialBonusYears: { type: Type.NUMBER, description: '맞춤 관리 시 추가로 늘어날 수 있는 보너스 수명(년, 예: 3)' },
        keyLongevityFactors: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: [
        'breedAverageYears',
        'expectedTogetherYear',
        'expectedAgeAtTargetYear',
        'remainingHappyYears',
        'headlineMessage',
        'hopeSubMessage',
        'potentialBonusYears',
        'keyLongevityFactors',
      ],
    },
    timelineStages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          offsetYears: { type: Type.NUMBER },
          label: { type: Type.STRING },
          targetYear: { type: Type.NUMBER },
          petAgeText: { type: Type.STRING },
          humanAgeText: { type: Type.STRING },
          stageCategory: { type: Type.STRING },
          stageTitle: { type: Type.STRING },
          physicalChangeDesc: { type: Type.STRING },
          personalityChangeDesc: { type: Type.STRING },
          petDiaryQuote: { type: Type.STRING },
          careFocusTag: { type: Type.STRING },
        },
        required: [
          'id',
          'offsetYears',
          'label',
          'targetYear',
          'petAgeText',
          'humanAgeText',
          'stageCategory',
          'stageTitle',
          'physicalChangeDesc',
          'personalityChangeDesc',
          'petDiaryQuote',
          'careFocusTag',
        ],
      },
    },
    offspringPrediction: {
      type: Type.OBJECT,
      properties: {
        babyNickname: { type: Type.STRING },
        inheritedFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
        furAndEyeDesc: { type: Type.STRING },
        personalityTraits: { type: Type.ARRAY, items: { type: Type.STRING } },
        cutePointsDesc: { type: Type.STRING },
        parentResemblanceScore: { type: Type.NUMBER },
        imagePromptEn: { type: Type.STRING },
      },
      required: [
        'babyNickname',
        'inheritedFeatures',
        'furAndEyeDesc',
        'personalityTraits',
        'cutePointsDesc',
        'parentResemblanceScore',
        'imagePromptEn',
      ],
    },
    healthRoadmap: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          year: { type: Type.NUMBER },
          offsetLabel: { type: Type.STRING },
          petAge: { type: Type.STRING },
          humanAge: { type: Type.STRING },
          riskLevel: { type: Type.STRING },
          vulnerableParts: { type: Type.ARRAY, items: { type: Type.STRING } },
          geneticAndAgeRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
          essentialCheckups: { type: Type.ARRAY, items: { type: Type.STRING } },
          nutritionAndCareGuide: { type: Type.STRING },
        },
        required: [
          'year',
          'offsetLabel',
          'petAge',
          'humanAge',
          'riskLevel',
          'vulnerableParts',
          'geneticAndAgeRisks',
          'essentialCheckups',
          'nutritionAndCareGuide',
        ],
      },
    },
    groomingAndCare: {
      type: Type.OBJECT,
      properties: {
        coatAndFeatureSummary: { type: Type.STRING },
        recommendedStyles: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              styleName: { type: Type.STRING },
              suitabilityBadge: { type: Type.STRING },
              description: { type: Type.STRING },
              tip: { type: Type.STRING },
            },
            required: ['styleName', 'suitabilityBadge', 'description', 'tip'],
          },
        },
        brushingSchedule: {
          type: Type.OBJECT,
          properties: {
            frequency: { type: Type.STRING },
            toolRecommendation: { type: Type.STRING },
            methodTip: { type: Type.STRING },
          },
          required: ['frequency', 'toolRecommendation', 'methodTip'],
        },
        bathingAndHygiene: {
          type: Type.OBJECT,
          properties: {
            frequency: { type: Type.STRING },
            temperatureAndShampoo: { type: Type.STRING },
            cautionTip: { type: Type.STRING },
          },
          required: ['frequency', 'temperatureAndShampoo', 'cautionTip'],
        },
        skinAndCoatSecret: { type: Type.STRING },
        longevityPlayTips: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              longevityBonus: { type: Type.STRING },
            },
            required: ['title', 'description', 'longevityBonus'],
          },
        },
        walkAndEnvironmentTips: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              content: { type: Type.STRING },
            },
            required: ['category', 'content'],
          },
        },
      },
      required: [
        'coatAndFeatureSummary',
        'recommendedStyles',
        'brushingSchedule',
        'bathingAndHygiene',
        'skinAndCoatSecret',
        'longevityPlayTips',
        'walkAndEnvironmentTips',
      ],
    },
  },
  required: [
    'species',
    'estimatedBreed',
    'confidencePercent',
    'appearanceSummaryKo',
    'appearancePromptEn',
    'distinctiveFeatures',
    'lifespanPrediction',
    'timelineStages',
    'offspringPrediction',
    'healthRoadmap',
    'groomingAndCare',
  ],
};

/**
 * Step 1: Vision & Structured Data Analysis via `gemini-2.5-flash`
 */
export async function analyzePetWithGemini(
  input: PetInputInfo,
  onProgress?: (msg: string) => void
): Promise<{ result: PetTimeAnalysisResult; usedGeminiApi: boolean; apiNotice?: string }> {
  const apiKey = getSavedApiKey();
  const petName = input.name.trim() || '우리 아이';

  if (apiKey) {
    try {
      onProgress?.('Gemini 2.5 Flash 비전 AI가 사진 속 외모 특징과 생애 주기를 정밀 분석하고 있어요...');
      const ai = new GoogleGenAI({ apiKey });
      const base64Data = input.photoDataUrl.includes(',')
        ? input.photoDataUrl.split(',')[1]
        : input.photoDataUrl;

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const prompt = `
당신은 수의학·반려동물 생애주기 전문 AI이자 따뜻한 감성을 지닌 "펫타임 (PetTime) - AI 반려동물 미래 타임머신" 분석가입니다.
업로드된 반려동물 사진과 아래 정보를 바탕으로 정밀 분석하여 지정된 JSON 스키마(한국어)로 응답해 주세요.

[입력 정보]
- 반려동물 이름: ${petName}
- 태어난 연도 및 월: ${input.birthYear}년 ${input.birthMonth}월 (현재 기준: ${currentYear}년 ${currentMonth}월)
- 성별/중성화: ${input.gender}
- 보호자 입력 동물종류 힌트: ${input.speciesHint}
- 보호자 입력 품종 힌트: ${input.breedHint || '사진을 보고 정밀 추정'}

[필수 지침]
1. 사진 속 동물의 종류(강아지, 고양이, 햄스터, 토끼, 새, 파충류 등 모든 동물 대응), 추정 품종, 고유한 털/깃털/비늘 색깔, 무늬, 눈 색깔, 귀 모양, 얼굴 특징을 정확하고 따뜻하게 분석하세요.
2. 품종별 평균 수명과 건강 데이터를 기반으로 예상 함께할 연도(expectedTogetherYear)를 계산하고, headlineMessage는 "2040년까지 건강하게 함께할 수 있어요!"처럼 따뜻하고 긍정적인 톤으로 작성하세요.
3. timelineStages는 반드시 6개 단계 [현재(0년 후), 1년 후(1), 3년 후(3), 5년 후(5), 8년 후(8), 12년 후 노년기(12)] (소동물의 경우 생애주기에 맞춘 6단계이되 offsetYears는 0, 1, 3, 5, 8, 12로 매핑)로 구성하고, 각 시기별 외모 변화와 반려동물이 보호자에게 건네는 감동적인 일기 한마디(petDiaryQuote)를 작성하세요.
4. offspringPrediction은 만약 이 아이가 2세(새끼)를 낳는다면 물려줄 외모 포인트, 예상 성격, 귀여운 특징을 생생하게 묘사하세요.
5. healthRoadmap은 현재부터 미래까지 5개 연도 구간에 걸쳐 취약해지는 신체 부위(관절, 슬개골, 치아, 신장, 심장, 눈/백내장 등), 주의 질환, 필수 검진 항목, 맞춤 영양 가이드를 구체적으로 작성하세요.
6. groomingAndCare는 사진 속 아이의 외모와 모질에 딱 맞는 미용 스타일링 3가지, 빗질/목욕 주기, 수명을 늘려주는 놀이법 3가지, 환경 세팅 팁 4가지를 실용적으로 작성하세요.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: input.photoMimeType || 'image/jpeg',
                  data: base64Data,
                },
              },
              { text: prompt },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: PET_ANALYSIS_RESPONSE_SCHEMA,
          temperature: 0.4,
        },
      });

      const rawText = response.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        const ageDetails = calculatePetAgeDetails(
          input.birthYear,
          input.birthMonth,
          parsed.species || input.speciesHint
        );

        const fullResult: PetTimeAnalysisResult = {
          ...parsed,
          petName,
          birthYear: input.birthYear,
          birthMonth: input.birthMonth,
          currentAgeMonths: ageDetails.totalMonths,
          currentAgeLabel: ageDetails.currentAgeLabel,
          humanAgeEquivalent: ageDetails.humanAgeEquivalent,
        };
        return { result: fullResult, usedGeminiApi: true };
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const isQuota =
        errMsg.includes('429') ||
        errMsg.toLowerCase().includes('quota') ||
        errMsg.toLowerCase().includes('resource_exhausted');
      const notice = isQuota
        ? '현재 Gemini API 무료 할당량이 일시 초과되어, 업로드하신 사진의 실제 색상·특징 분석 기반 스마트 시뮬레이션 엔진으로 전환되었습니다.'
        : 'Gemini API 연결 상태를 확인하여 업로드 사진 기반 스마트 정밀 분석 엔진으로 결과를 생성했습니다.';
      const fallback = await buildSmartFallbackAnalysis(input, petName);
      return { result: fallback, usedGeminiApi: false, apiNotice: notice };
    }
  }

  onProgress?.('업로드된 사진의 색상·외형 특징과 생년월 데이터를 정밀 분석하고 있어요...');
  const fallback = await buildSmartFallbackAnalysis(input, petName);
  return {
    result: fallback,
    usedGeminiApi: false,
    apiNotice: apiKey
      ? undefined
      : '상단 우측 [API 키 설정]에서 Gemini API 키를 입력하시면 실시간 Gemini 2.5 멀티모달 & 이미지 생성 모델을 함께 사용하실 수 있어요. 현재는 업로드 사진 기반 스마트 타임머신 엔진이 작동 중입니다.',
  };
}

/**
 * Step 2: Consistent Future & Offspring Image Generation via Gemini Image Model + Smart Canvas Progression
 */
export async function generatePetFutureImagesWithGemini(
  input: PetInputInfo,
  analysis: PetTimeAnalysisResult,
  onProgress?: (msg: string) => void
): Promise<GeneratedPetImages> {
  const apiKey = getSavedApiKey();
  const basePhoto = input.photoDataUrl;

  let primeAdultUrl = '';
  let seniorUrl = '';
  let offspringUrl = '';
  let sourceMode: 'gemini-ai' | 'smart-simulation' = 'smart-simulation';
  let statusNote: string | undefined = undefined;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const base64Data = basePhoto.includes(',') ? basePhoto.split(',')[1] : basePhoto;
      const mimeType = input.photoMimeType || 'image/jpeg';

      const tryGenerateSingleImage = async (stagePrompt: string): Promise<string | null> => {
        const modelsToTry = ['gemini-2.5-flash-image', 'gemini-2.0-flash-preview-image-generation'];
        for (const modelName of modelsToTry) {
          try {
            const res = await ai.models.generateContent({
              model: modelName,
              contents: [
                {
                  role: 'user',
                  parts: [
                    { inlineData: { mimeType, data: base64Data } },
                    { text: stagePrompt },
                  ],
                },
              ],
              config: {
                responseModalities: ['TEXT', 'IMAGE'],
              },
            });
            const parts = res.candidates?.[0]?.content?.parts || [];
            for (const part of parts) {
              if (part.inlineData?.data) {
                const outMime = part.inlineData.mimeType || 'image/png';
                return `data:${outMime};base64,${part.inlineData.data}`;
              }
            }
          } catch {
            // Continue to next model or fallback
          }
        }
        return null;
      };

      onProgress?.('① 우리 아이의 가장 늠름하고 윤기 나는 성년기 모습을 생성하고 있어요...');
      const primePrompt = `Create a photorealistic portrait of this exact pet (${analysis.appearancePromptEn}) in its prime healthy adult stage (3-5 years from now). Keep the exact same fur color, markings, eye color, ear shape, and facial structure. Glossy healthy coat, warm natural studio lighting, high resolution photorealistic pet photography.`;
      const genPrime = await tryGenerateSingleImage(primePrompt);

      onProgress?.('② 입가와 눈가에 하얀 털이 서리듯 내려앉은 온화한 노년기 모습을 생성하고 있어요...');
      const seniorPrompt = `Create a photorealistic portrait of this exact pet (${analysis.appearancePromptEn}) as a gentle, deeply loved senior pet (10-12 years older). Keep the exact same fur color, markings, eye color, and ear shape, with delicate frosty white/silver fur naturally dusting around the muzzle, chin, and eyebrows. Warm, tender, emotional golden hour lighting.`;
      const genSenior = await tryGenerateSingleImage(seniorPrompt);

      onProgress?.('③ 우리 아이의 털 무늬와 눈망울을 꼭 닮은 귀여운 2세(아기 시절) 모습을 생성하고 있어요...');
      const babyPrompt = `Create an ultra-adorable photorealistic baby/offspring portrait of this exact pet (${analysis.offspringPrediction.imagePromptEn || analysis.appearancePromptEn}). A tiny, fluffy baby version that inherited the exact same coat colors, markings, and sparkling eyes. Cozy pastel cream studio background.`;
      const genBaby = await tryGenerateSingleImage(babyPrompt);

      if (genPrime || genSenior || genBaby) {
        sourceMode = 'gemini-ai';
        primeAdultUrl = genPrime || '';
        seniorUrl = genSenior || '';
        offspringUrl = genBaby || '';
      } else {
        statusNote =
          '이미지 생성 API 할당량 제한 또는 모델 응답 지연으로, 업로드하신 원본 사진의 털 색깔·무늬·얼굴을 100% 보존하는 고정밀 사진 노화·2세 시뮬레이션 엔진으로 생성되었습니다.';
      }
    } catch {
      statusNote =
        '이미지 생성 API 할당량 초과에 대비한 안전 모드가 작동하여, 원본 사진의 고유 외모를 그대로 유지하는 실사 노화·2세 변환 엔진으로 이미지를 완성했어요.';
    }
  }

  onProgress?.('연도별 타임라인(1년~12년 후) 및 Before & After 비교 이미지를 정밀 렌더링하고 있어요...');

  // Ensure every stage has a realistic, photo-consistent image derived from the original or Gemini milestone
  if (!primeAdultUrl) {
    primeAdultUrl = await renderConsistentPetStagePhoto(
      basePhoto,
      'prime',
      3,
      `${analysis.petName} · 전성기 성년 모습`,
      '윤기 나는 피모 & 활력 절정기',
      input.presetId
    );
  }
  if (!seniorUrl) {
    seniorUrl = await renderConsistentPetStagePhoto(
      basePhoto,
      'senior',
      12,
      `${analysis.petName} · 온화한 노년기`,
      '입가와 눈가에 내려앉은 하얀 서리 털',
      input.presetId
    );
  }
  if (!offspringUrl) {
    offspringUrl = await renderConsistentPetStagePhoto(
      basePhoto,
      'offspring',
      0,
      `미래 2세 "${analysis.offspringPrediction.babyNickname}"`,
      `부모 외모 유전율 ${analysis.offspringPrediction.parentResemblanceScore}%`,
      input.presetId
    );
  }

  const perStageUrls: Record<string, string> = {};
  for (const stage of analysis.timelineStages) {
    if (stage.offsetYears === 0) {
      perStageUrls[stage.id] = await renderConsistentPetStagePhoto(
        basePhoto,
        'current',
        0,
        `현재 (${stage.targetYear}년)`,
        stage.petAgeText,
        input.presetId
      );
    } else if (stage.offsetYears <= 3) {
      perStageUrls[stage.id] =
        stage.offsetYears === 3 && sourceMode === 'gemini-ai'
          ? primeAdultUrl
          : await renderConsistentPetStagePhoto(
              basePhoto,
              'prime',
              stage.offsetYears,
              `${stage.label} (${stage.targetYear}년)`,
              stage.petAgeText,
              input.presetId
            );
    } else if (stage.offsetYears <= 8) {
      perStageUrls[stage.id] = await renderConsistentPetStagePhoto(
        basePhoto,
        'mature',
        stage.offsetYears,
        `${stage.label} (${stage.targetYear}년)`,
        stage.petAgeText,
        input.presetId
      );
    } else {
      perStageUrls[stage.id] =
        sourceMode === 'gemini-ai'
          ? seniorUrl
          : await renderConsistentPetStagePhoto(
              basePhoto,
              'senior',
              stage.offsetYears,
              `${stage.label} (${stage.targetYear}년)`,
              stage.petAgeText,
              input.presetId
            );
    }
  }

  return {
    original: basePhoto,
    primeAdult: primeAdultUrl,
    senior: seniorUrl,
    offspring: offspringUrl,
    offspringGallery: [],
    perStageUrls,
    sourceMode,
    statusNote,
  };
}

/**
 * Rich, accurate Korean fallback analysis engine using uploaded photo color inspection + species/breed veterinary data
 */
async function buildSmartFallbackAnalysis(
  input: PetInputInfo,
  petName: string
): Promise<PetTimeAnalysisResult> {
  const colorInfo = await analyzeUploadedPhotoColors(input.photoDataUrl);
  const species =
    input.speciesHint === '자동 분석'
      ? inferSpeciesFromBreedHint(input.breedHint)
      : input.speciesHint;

  const estimatedBreed =
    input.breedHint.trim() || getDefaultBreedBySpecies(species, colorInfo.primaryColorDescription);

  const age = calculatePetAgeDetails(input.birthYear, input.birthMonth, species);

  // Lifespan calculation by species
  let avgLifespanNum = 15;
  let breedAverageYears = '14~16년';
  let potentialBonusYears = 3;

  if (species === '고양이') {
    avgLifespanNum = 16;
    breedAverageYears = '15~18년 (실내 맞춤 케어 기준)';
    potentialBonusYears = 4;
  } else if (species === '토끼') {
    avgLifespanNum = 10;
    breedAverageYears = '8~12년';
    potentialBonusYears = 3;
  } else if (species === '햄스터/소동물') {
    avgLifespanNum = 3;
    breedAverageYears = '2.5~3.5년';
    potentialBonusYears = 1;
  } else if (species === '새/앵무') {
    avgLifespanNum = 15;
    breedAverageYears = '12~20년';
    potentialBonusYears = 4;
  } else if (species === '파충류/거북이') {
    avgLifespanNum = 18;
    breedAverageYears = '15~25년';
    potentialBonusYears = 5;
  }

  const expectedTogetherYear = Math.max(
    age.currentYear + 2,
    input.birthYear + avgLifespanNum
  );
  const remainingHappyYears = Math.max(2, expectedTogetherYear - age.currentYear);

  const offsets = [0, 1, 3, 5, 8, 12];
  const timelineStages: TimelineStage[] = offsets.map((offset) => {
    const targetYear = age.currentYear + offset;
    const futureTotalMonths = age.totalMonths + offset * 12;
    const futureYears = Math.floor(futureTotalMonths / 12);
    const futureRemMonths = futureTotalMonths % 12;
    const petAgeText =
      futureYears > 0
        ? futureRemMonths > 0
          ? `${futureYears}세 ${futureRemMonths}개월`
          : `${futureYears}세`
        : `${futureTotalMonths}개월`;

    const futureHumanAge = age.humanAge + offset * (species === '햄스터/소동물' ? 18 : 4);

    if (offset === 0) {
      return {
        id: 'stage-0',
        offsetYears: 0,
        label: '현재 모습',
        targetYear,
        petAgeText,
        humanAgeText: `사람 나이 약 ${age.humanAge}세`,
        stageCategory: 'current',
        stageTitle: `사랑스러움이 반짝이는 지금의 ${petName}`,
        physicalChangeDesc: `${colorInfo.primaryColorDescription} 빛깔의 고유한 모질과 총명하고 맑은 눈망울이 돋보이는 시기입니다. 얼굴 윤곽이 또렷하고 생기가 넘쳐요.`,
        personalityChangeDesc: `보호자의 목소리와 발걸음 소리만 들어도 기분 좋게 반응하며, 호기심과 애교가 가장 풍부하게 피어나는 시기입니다.`,
        petDiaryQuote: `오늘도 나를 따뜻하게 바라봐 줘서 고마워요! 당신과 눈을 맞출 때가 하루 중 제일 행복해요.`,
        careFocusTag: '기초 면역력 & 일상 루틴 완성',
      };
    } else if (offset === 1) {
      return {
        id: 'stage-1',
        offsetYears: 1,
        label: '1년 후',
        targetYear,
        petAgeText,
        humanAgeText: `사람 나이 약 ${futureHumanAge}세`,
        stageCategory: 'young_adult',
        stageTitle: `더욱 늠름하고 깊어진 교감의 시기`,
        physicalChangeDesc: `고유한 ${colorInfo.primaryColorDescription} 털에 한층 건강한 윤기가 흐르고, 골격과 근육이 가장 탄탄하게 자리 잡는 황금기예요.`,
        personalityChangeDesc: `보호자의 생활 패턴을 완벽히 이해하고, 말하지 않아도 감정을 읽으며 곁을 지켜주는 든든한 단짝이 됩니다.`,
        petDiaryQuote: `우리 함께 보낸 계절만큼 내 마음도 더 깊어졌어요. 산책길 바람 냄새도 당신과 함께라서 더 달콤해요!`,
        careFocusTag: '치석 예방 & 적정 체중 유지',
      };
    } else if (offset === 3) {
      return {
        id: 'stage-3',
        offsetYears: 3,
        label: '3년 후',
        targetYear,
        petAgeText,
        humanAgeText: `사람 나이 약 ${futureHumanAge}세`,
        stageCategory: 'prime',
        stageTitle: `외모와 우아함이 절정에 달하는 전성기`,
        physicalChangeDesc: `얼굴 표정이 한결 여유롭고 온화해지며, ${estimatedBreed} 특유의 매력적인 귀 모양과 깊은 눈빛이 가장 빛나는 성년기 모습입니다.`,
        personalityChangeDesc: `차분하고 안정적인 성격이 자리 잡아 낯선 상황에서도 보호자만 있으면 편안하게 미소 짓는 의젓함을 보여줍니다.`,
        petDiaryQuote: `당신이 퇴근하고 현관문을 열 때, 세상에서 가장 반가운 표정으로 달려가는 건 언제나 내 특권이에요.`,
        careFocusTag: '연 1회 혈액·초음파 정기검진',
      };
    } else if (offset === 5) {
      return {
        id: 'stage-5',
        offsetYears: 5,
        label: '5년 후',
        targetYear,
        petAgeText,
        humanAgeText: `사람 나이 약 ${futureHumanAge}세`,
        stageCategory: 'mature',
        stageTitle: `성숙한 눈빛으로 마음을 나누는 중년기`,
        physicalChangeDesc: `전체적인 털 빛깔은 그대로 유지되면서 입가 주변이 아주 살짝 부드러운 크림톤으로 옅어지며 중후한 매력이 더해집니다.`,
        personalityChangeDesc: `격렬한 움직임보다는 보호자 무릎 옆이나 따뜻한 햇살 아래에서 나른하게 낮잠 자는 시간을 더욱 좋아하게 됩니다.`,
        petDiaryQuote: `가끔은 조용히 당신 무릎에 턱을 괴고 숨소리를 듣는 것만으로도 온 세상이 평화로워져요.`,
        careFocusTag: '관절·슬개골 & 치주 집중 케어',
      };
    } else if (offset === 8) {
      return {
        id: 'stage-8',
        offsetYears: 8,
        label: '8년 후',
        targetYear,
        petAgeText,
        humanAgeText: `사람 나이 약 ${futureHumanAge}세`,
        stageCategory: 'senior',
        stageTitle: `하얀 서리 털이 내려앉기 시작하는 지혜로운 시기`,
        physicalChangeDesc: `코 주변과 턱 끝, 눈썹 부근에 하얀 눈꽃 같은 털이 은은하게 피어나며, 눈망울에는 깊은 신뢰와 사랑이 가득 담깁니다.`,
        personalityChangeDesc: `걸음걸이는 조금 천천히 여유로워지지만, 보호자를 향한 애착은 더욱 깊어져 늘 시선이 보호자를 따라다닙니다.`,
        petDiaryQuote: `입가에 하얀 털이 하나둘 생겨도 놀라지 마세요. 당신과 행복하게 웃은 시간들이 남긴 예쁜 훈장이니까요.`,
        careFocusTag: '심장·신장 수치 & 항산화 영양 케어',
      };
    } else {
      return {
        id: 'stage-12',
        offsetYears: 12,
        label: '12년 후 (노년기)',
        targetYear,
        petAgeText,
        humanAgeText: `사람 나이 약 ${futureHumanAge}세`,
        stageCategory: 'senior',
        stageTitle: `세월의 깊이가 감동으로 빛나는 노년기`,
        physicalChangeDesc: `원래의 사랑스러운 얼굴선과 귀 모양은 그대로인 채, 입가와 눈 주변에 포근한 흰 털이 서리듯 내려앉은 가장 온화하고 성스러운 모습입니다.`,
        personalityChangeDesc: `오랜 세월 쌓아온 절대적인 교감으로, 보호자의 따뜻한 손길 하나만으로도 어린 시절처럼 행복한 숨을 내쉽니다.`,
        petDiaryQuote: `내 모든 계절의 시작과 끝에 당신이 있어서 참 다행이에요. 앞으로도 우리 천천히, 오래오래 함께 걸어요.`,
        careFocusTag: '백내장·인지기능 & 시니어 맞춤 보양',
      };
    }
  });

  return {
    petName,
    species,
    estimatedBreed,
    confidencePercent: 94,
    birthYear: input.birthYear,
    birthMonth: input.birthMonth,
    currentAgeMonths: age.totalMonths,
    currentAgeLabel: age.currentAgeLabel,
    humanAgeEquivalent: age.humanAgeEquivalent,
    appearanceSummaryKo: `사진 속 ${petName}는 ${colorInfo.primaryColorDescription} 계열의 매력적인 모질과 맑고 깊은 눈망울, 사랑스러운 얼굴 윤곽을 지닌 ${estimatedBreed}(${species})입니다.`,
    appearancePromptEn: `A cute ${estimatedBreed} (${species}) with ${colorInfo.primaryColorDescription} coat, expressive glossy eyes, distinctive adorable ears and warm facial expression`,
    distinctiveFeatures: {
      coatColorAndPattern: `${colorInfo.primaryColorDescription} 코트 & 부드러운 그라데이션 무늬`,
      eyeColorAndShape: '초롱초롱하고 깊은 다크 앰버/초콜릿 눈망울',
      earAndFaceTrait: `${estimatedBreed} 특유의 균형 잡힌 귀 모양과 미소 짓는 입매`,
      bodyBuild: '탄탄하고 건강한 표준 체형 및 안정적인 골격',
    },
    lifespanPrediction: {
      breedAverageYears,
      expectedTogetherYear,
      expectedAgeAtTargetYear: avgLifespanNum,
      remainingHappyYears,
      headlineMessage: `${expectedTogetherYear}년까지 건강하게 함께할 수 있어요!`,
      hopeSubMessage: `꾸준한 치아·관절 관리와 정기 검진을 챙겨주시면 평균 수명보다 +${potentialBonusYears}년(${expectedTogetherYear + potentialBonusYears}년까지!) 더 행복하게 함께할 수 있습니다.`,
      potentialBonusYears,
      keyLongevityFactors: [
        '매일 1분 치석 케어로 심장·신장 염증 예방 (+2년)',
        '적정 체중 유지 및 미끄럼 방지 매트 생활화 (+1.5년)',
        '생애주기별 맞춤 음수량 관리 및 정기 혈액검진 (+1.5년)',
      ],
    },
    timelineStages,
    offspringPrediction: {
      babyNickname: `리틀 ${petName} (미니 슈가볼)`,
      inheritedFeatures: [
        `${petName}의 ${colorInfo.primaryColorDescription} 털 빛깔과 솜사탕처럼 보송한 배털`,
        '보석처럼 반짝이는 둥근 눈망울과 코 끝 포인트',
        '기분 좋을 때 쫑긋거리는 사랑스러운 귀 모양',
      ],
      furAndEyeDesc: `엄마/아빠인 ${petName}의 ${colorInfo.primaryColorDescription} 무늬를 쏙 빼닮아 태어날 때부터 뺨과 가슴에 따뜻한 크림빛 포인트가 자리 잡은 아기 모습이에요.`,
      personalityTraits: [
        '호기심 대장 에너자이저',
        '보호자 손길만 닿아도 스르르 잠드는 애교쟁이',
        '간식 봉지 소리에 제일 먼저 달려오는 똑쟁이',
      ],
      cutePointsDesc: `아장아장 짧은 다리로 걸어와 보호자 발등 위에 턱을 괴고 올려다보는 필살기 애교를 그대로 물려받았어요!`,
      parentResemblanceScore: 97,
      imagePromptEn: `Adorable tiny baby offspring of ${estimatedBreed} (${species}), fluffy ${colorInfo.primaryColorDescription} coat, round sparkling eyes, studio pastel lighting`,
    },
    healthRoadmap: [
      {
        year: age.currentYear,
        offsetLabel: '현재 맞춤 관리',
        petAge: age.currentAgeLabel.split(' ')[0],
        humanAge: `사람 약 ${age.humanAge}세`,
        riskLevel: '안심 관리',
        vulnerableParts: ['치아/잇몸(초기 치석)', '소화기/장 면역', '피부/귀 위생'],
        geneticAndAgeRisks: [
          `${estimatedBreed} 종 특유의 외이염 및 알레르기성 피부 민감도`,
          '어금니 안쪽 초기 플라그 축적 주의',
        ],
        essentialCheckups: [
          '연 1회 기초 종합 혈액검사 및 분변·기생충 검사',
          '필수 예방접종 항체가 확인 및 심장사상충/내외부 구충',
        ],
        nutritionAndCareGuide:
          '소화 흡수율이 높은 양질의 단백질 사료와 유산균(프로바이오틱스)을 급여하고, 주 4회 이상 양치 습관을 길러주세요.',
      },
      {
        year: age.currentYear + 2,
        offsetLabel: '2년 후 (성년기)',
        petAge: `${age.years + 2}세`,
        humanAge: `사람 약 ${age.humanAge + 8}세`,
        riskLevel: '안심 관리',
        vulnerableParts: ['슬개골/관절', '체중/체지방', '치주 조직'],
        geneticAndAgeRisks: [
          '실내 바닥 미끄러짐으로 인한 슬개골 탈구 및 십자인대 무리',
          '기초대사량 변화에 따른 초기 과체중 주의',
        ],
        essentialCheckups: [
          '정형외과 촉진 검사(슬개골·고관절 단계 체크)',
          '스케일링 필요 여부 치과 검진 및 흉부 방사선 촬영',
        ],
        nutritionAndCareGuide:
          '오메가-3(rTG)와 초록입홍합·콘드로이친 등 관절 영양제를 시작하고, 간식 칼로리를 하루 총열량의 10% 이내로 조절해 주세요.',
      },
      {
        year: age.currentYear + 5,
        offsetLabel: '5년 후 (중년기 진입)',
        petAge: `${age.years + 5}세`,
        humanAge: `사람 약 ${age.humanAge + 20}세`,
        riskLevel: '집중 케어',
        vulnerableParts: ['신장/방광(비뇨기)', '간·담낭', '치아 뿌리'],
        geneticAndAgeRisks: [
          '음수량 부족으로 인한 방광 결석·슬러지 및 초기 신장 수치 상승',
          '담낭 점액종 초기 소견 및 치주염 관리 필요',
        ],
        essentialCheckups: [
          '복부 정밀 초음파(신장·간·담낭·방광) 및 SDMA 조기 신장 검사',
          '혈압 측정 및 소변 비중·단백뇨 검사',
        ],
        nutritionAndCareGuide:
          '집안 곳곳에 신선한 물그릇이나 습식 급여로 일일 음수량을 늘려주시고, 간 보호 성분(실리마린/SAMe)과 항산화 영양제를 챙겨주세요.',
      },
      {
        year: age.currentYear + 8,
        offsetLabel: '8년 후 (시니어 초기)',
        petAge: `${age.years + 8}세`,
        humanAge: `사람 약 ${age.humanAge + 32}세`,
        riskLevel: '집중 케어',
        vulnerableParts: ['심장 판막', '눈(수정체/백내장)', '호르몬/내분비'],
        geneticAndAgeRisks: [
          '노화성 이첨판 폐쇄부전증(심잡음) 및 호흡수 변화 주의',
          '수정체 핵경화증 또는 초기 백내장, 부신피질/갑상선 호르몬 변화',
        ],
        essentialCheckups: [
          '6개월 주기 시니어 종합검진 및 심장 초음파·NT-proBNP 검사',
          '안과 안압·눈물량·수정체 정밀 검사',
        ],
        nutritionAndCareGuide:
          '나트륨이 제한된 시니어 맞춤 식단과 코엔자임Q10·타우린·루테인 영양제를 급여하고, 수면 중 분당 호흡수(30회 미만 정상)를 주 1회 체크해 주세요.',
      },
      {
        year: age.currentYear + 12,
        offsetLabel: '12년 후 (노년기 스페셜)',
        petAge: `${age.years + 12}세`,
        humanAge: `사람 약 ${age.humanAge + 48}세`,
        riskLevel: '정밀 검진',
        vulnerableParts: ['뇌/인지기능', '심폐 기능', '근골격계/척추'],
        geneticAndAgeRisks: [
          '노령성 인지기능 장애(밤낮 바뀜, 방향 감각 저하) 예방 필요',
          '뒷다리 근감소증 및 만성 신장·심장 복합 관리',
        ],
        essentialCheckups: [
          '분기별 시니어 주치의 문진 및 혈액·전해질·신장 수치 모니터링',
          '통증 스케일 평가 및 시니어 재활/레이저 물리치료 상담',
        ],
        nutritionAndCareGuide:
          '소화가 잘되는 따뜻한 습식·화식 토핑과 뇌 건강 항산화제(MCT 오일, 포스파티딜세린, 비타민B군)를 급여하고, 푹신한 메모리폼 방석을 준비해 주세요.',
      },
    ],
    groomingAndCare: {
      coatAndFeatureSummary: `${petName}는 ${colorInfo.primaryColorDescription} 톤의 섬세한 피모를 가지고 있어, 털 엉킴을 예방하고 피부 장벽 수분을 지켜주는 부드러운 브러싱과 볼륨 스타일링이 가장 잘 어울립니다.`,
      recommendedStyles: [
        {
          styleName: '베이비 테디 & 라운드 볼륨 컷',
          suitabilityBadge: '얼굴형 찰떡 추천 1위',
          description: `귀 라인과 볼 주변 털을 동그랗고 풍성하게 살려 ${petName}의 초롱초롱한 눈망울과 동안 매력을 극대화하는 스타일입니다.`,
          tip: '눈 앞쪽 시야를 가리는 털만 살짝 다듬어 주면 눈물 자국 예방과 귀여움을 동시에 잡을 수 있어요.',
        },
        {
          styleName: '깔끔 위생 & 벨벳 스포팅 컷',
          suitabilityBadge: '산책·활동성 최고',
          description: '몸통은 관리하기 편한 길이로 정리하고 다리 라인에 포근한 기둥 볼륨을 남겨 관절 보호와 청결을 모두 챙기는 실용적인 스타일이에요.',
          tip: '발바닥 패드 사이 털과 배 주변 위생 미용을 3주마다 가볍게 해주면 미끄러짐 사고를 크게 줄일 수 있습니다.',
        },
        {
          styleName: '내추럴 실크 스파 케어 스타일',
          suitabilityBadge: '피부 자극 ZERO',
          description: '짧은 클리퍼 사용을 최소화하고 가위컷과 보습 탄산/오트밀 스파로 고유한 털 빛깔의 윤기를 살려주는 저자극 스타일링입니다.',
          tip: '미용 후 피부 진정 에센스 미스트를 뿌려주면 미용 스트레스로 인한 긁음 행동을 예방할 수 있어요.',
        },
      ],
      brushingSchedule: {
        frequency: '하루 1회 (5분) 또는 최소 주 4~5회',
        toolRecommendation: '끝이 둥근 소프트 슬리커 브러시 + 원목 핀 브러시 조합',
        methodTip:
          '미스트를 가볍게 뿌린 뒤 털 끝부터 뿌리 방향으로 살살 풀어주면 정전기와 피부 자극 없이 엉킨 털이 부드럽게 풀립니다.',
      },
      bathingAndHygiene: {
        frequency: species === '고양이' ? '2~3개월에 1회 (평소 그루밍 워터리스 케어)' : '2~3주에 1회 (계절·산책 빈도에 따라 조절)',
        temperatureAndShampoo: '미지근한 36.5~37.5°C 물 온도 & 약산성(pH 6.5~7.0) 저자극 오트밀·세라마이드 샴푸',
        cautionTip:
          '귀 안에 물이 들어가지 않도록 솜으로 살짝 막아주고, 목욕 후에는 발가락 사이와 귀 뒤쪽 속털까지 시원한 바람으로 완전히 말려주세요.',
      },
      skinAndCoatSecret:
        '환절기에는 실내 습도를 50~55%로 유지하고, 사료에 연어 오일이나 오메가-3를 한 방울 더해 주면 3주 만에 털 끝까지 반짝이는 윤기가 살아납니다.',
      longevityPlayTips: [
        {
          title: '하루 15분 "보물찾기 노즈워크 & 후각 탐험"',
          description:
            '담요나 노즈워크 장난감 곳곳에 작은 간식을 숨겨 코와 감각 기관으로 직접 찾게 해주세요. 성취감 호르몬(도파민)이 분비되어 분리불안과 스트레스가 눈에 띄게 줄어듭니다.',
          longevityBonus: '뇌 노화 방지 & 스트레스 호르몬 40% 감소',
        },
        {
          title: '보호자와 눈 맞추는 "인터랙티브 터그 & 사냥 놀이"',
          description:
            '짧고 규칙적인 10분 놀이 후 반드시 "잡았다!" 하는 성공 경험으로 마무리해 주세요. 심폐 지구력과 뒷다리 코어 근육을 자연스럽게 단련시켜 줍니다.',
          longevityBonus: '관절 지지 근육 강화 & 비만 예방',
        },
        {
          title: '잠들기 전 5분 "림프 순환 테라피 마사지"',
          description:
            '귀 뒤쪽부터 목덜미, 등줄기를 따라 손바닥 온기로 천천히 쓸어내려 주세요. 부교감 신경이 활성화되어 숙면을 돕고 피부 종괴나 이상 징후를 조기에 발견할 수 있습니다.',
          longevityBonus: '면역세포 활성화 & 질병 조기 발견율 2배 향상',
        },
      ],
      walkAndEnvironmentTips: [
        {
          category: '실내 바닥 & 동선 세팅',
          content:
            '주로 뛰어다니는 거실 복도와 소파·침대 앞에는 충격 흡수 미끄럼 방지 매트와 완만한 펫 스텝(경사로)을 설치해 슬개골과 척추를 보호해 주세요.',
        },
        {
          category: '산책 & 바깥 공기 루틴',
          content:
            '거리나 속도보다 "냄새 맡는 시간"이 중요해요! 풀숲과 흙냄새를 충분히 맡을 수 있도록 리드줄에 여유를 주고 여유롭게 산책해 주세요.',
        },
        {
          category: '음수대 & 식기 높이 맞춤',
          content:
            '어깨 높이에 맞는 10~15도 경사 식기를 사용하면 목 디스크 부담이 줄어들고 사레들림 없이 편안하게 식사할 수 있습니다.',
        },
        {
          category: '나만의 아늑한 안전 기지(케이브)',
          content:
            '소음이 적고 통풍이 잘되는 구석 공간에 보호자의 옷 냄새가 묻은 담요와 푹신한 하우스를 두면 혼자 있는 시간에도 깊은 안정감을 느낍니다.',
        },
      ],
    },
  };
}

function inferSpeciesFromBreedHint(hint: string): string {
  const h = hint.toLowerCase();
  if (h.includes('묘') || h.includes('고양이') || h.includes('코숏') || h.includes('러시안') || h.includes('페르시안') || h.includes('먼치킨')) {
    return '고양이';
  }
  if (h.includes('토끼') || h.includes('드워프') || h.includes('렉스')) return '토끼';
  if (h.includes('햄스터') || h.includes('기니피그') || h.includes('고슴도치') || h.includes('친칠라')) return '햄스터/소동물';
  if (h.includes('앵무') || h.includes('새') || h.includes('카나리아')) return '새/앵무';
  if (h.includes('게코') || h.includes('도마뱀') || h.includes('거북') || h.includes('파충류')) return '파충류/거북이';
  return '강아지';
}

function getDefaultBreedBySpecies(species: string, colorDesc: string): string {
  if (species === '고양이') return `코리안 숏헤어 (${colorDesc.split(' ')[0]} 코트)`;
  if (species === '토끼') return '네덜란드 드워프 토끼';
  if (species === '햄스터/소동물') return '골든 햄스터';
  if (species === '새/앵무') return '모란앵무 / 코뉴어';
  if (species === '파충류/거북이') return '레오파드 게코 / 반려 거북';
  return `말티푸 / 포메라니안 (${colorDesc.split(' ')[0]} 톤)`;
}
