import { GeneratedPetImages, PetTimeAnalysisResult, TimelineStage } from '../types';
import { SamplePetPreset } from '../data/petTriviaAndPresets';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

export async function analyzeUploadedPhotoColors(dataUrl: string): Promise<{
  primaryColorDescription: string;
  rgbHex: string;
  brightness: '밝은 톤' | '중간 톤' | '진한 톤';
}> {
  try {
    const img = await loadImage(dataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    ctx.drawImage(img, 0, 0, 64, 64);
    // Sample center region (where the pet usually is)
    const data = ctx.getImageData(16, 16, 32, 32).data;
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) {
      rSum += data[i];
      gSum += data[i + 1];
      bSum += data[i + 2];
      count++;
    }
    const r = Math.round(rSum / count);
    const g = Math.round(gSum / count);
    const b = Math.round(bSum / count);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b);

    let colorDesc = '크림 & 소프트 브라운';
    if (lum > 205) colorDesc = '순백색 & 밝은 크림 화이트';
    else if (lum < 65) colorDesc = '차콜 블랙 & 다크 에스프레소';
    else if (r > g + 25 && g > b + 15) colorDesc = '따뜻한 치즈 코랄 & 애프리콧 골드';
    else if (r > b + 20) colorDesc = '포근한 베이지 & 카라멜 브라운';
    else colorDesc = '은은한 실버 그레이 & 바이컬러';

    const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
    const brightness = lum > 180 ? '밝은 톤' : lum < 90 ? '진한 톤' : '중간 톤';

    return { primaryColorDescription: colorDesc, rgbHex: hex, brightness };
  } catch {
    return { primaryColorDescription: '따뜻한 크림 & 베이지 코트', rgbHex: '#E8C5A5', brightness: '밝은 톤' };
  }
}

/**
 * Generates a realistic, warm studio illustration photo for sample pet presets
 */
