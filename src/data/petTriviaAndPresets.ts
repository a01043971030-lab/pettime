import { PetSpeciesCategory } from '../types';

export interface PetTriviaItem {
  category: string;
  emoji: string;
  title: string;
  fact: string;
}

export const PET_TRIVIA_LIST: PetTriviaItem[] = [
  {
    category: '강아지 감동 상식',
    emoji: '🐶',
    title: '보호자의 냄새는 최고의 안정제예요',
    fact: '강아지의 뇌를 MRI로 촬영하면, 다른 어떤 자극보다 보호자의 체취를 맡았을 때 행복과 사랑을 느끼는 영역이 가장 활발하게 반짝인답니다.'
  },
  {
    category: '고양이 감동 상식',
    emoji: '🐱',
    title: '눈 키스는 고양이의 "사랑해" 표현이에요',
    fact: '고양이가 당신을 바라보며 천천히 눈을 감았다 뜨는 행동은 "당신 곁에서 가장 안전하고 행복해요"라는 최고의 신뢰 표현입니다.'
  },
  {
    category: '장수 비결 꿀팁',
    emoji: '🦷',
    title: '양치질만 잘해도 수명이 2~3년 늘어나요!',
    fact: '치석 속 세균은 혈관을 타고 심장과 신장에 영향을 줄 수 있어요. 매일 가벼운 치아 관리만 해줘도 기대 수명을 최대 20%까지 늘릴 수 있습니다.'
  },
  {
    category: '소동물 상식',
    emoji: '🐰',
    title: '토끼가 공중으로 폴짝 뛰는 "빙키(Binky)"',
    fact: '토끼가 갑자기 제자리에서 몸을 비틀며 폴짝 뛰는 행동은 주체할 수 없을 만큼 기분이 좋고 행복할 때 추는 기쁨의 춤이에요!'
  },
  {
    category: '강아지 건강 상식',
    emoji: '👃',
    title: '산책할 때 "킁킁" 냄새 맡기는 뇌 운동이에요',
    fact: '15분 동안 코로 냄새를 맡는 노즈워크 산책은 단순 달리기 1시간보다 스트레스 호르몬을 훨씬 더 많이 낮춰주고 치매 예방에 큰 도움을 줍니다.'
  },
  {
    category: '고양이 건강 상식',
    emoji: '💧',
    title: '물그릇을 집안 곳곳에 두면 신장이 건강해져요',
    fact: '사막 동물의 후손인 고양이는 갈증을 잘 느끼지 못해요. 생활 공간 여러 곳에 신선한 물그릇을 두면 음수량이 30% 이상 늘어납니다.'
  },
  {
    category: '햄스터 & 소동물',
    emoji: '🐹',
    title: '햄스터의 볼주머니는 어깨까지 이어져 있어요',
    fact: '햄스터는 자기 몸무게의 20%에 달하는 먹이를 볼주머니에 넣을 수 있어요. 안전한 집이라고 느낄 때 보물창고에 먹이를 차곡차곡 쌓아둔답니다.'
  },
  {
    category: '반려조 & 파충류',
    emoji: '🦜',
    title: '앵무새와 파충류도 보호자의 목소리 톤을 기억해요',
    fact: '부드럽고 일정한 톤으로 이름을 불러주면 심박수가 안정되고 보호자의 손길을 따뜻한 안식처로 인식하게 됩니다.'
  }
];

export interface SamplePetPreset {
  id: string;
  label: string;
  badge: string;
  name: string;
  species: PetSpeciesCategory;
  breedHint: string;
  birthYear: number;
  birthMonth: number;
  gender: '남아' | '여아' | '중성화 완료';
  furColorHex: string;
  secondaryHex: string;
  eyeColorHex: string;
  avatarEmoji: string;
}

export const SAMPLE_PET_PRESETS: SamplePetPreset[] = [
  {
    id: 'maltipoo-bori',
    label: '🐶 보리 (말티푸 · 2세)',
    badge: '인기 강아지',
    name: '보리',
    species: '강아지',
    breedHint: '크림 애프리콧 말티푸',
    birthYear: 2024,
    birthMonth: 5,
    gender: '여아',
    furColorHex: '#F3D2B3',
    secondaryHex: '#FFF6EC',
    eyeColorHex: '#3B281E',
    avatarEmoji: '🐶'
  },
  {
    id: 'cat-cheese',
    label: '🐱 치즈 (코리안숏헤어 · 3세)',
    badge: '인기 고양이',
    name: '치즈',
    species: '고양이',
    breedHint: '코리안 숏헤어 치즈태비',
    birthYear: 2023,
    birthMonth: 8,
    gender: '중성화 완료',
    furColorHex: '#F4A261',
    secondaryHex: '#FFF8F0',
    eyeColorHex: '#D99B26',
    avatarEmoji: '🐱'
  },
  {
    id: 'rabbit-gureum',
    label: '🐰 구름이 (드워프 토끼 · 1세)',
    badge: '귀여운 토끼',
    name: '구름이',
    species: '토끼',
    breedHint: '네덜란드 드워프 화이트&시나몬',
    birthYear: 2025,
    birthMonth: 3,
    gender: '여아',
    furColorHex: '#F9F5F0',
    secondaryHex: '#E6CCB2',
    eyeColorHex: '#4A2C2A',
    avatarEmoji: '🐰'
  },
  {
    id: 'hamster-sun',
    label: '🐹 해바라기 (골든햄스터 · 8개월)',
    badge: '소동물',
    name: '해바라기',
    species: '햄스터/소동물',
    breedHint: '골든 햄스터 크림밴디드',
    birthYear: 2026,
    birthMonth: 3,
    gender: '남아',
    furColorHex: '#F2C57C',
    secondaryHex: '#FFFDF7',
    eyeColorHex: '#2B1B17',
    avatarEmoji: '🐹'
  }
];