export function createSamplePresetPhoto(preset: SamplePetPreset): string {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;

  // Warm studio radial background
  const bgGrad = ctx.createRadialGradient(360, 320, 60, 360, 360, 460);
  bgGrad.addColorStop(0, '#FFFDF9');
  bgGrad.addColorStop(0.55, '#FDEEE4');
  bgGrad.addColorStop(1, '#F5D6C6');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 720, 720);

  // Soft bokeh circles in background
  const bokehs = [
    { x: 140, y: 150, r: 55, c: 'rgba(255, 255, 255, 0.45)' },
    { x: 580, y: 180, r: 70, c: 'rgba(255, 210, 185, 0.35)' },
    { x: 120, y: 520, r: 65, c: 'rgba(255, 190, 165, 0.25)' },
    { x: 600, y: 500, r: 50, c: 'rgba(255, 255, 255, 0.4)' },
  ];
  bokehs.forEach((b) => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = b.c;
    ctx.fill();
  });

  // Soft cushion/floor at bottom
  ctx.beginPath();
  ctx.ellipse(360, 650, 290, 85, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#EED7C5';
  ctx.fill();

  // Shadow under pet
  ctx.beginPath();
  ctx.ellipse(360, 610, 175, 36, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(74, 78, 105, 0.14)';
  ctx.fill();

  ctx.save();
  // Draw species-specific detailed portrait
  if (preset.species === '강아지') {
    // Floppy fluffy Maltipoo ears
    ctx.fillStyle = '#E5B892';
    ctx.beginPath();
    ctx.ellipse(195, 345, 68, 125, 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(525, 345, 68, 125, -0.28, 0, Math.PI * 2);
    ctx.fill();

    // Body
    const bodyGrad = ctx.createRadialGradient(360, 520, 30, 360, 540, 160);
    bodyGrad.addColorStop(0, preset.secondaryHex);
    bodyGrad.addColorStop(1, preset.furColorHex);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(360, 535, 145, 120, 0, 0, Math.PI * 2);
    ctx.fill();

    // White chest bib
    ctx.fillStyle = '#FFFDF9';
    ctx.beginPath();
    ctx.ellipse(360, 510, 75, 65, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fluffy Head
    const headGrad = ctx.createRadialGradient(360, 295, 30, 360, 310, 175);
    headGrad.addColorStop(0, '#FFF8F0');
    headGrad.addColorStop(0.65, preset.furColorHex);
    headGrad.addColorStop(1, '#E2B48D');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(360, 315, 152, 0, Math.PI * 2);
    ctx.fill();

    // Fluffy curls around top of head
    const curls = [
      { x: 280, y: 185, r: 46 },
      { x: 340, y: 168, r: 52 },
      { x: 405, y: 175, r: 48 },
      { x: 455, y: 205, r: 42 },
      { x: 235, y: 225, r: 42 },
    ];
    ctx.fillStyle = preset.furColorHex;
    curls.forEach((c) => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Muzzle puff
    ctx.fillStyle = '#FFF9F2';
    ctx.beginPath();
    ctx.ellipse(298, 362, 66, 52, -0.1, 0, Math.PI * 2);
    ctx.ellipse(422, 362, 66, 52, 0.1, 0, Math.PI * 2);
    ctx.fill();

  } else if (preset.species === '고양이') {
    // Pointed cat ears
    ctx.fillStyle = preset.furColorHex;
    ctx.beginPath();
    ctx.moveTo(205, 275);
    ctx.lineTo(175, 125);
    ctx.lineTo(305, 195);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(515, 275);
    ctx.lineTo(545, 125);
    ctx.lineTo(415, 195);
    ctx.closePath();
    ctx.fill();

    // Pink inner ears
    ctx.fillStyle = '#F7B2AD';
    ctx.beginPath();
    ctx.moveTo(215, 255);
    ctx.lineTo(195, 155);
    ctx.lineTo(282, 205);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(505, 255);
    ctx.lineTo(525, 155);
    ctx.lineTo(438, 205);
    ctx.closePath();
    ctx.fill();

    // Body
    ctx.fillStyle = preset.furColorHex;
    ctx.beginPath();
    ctx.ellipse(360, 535, 140, 120, 0, 0, Math.PI * 2);
    ctx.fill();

    // White bib
    ctx.fillStyle = '#FFFDF9';
    ctx.beginPath();
    ctx.ellipse(360, 525, 85, 78, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cat Head
    ctx.fillStyle = preset.furColorHex;
    ctx.beginPath();
    ctx.ellipse(360, 320, 158, 138, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tabby forehead stripes ('M' pattern)
    ctx.strokeStyle = '#C86D2D';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    [-35, 0, 35].forEach((dx) => {
      ctx.beginPath();
      ctx.moveTo(360 + dx, 205);
      ctx.lineTo(360 + dx * 0.7, 255);
      ctx.stroke();
    });

    // White lower cheeks
    ctx.fillStyle = '#FFFDF9';
    ctx.beginPath();
    ctx.ellipse(360, 375, 105, 72, 0, 0, Math.PI * 2);
    ctx.fill();

  } else if (preset.species === '토끼') {
    // Long upright rabbit ears
    ctx.fillStyle = preset.secondaryHex;
    ctx.beginPath();
    ctx.ellipse(285, 145, 42, 118, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(435, 145, 42, 118, 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FAD2CF';
    ctx.beginPath();
    ctx.ellipse(285, 150, 22, 85, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(435, 150, 22, 85, 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = preset.furColorHex;
    ctx.beginPath();
    ctx.ellipse(360, 535, 150, 115, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chubby bunny cheeks & head
    ctx.fillStyle = preset.furColorHex;
    ctx.beginPath();
    ctx.ellipse(360, 345, 155, 135, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Round hamster ears
    ctx.fillStyle = '#E5B079';
    ctx.beginPath();
    ctx.arc(225, 220, 48, 0, Math.PI * 2);
    ctx.arc(495, 220, 48, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F7C6C2';
    ctx.beginPath();
    ctx.arc(225, 220, 28, 0, Math.PI * 2);
    ctx.arc(495, 220, 28, 0, Math.PI * 2);
    ctx.fill();

    // Chubby body & head combined
    ctx.fillStyle = preset.furColorHex;
    ctx.beginPath();
    ctx.ellipse(360, 415, 175, 195, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFDF9';
    ctx.beginPath();
    ctx.ellipse(360, 455, 125, 130, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Expressive glossy eyes (common to all presets)
  const eyeY = preset.species === '토끼' ? 325 : 305;
  const eyeOffsetX = 68;
  [360 - eyeOffsetX, 360 + eyeOffsetX].forEach((ex) => {
    // Eye socket shadow
    ctx.fillStyle = 'rgba(59, 40, 30, 0.15)';
    ctx.beginPath();
    ctx.arc(ex, eyeY + 3, 28, 0, Math.PI * 2);
    ctx.fill();

    // Iris
    ctx.fillStyle = preset.eyeColorHex;
    ctx.beginPath();
    ctx.arc(ex, eyeY, 25, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#181210';
    ctx.beginPath();
    ctx.arc(ex, eyeY, 16, 0, Math.PI * 2);
    ctx.fill();

    // Catchlights (sparkling life in eyes)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ex - 7, eyeY - 7, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex + 8, eyeY + 6, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Cute nose & gentle smile
  const noseY = eyeY + 48;
  ctx.fillStyle = preset.species === '강아지' ? '#3B281E' : '#F28B82';
  ctx.beginPath();
  ctx.ellipse(360, noseY, 22, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nose shine
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.ellipse(354, noseY - 5, 8, 4, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Mouth W-curve
  ctx.strokeStyle = '#5C4033';
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(342, noseY + 18, 18, 0, Math.PI * 0.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(378, noseY + 18, 18, Math.PI * 0.15, Math.PI);
  ctx.stroke();

  // Soft rosy cheeks
  ctx.fillStyle = 'rgba(255, 126, 103, 0.22)';
  ctx.beginPath();
  ctx.ellipse(255, noseY + 5, 28, 16, 0, 0, Math.PI * 2);
  ctx.ellipse(465, noseY + 5, 28, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Applies realistic age progression or baby simulation directly onto the uploaded pet photo
 * so that the pet's unique fur color, markings, eyes, and face remain 100% consistent!
 */
export async function renderConsistentPetStagePhoto(
  baseImageSrc: string,
  stageType: 'current' | 'prime' | 'mature' | 'senior' | 'offspring',
  offsetYears: number,
  badgeLabel: string,
  subLabel: string
): Promise<string> {
  const img = await loadImage(baseImageSrc);
  const size = 720;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Center-crop square from original image
  const minSide = Math.min(img.width, img.height);
  const sx = (img.width - minSide) / 2;
  const sy = (img.height - minSide) / 2;

  ctx.save();

  if (stageType === 'current') {
    ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
  } else if (stageType === 'prime') {
    // Prime Adult: Rich glossy coat contrast, vibrant warmth, healthy shine
    ctx.filter = 'contrast(1.07) saturate(1.12) brightness(1.03)';
    ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
    ctx.filter = 'none';

    // Warm golden sunlight rim glow representing peak vitality
    const sunGrad = ctx.createRadialGradient(size * 0.5, size * 0.35, size * 0.1, size * 0.5, size * 0.5, size * 0.65);
    sunGrad.addColorStop(0, 'rgba(255, 248, 225, 0.12)');
    sunGrad.addColorStop(0.7, 'rgba(255, 180, 120, 0.08)');
    sunGrad.addColorStop(1, 'rgba(74, 78, 105, 0.12)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, size, size);
  } else if (stageType === 'mature' || stageType === 'senior') {
    // Gradual aging progression proportional to offsetYears (e.g., 5 to 15 years)
    const frostIntensity = Math.min(1, Math.max(0.25, (offsetYears - 3) / 10));
    const desaturate = Math.round(100 - frostIntensity * 22);
    const contrastVal = (1 - frostIntensity * 0.08).toFixed(2);
    const brightnessVal = (1 + frostIntensity * 0.05).toFixed(2);

    ctx.filter = `saturate(${desaturate}%) contrast(${contrastVal}) brightness(${brightnessVal})`;
    ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
    ctx.filter = 'none';

    // Realistic frosty white/silver fur overlay around muzzle, chin, and eyebrow regions
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // Muzzle & chin frost zone
    const muzzleGrad = ctx.createRadialGradient(
      size * 0.5,
      size * 0.57,
      size * 0.02,
      size * 0.5,
      size * 0.58,
      size * 0.24
    );
    muzzleGrad.addColorStop(0, `rgba(255, 253, 250, ${(0.34 * frostIntensity).toFixed(2)})`);
    muzzleGrad.addColorStop(0.55, `rgba(245, 245, 250, ${(0.20 * frostIntensity).toFixed(2)})`);
    muzzleGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = muzzleGrad;
    ctx.fillRect(0, 0, size, size);

    // Eyebrow & around-eye gentle silver frost
    [size * 0.37, size * 0.63].forEach((eyeX) => {
      const browGrad = ctx.createRadialGradient(
        eyeX,
        size * 0.38,
        size * 0.01,
        eyeX,
        size * 0.38,
        size * 0.12
      );
      browGrad.addColorStop(0, `rgba(255, 253, 250, ${(0.28 * frostIntensity).toFixed(2)})`);
      browGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = browGrad;
      ctx.fillRect(0, 0, size, size);
    });

    // Fine silver hair wisps around muzzle & cheeks for realistic texture
    ctx.strokeStyle = `rgba(255, 254, 252, ${(0.22 * frostIntensity).toFixed(2)})`;
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    const seedPoints = 85;
    for (let i = 0; i < seedPoints; i++) {
      const angle = (i / seedPoints) * Math.PI * 2;
      const radius = size * (0.07 + ((i * 19) % 15) * 0.01);
      const cx = size * 0.5 + Math.cos(angle) * radius * 1.15;
      const cy = size * 0.56 + Math.sin(angle) * radius * 0.85;
      const len = 8 + (i % 7) * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len + 3);
      ctx.stroke();
    }
    ctx.restore();

    // Warm, gentle nostalgic sunset vignette
    const vignette = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.25, size * 0.5, size * 0.5, size * 0.68);
    vignette.addColorStop(0, 'rgba(255, 245, 235, 0)');
    vignette.addColorStop(1, `rgba(110, 85, 70, ${(0.22 * frostIntensity).toFixed(2)})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, size, size);
  } else if (stageType === 'offspring') {
    // Baby/Offspring Simulation: Soft pastel dream background + zoom-in baby face proportion + fluffy soft halo
    const babyBg = ctx.createLinearGradient(0, 0, size, size);
    babyBg.addColorStop(0, '#FFF8F3');
    babyBg.addColorStop(1, '#FFE8DF');
    ctx.fillStyle = babyBg;
    ctx.fillRect(0, 0, size, size);

    // Draw slightly tighter crop centered on the pet's face with soft bright baby filter
    const cropMargin = minSide * 0.08;
    ctx.save();
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, size * 0.44, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.filter = 'brightness(1.08) saturate(1.08) contrast(0.96)';
    ctx.drawImage(
      img,
      sx + cropMargin,
      sy + cropMargin * 0.8,
      minSide - cropMargin * 2,
      minSide - cropMargin * 2,
      size * 0.05,
      size * 0.05,
      size * 0.9,
      size * 0.9
    );
    ctx.filter = 'none';

    // Soft baby milk-light glow around edges
    const babyGlow = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.26, size * 0.5, size * 0.5, size * 0.45);
    babyGlow.addColorStop(0, 'rgba(255, 255, 255, 0)');
    babyGlow.addColorStop(0.75, 'rgba(255, 240, 232, 0.25)');
    babyGlow.addColorStop(1, 'rgba(255, 235, 225, 0.85)');
    ctx.fillStyle = babyGlow;
    ctx.fillRect(0, 0, size, size);
    ctx.restore();

    // Cute circular pastel frame
    ctx.strokeStyle = '#FF7E67';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, size * 0.445, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Subtle top-left stage badge overlay inside the image for saved photos
  ctx.fillStyle = 'rgba(43, 45, 66, 0.68)';
  ctx.beginPath();
  ctx.roundRect(22, 22, Math.max(170, badgeLabel.length * 18 + 38), 44, 22);
  ctx.fill();

  ctx.fillStyle = '#FFFDF9';
  ctx.font = 'bold 19px "Pretendard Variable", Pretendard, sans-serif';
  ctx.fillText(badgeLabel, 40, 50);

  if (subLabel) {
    ctx.fillStyle = 'rgba(255, 126, 103, 0.92)';
    ctx.beginPath();
    ctx.roundRect(22, 74, Math.max(140, subLabel.length * 14 + 32), 34, 17);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 15px "Pretendard Variable", Pretendard, sans-serif';
    ctx.fillText(subLabel, 36, 96);
  }

  ctx.restore();
  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Generates a downloadable & shareable high-resolution Korean Result Photo Card
 */
export async function generateResultSummaryCardDataUrl(
  result: PetTimeAnalysisResult,
  images: GeneratedPetImages,
  selectedStage: TimelineStage
): Promise<string> {
  const width = 1080;
  const height = 1520;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Background (#FFFDF9 to #FFF3EB)
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#FFFDF9');
  bg.addColorStop(0.5, '#FFF8F1');
  bg.addColorStop(1, '#FDECE3');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Decorative outer border
  ctx.strokeStyle = '#FFC5BB';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(28, 28, width - 56, height - 56, 36);
  ctx.stroke();

  // 2. Top Brand Header
  ctx.fillStyle = '#FF7E67';
  ctx.beginPath();
  ctx.roundRect(64, 62, 260, 42, 21);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px "Pretendard Variable", Pretendard, sans-serif';
  ctx.fillText('🐾 펫타임 (PetTime) AI', 88, 90);

  ctx.fillStyle = '#4A4E69';
  ctx.font = 'bold 42px "Pretendard Variable", Pretendard, sans-serif';
  ctx.fillText(`${result.petName}의 미래 타임머신 리포트`, 64, 160);

  ctx.fillStyle = '#6C708A';
  ctx.font = '500 22px "Pretendard Variable", Pretendard, sans-serif';
  ctx.fillText(
    `${result.species} · ${result.estimatedBreed} | 현재 ${result.currentAgeLabel} (${result.humanAgeEquivalent})`,
    64,
    200
  );

  // 3. Highlight Expected Together Year Banner
  const bannerGrad = ctx.createLinearGradient(64, 230, width - 64, 380);
  bannerGrad.addColorStop(0, '#FF7E67');
  bannerGrad.addColorStop(1, '#F5644A');
  ctx.fillStyle = bannerGrad;
  ctx.beginPath();
  ctx.roundRect(64, 232, width - 128, 148, 28);
  ctx.fill();

  ctx.fillStyle = '#FFF2EF';
  ctx.font = '600 22px "Pretendard Variable", Pretendard, sans-serif';
  ctx.fillText('AI 생애 주기 & 품종 맞춤 기대 수명 예측', 96, 278);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 40px "Pretendard Variable", Pretendard, sans-serif';
  ctx.fillText(`"${result.lifespanPrediction.headlineMessage}"`, 96, 330);

  ctx.fillStyle = '#FFE8E2';
  ctx.font = '500 20px "Pretendard Variable", Pretendard, sans-serif';
  ctx.fillText(`✨ ${result.lifespanPrediction.hopeSubMessage}`, 96, 364);

  // 4. 3-Photo Showcase (현재 모습 / 선택한 미래 모습 / 2세 아기 예측)
  const cardY = 412;
  const imgBoxW = 296;
  const imgBoxH = 296;
  const gap = 32;
  const startX = 64;

  const selectedStageImgUrl =
    images.perStageUrls[selectedStage.id] || images.senior || images.primeAdult || images.original;

  const showcaseItems = [
    { src: images.original, title: '현재 원본 모습', sub: `${result.currentAgeLabel}` },
    { src: selectedStageImgUrl, title: `${selectedStage.label} (${selectedStage.targetYear}년)`, sub: selectedStage.petAgeText },
    { src: images.offspring, title: '미래 2세(새끼) 예측', sub: `닮은꼴 ${result.offspringPrediction.parentResemblanceScore}%` },
  ];

  for (let i = 0; i < showcaseItems.length; i++) {
    const item = showcaseItems[i];
    const x = startX + i * (imgBoxW + gap);

    // Card frame
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(x, cardY, imgBoxW, imgBoxH + 86, 24);
    ctx.fill();
    ctx.strokeStyle = '#F3E3D3';
    ctx.lineWidth = 2;
    ctx.stroke();

    try {
      const loaded = await loadImage(item.src);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x + 12, cardY + 12, imgBoxW - 24, imgBoxH - 24, 18);
      ctx.clip();
      const m = Math.min(loaded.width, loaded.height);
      ctx.drawImage(
        loaded,
        (loaded.width - m) / 2,
        (loaded.height - m) / 2,
        m,
        m,
        x + 12,
        cardY + 12,
        imgBoxW - 24,
        imgBoxH - 24
      );
      ctx.restore();
    } catch {
      // ignore image error
    }

    ctx.fillStyle = '#4A4E69';
    ctx.font = 'bold 22px "Pretendard Variable", Pretendard, sans-serif';
    ctx.fillText(item.title, x + 20, cardY + imgBoxH + 28);

    ctx.fillStyle = '#FF7E67';
    ctx.font = '600 18px "Pretendard Variable", Pretendard, sans-serif';
    ctx.fillText(item.sub, x + 20, cardY + imgBoxH + 58);
  }

  // 5. Pet's Future Diary Message Box
  const quoteY = 830;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(64, quoteY, width - 128, 145, 24);
  ctx.fill();
  ctx.strokeStyle = '#FFD6CC';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#FF7E67';
  ctx.font = 'bold 22px "Pretendard Variable", Pretendard, sans-serif';
  ctx.fillText(`💌 ${selectedStage.targetYear}년의 ${result.petName}가 보내는 마음 편지`, 92, quoteY + 42);

  ctx.fillStyle = '#4A4E69';
  ctx.font = '500 22px "Pretendard Variable", Pretendard, sans-serif';
  const quoteText = `"${selectedStage.petDiaryQuote}"`;
  ctx.fillText(quoteText.slice(0, 46), 92, quoteY + 84);
  if (quoteText.length > 46) {
    ctx.fillText(quoteText.slice(46, 92), 92, quoteY + 116);
  }

  // 6. Health & Grooming Summary Cards
  const healthY = 1005;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(64, healthY, width - 128, 365, 24);
  ctx.fill();
  ctx.strokeStyle = '#E8E2DC';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#4A4E69';
  ctx.font = 'bold 26px "Pretendard Variable", Pretendard, sans-serif';
  ctx.fillText('🩺 생애 주기별 핵심 건강 주의보 & 맞춤 케어 요약', 92, healthY + 48);

  const roadmapPreview = result.healthRoadmap.slice(0, 3);
  roadmapPreview.forEach((h, idx) => {
    const rowY = healthY + 95 + idx * 72;
    ctx.fillStyle = '#FFF5F2';
    ctx.beginPath();
    ctx.roundRect(92, rowY - 28, width - 184, 56, 14);
    ctx.fill();

    ctx.fillStyle = '#FF7E67';
    ctx.font = 'bold 20px "Pretendard Variable", Pretendard, sans-serif';
    ctx.fillText(`${h.year}년 (${h.petAge})`, 112, rowY + 7);

    ctx.fillStyle = '#4A4E69';
    ctx.font = '600 19px "Pretendard Variable", Pretendard, sans-serif';
    const summaryLine = `주의 부위: ${h.vulnerableParts.slice(0, 3).join(', ')} | 필수: ${h.essentialCheckups[0] || '정기 종합검진'}`;
    ctx.fillText(summaryLine.slice(0, 48), 290, rowY + 7);
  });

  // Grooming tip line
  const styleName = result.groomingAndCare.recommendedStyles[0]?.styleName || '맞춤 위생 & 볼륨 스타일링';
  ctx.fillStyle = '#68B0AB';
  ctx.font = 'bold 20px "Pretendard Variable", Pretendard, sans-serif';
  ctx.fillText(
    `✂️ 추천 스타일링: ${styleName} · 빗질(${result.groomingAndCare.brushingSchedule.frequency}) · 목욕(${result.groomingAndCare.bathingAndHygiene.frequency})`,
    92,
    healthY + 330
  );

  // 7. Footer
  ctx.fillStyle = '#6C708A';
  ctx.font = '500 20px "Pretendard Variable", Pretendard, sans-serif';
  ctx.fillText('우리 아이와 함께하는 모든 계절이 건강하고 행복하길 응원합니다 · 펫타임 (PetTime)', 64, 1435);

  return canvas.toDataURL('image/png');
}
