import {
  GeneratedPetImages,
  OffspringPhotoItem,
  PartnerPetInfo,
  PetTimeAnalysisResult,
  TimelineStage,
} from '../types';
import { SAMPLE_PET_PRESETS, SamplePetPreset } from '../data/petTriviaAndPresets';

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
  secondaryHex: string;
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
    const data = ctx.getImageData(14, 14, 36, 36).data;
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    let r2Sum = 0, g2Sum = 0, b2Sum = 0, count2 = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      rSum += r;
      gSum += g;
      bSum += b;
      count++;
      if (i % 8 === 0) {
        r2Sum += Math.min(255, r + 25);
        g2Sum += Math.min(255, g + 20);
        b2Sum += Math.min(255, b + 15);
        count2++;
      }
    }
    const r = Math.round(rSum / count);
    const g = Math.round(gSum / count);
    const b = Math.round(bSum / count);
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    let colorDesc = '크림 & 소프트 브라운';
    if (lum > 205) colorDesc = '순백색 & 크림 화이트';
    else if (lum < 65) colorDesc = '차콜 블랙 & 다크 에스프레소';
    else if (r > g + 25 && g > b + 15) colorDesc = '치즈 코랄 & 애프리콧 골드';
    else if (r > b + 20) colorDesc = '포근한 베이지 & 카라멜 브라운';
    else colorDesc = '실버 그레이 & 바이컬러';

    const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
    const r2 = Math.round(r2Sum / Math.max(1, count2));
    const g2 = Math.round(g2Sum / Math.max(1, count2));
    const b2 = Math.round(b2Sum / Math.max(1, count2));
    const secondaryHex = '#' + [r2, g2, b2].map((v) => v.toString(16).padStart(2, '0')).join('');
    const brightness = lum > 180 ? '밝은 톤' : lum < 90 ? '진한 톤' : '중간 톤';

    return { primaryColorDescription: colorDesc, rgbHex: hex, secondaryHex, brightness };
  } catch {
    return {
      primaryColorDescription: '따뜻한 크림 & 베이지 코트',
      rgbHex: '#E8C5A5',
      secondaryHex: '#FFF6EC',
      brightness: '밝은 톤',
    };
  }
}

/**
 * Extracts a clean frame from an uploaded Partner Pet Image OR Video file
 */
export async function extractPartnerPetMedia(file: File, customName?: string): Promise<PartnerPetInfo> {
  const isVideo = file.type.startsWith('video/');
  let dataUrl = '';

  if (isVideo) {
    dataUrl = await new Promise<string>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.src = url;

      video.onloadeddata = () => {
        video.currentTime = Math.min(0.5, (video.duration || 1) * 0.25);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 600;
          canvas.height = 600;
          const ctx = canvas.getContext('2d')!;
          const vw = video.videoWidth || 600;
          const vh = video.videoHeight || 600;
          const minSide = Math.min(vw, vh);
          ctx.drawImage(
            video,
            (vw - minSide) / 2,
            (vh - minSide) / 2,
            minSide,
            minSide,
            0,
            0,
            600,
            600
          );
          URL.revokeObjectURL(url);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        } catch (e) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };

      video.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };
    });
  } else {
    dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  const colors = await analyzeUploadedPhotoColors(dataUrl);
  return {
    name: customName?.trim() || '단짝 펫',
    photoDataUrl: dataUrl,
    isFromVideo: isVideo,
    primaryColorHex: colors.rgbHex,
    secondaryColorHex: colors.secondaryHex,
    colorDesc: colors.primaryColorDescription,
  };
}

/**
 * Generates a realistic studio portrait for Sample Pet Presets with full age progression support!
 * When offsetYears > 0, renders unmistakable anatomical & facial aging (adult stature, silver muzzle/brows, droopy senior eyelids, whiskers, senior scarf).
 */
export function createSamplePresetPhoto(preset: SamplePetPreset, offsetYears: number = 0): string {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;

  const isAdult = offsetYears >= 1 && offsetYears <= 4;
  const isMature = offsetYears >= 5 && offsetYears <= 7;
  const isSenior = offsetYears >= 8;
  const seniorFactor = Math.min(1, Math.max(0, (offsetYears - 4) / 9));

  // Background changes noticeably with life stage so Before vs After is immediately clear
  const bgGrad = ctx.createRadialGradient(360, 320, 60, 360, 360, 460);
  if (isSenior) {
    // Warm nostalgic golden-hour sunset background for senior years
    bgGrad.addColorStop(0, '#FFF6E8');
    bgGrad.addColorStop(0.55, '#F7DEC4');
    bgGrad.addColorStop(1, '#CFA482');
  } else if (isMature) {
    bgGrad.addColorStop(0, '#FFFBF4');
    bgGrad.addColorStop(0.55, '#F9E6D4');
    bgGrad.addColorStop(1, '#E5C3A6');
  } else if (isAdult) {
    bgGrad.addColorStop(0, '#FFFDF9');
    bgGrad.addColorStop(0.55, '#FCECE0');
    bgGrad.addColorStop(1, '#EECCB6');
  } else {
    bgGrad.addColorStop(0, '#FFFDF9');
    bgGrad.addColorStop(0.55, '#FDEEE4');
    bgGrad.addColorStop(1, '#F5D6C6');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 720, 720);

  // Soft cushion/floor at bottom
  ctx.beginPath();
  ctx.ellipse(360, 650, 290, 85, 0, 0, Math.PI * 2);
  ctx.fillStyle = isSenior ? '#D5B89F' : '#EED7C5';
  ctx.fill();

  // Shadow under pet
  ctx.beginPath();
  ctx.ellipse(360, 610, 185, 38, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(74, 78, 105, 0.16)';
  ctx.fill();

  // Body & Head scale grows from young (0.94) to prime adult (1.06), slightly settling in senior (1.03)
  const scale = offsetYears === 0 ? 0.94 : isAdult ? 1.06 : 1.03;
  ctx.save();
  ctx.translate(360, 410);
  ctx.scale(scale, scale);
  ctx.translate(-360, -410);

  // Silver/ash color for aging fur (contrasts clearly even on white fur!)
  const silverFurColor =
    preset.furColorHex.toUpperCase() === '#F9F5F0' ? '#B8B2A8' : '#E8E6E3';
  const silverStrokeColor =
    preset.furColorHex.toUpperCase() === '#F9F5F0' ? '#9E978E' : '#F7F6F4';

  if (preset.species === '강아지') {
    const earDroop = isSenior ? 18 : 0;
    ctx.fillStyle = isSenior ? '#CFA886' : '#E5B892';
    ctx.beginPath();
    ctx.ellipse(195, 345 + earDroop, 68, 125, 0.28 - seniorFactor * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(525, 345 + earDroop, 68, 125, -0.28 + seniorFactor * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = preset.furColorHex;
    ctx.beginPath();
    ctx.ellipse(360, 535, 148, 122, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = preset.furColorHex;
    ctx.beginPath();
    ctx.arc(360, 315, 152, 0, Math.PI * 2);
    ctx.fill();

    // Fluffy top curls
    const curls = [
      { x: 280, y: 185, r: 46 },
      { x: 340, y: 168, r: 52 },
      { x: 405, y: 175, r: 48 },
      { x: 455, y: 205, r: 42 },
      { x: 235, y: 225, r: 42 },
    ];
    ctx.fillStyle = isSenior ? '#EAD5C3' : preset.furColorHex;
    curls.forEach((c) => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Muzzle puff (turns distinctly silver-white in mature/senior years)
    ctx.fillStyle = seniorFactor > 0.2 ? '#F7F5F2' : '#FFF9F2';
    ctx.beginPath();
    ctx.ellipse(298, 365, 68, 54, -0.1, 0, Math.PI * 2);
    ctx.ellipse(422, 365, 68, 54, 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (preset.species === '고양이') {
    ctx.fillStyle = preset.furColorHex;
    ctx.beginPath();
    ctx.moveTo(205, 275);
    ctx.lineTo(170, 125 + seniorFactor * 12);
    ctx.lineTo(305, 195);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(515, 275);
    ctx.lineTo(550, 125 + seniorFactor * 12);
    ctx.lineTo(415, 195);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#F7B2AD';
    ctx.beginPath();
    ctx.moveTo(215, 255);
    ctx.lineTo(192, 155 + seniorFactor * 10);
    ctx.lineTo(282, 205);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(505, 255);
    ctx.lineTo(528, 155 + seniorFactor * 10);
    ctx.lineTo(438, 205);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = preset.furColorHex;
    ctx.beginPath();
    ctx.ellipse(360, 535, 142, 122, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFDF9';
    ctx.beginPath();
    ctx.ellipse(360, 525, 85, 78, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = preset.furColorHex;
    ctx.beginPath();
    ctx.ellipse(360, 320, 160, 140, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isSenior ? '#D8A47F' : '#C86D2D';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    [-35, 0, 35].forEach((dx) => {
      ctx.beginPath();
      ctx.moveTo(360 + dx, 205);
      ctx.lineTo(360 + dx * 0.7, 255);
      ctx.stroke();
    });

    ctx.fillStyle = '#FFFDF9';
    ctx.beginPath();
    ctx.ellipse(360, 375, 108, 74, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (preset.species === '토끼') {
    // Rabbit ears tilt/relax slightly outward with senior age!
    const earTilt = seniorFactor * 0.22;
    const earDropY = seniorFactor * 18;
    ctx.fillStyle = isSenior ? '#C9B8A8' : preset.secondaryHex;
    ctx.beginPath();
    ctx.ellipse(275 - seniorFactor * 18, 145 + earDropY, 44, 118, -0.12 - earTilt, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(445 + seniorFactor * 18, 145 + earDropY, 44, 118, 0.12 + earTilt, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isSenior ? '#E2B8B4' : '#FAD2CF';
    ctx.beginPath();
    ctx.ellipse(275 - seniorFactor * 18, 150 + earDropY, 22, 85, -0.12 - earTilt, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(445 + seniorFactor * 18, 150 + earDropY, 22, 85, 0.12 + earTilt, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = preset.furColorHex;
    ctx.beginPath();
    ctx.ellipse(360, 535, 152, 118, 0, 0, Math.PI * 2);
    ctx.fill();

    // Senior rabbit gets fuller, slightly lower jowls/cheeks
    ctx.fillStyle = preset.furColorHex;
    ctx.beginPath();
    ctx.ellipse(360, 345 + seniorFactor * 6, 158 + seniorFactor * 10, 136, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = isSenior ? '#C9A37B' : '#E5B079';
    ctx.beginPath();
    ctx.arc(225, 220 + seniorFactor * 8, 48, 0, Math.PI * 2);
    ctx.arc(495, 220 + seniorFactor * 8, 48, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F7C6C2';
    ctx.beginPath();
    ctx.arc(225, 220 + seniorFactor * 8, 28, 0, Math.PI * 2);
    ctx.arc(495, 220 + seniorFactor * 8, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = preset.furColorHex;
    ctx.beginPath();
    ctx.ellipse(360, 415, 175, 195, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFDF9';
    ctx.beginPath();
    ctx.ellipse(360, 455, 125, 130, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stage-specific collar or senior warm knit cape/scarf
  if (isAdult || isMature) {
    // Stylish coral collar & golden heart tag in prime adult stage
    ctx.strokeStyle = '#FF7E67';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(360, 395, 118, Math.PI * 0.22, Math.PI * 0.78);
    ctx.stroke();

    ctx.fillStyle = '#FFD166';
    ctx.beginPath();
    ctx.arc(360, 518, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#D99B26';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  } else if (isSenior) {
    // Cozy senior burgundy/sage knitted scarf around neck
    ctx.fillStyle = '#C86D51';
    ctx.beginPath();
    ctx.ellipse(360, 485, 132, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    // Scarf tail
    ctx.beginPath();
    ctx.roundRect(395, 485, 44, 78, 12);
    ctx.fill();
    // Knit pattern lines
    ctx.strokeStyle = '#F4D8CD';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(260, 485);
    ctx.lineTo(460, 485);
    ctx.stroke();
  }

  // SENIOR & MATURE DISTINCTIVE FACIAL AGING:
  // 1) Silver/Frost Muzzle & Chin Patch (visible on both dark and white pets!)
  const eyeY = preset.species === '토끼' ? 325 : 305;
  const noseY = eyeY + 48;

  if (seniorFactor > 0.15) {
    ctx.save();
    ctx.fillStyle = silverFurColor;
    ctx.globalAlpha = Math.min(0.85, seniorFactor * 0.85);
    ctx.beginPath();
    ctx.ellipse(325, noseY + 18, 48, 34, -0.15, 0, Math.PI * 2);
    ctx.ellipse(395, noseY + 18, 48, 34, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Fine silver/gray fur strands around muzzle, cheeks, and chin
    ctx.strokeStyle = silverStrokeColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 42; i++) {
      const angle = (i / 42) * Math.PI * 2;
      const rx = 58 + (i % 5) * 12;
      const ry = 38 + (i % 4) * 8;
      const sx = 360 + Math.cos(angle) * rx;
      const sy = noseY + 14 + Math.sin(angle) * ry;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(angle) * 14, sy + Math.sin(angle) * 10 + 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Expressive Eyes (with Senior Droopy Eyelids & Pearlescent Cataract/Nuclear Sclerosis tint in Senior stage)
  const eyeOffsetX = 68;
  [360 - eyeOffsetX, 360 + eyeOffsetX].forEach((ex, idx) => {
    const isLeft = idx === 0;
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

    // Senior pearly-blue lens opalescence (authentic senior pet eye look)
    if (seniorFactor > 0.35) {
      const lensGrad = ctx.createRadialGradient(ex, eyeY, 2, ex, eyeY, 15);
      lensGrad.addColorStop(0, `rgba(210, 225, 240, ${(seniorFactor * 0.52).toFixed(2)})`);
      lensGrad.addColorStop(1, 'rgba(210, 225, 240, 0)');
      ctx.fillStyle = lensGrad;
      ctx.beginPath();
      ctx.arc(ex, eyeY, 15, 0, Math.PI * 2);
      ctx.fill();
    }

    // Catchlights
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ex - 7, eyeY - 7, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex + 8, eyeY + 6, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Senior gentle droopy upper eyelid & under-eye wrinkle lines!
    if (seniorFactor > 0.2) {
      ctx.fillStyle =
        preset.furColorHex.toUpperCase() === '#F9F5F0' ? '#EAE2D8' : preset.furColorHex;
      ctx.beginPath();
      ctx.ellipse(
        ex,
        eyeY - 22 + seniorFactor * 8,
        29,
        12 * seniorFactor,
        isLeft ? -0.18 : 0.18,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Eyelid crease line
      ctx.strokeStyle = 'rgba(92, 64, 51, 0.45)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(
        ex,
        eyeY - 4,
        26,
        isLeft ? Math.PI * 1.1 : Math.PI * 1.15,
        isLeft ? Math.PI * 1.85 : Math.PI * 1.9
      );
      ctx.stroke();

      // Under-eye gentle age smile wrinkle
      ctx.strokeStyle = `rgba(120, 95, 80, ${(seniorFactor * 0.48).toFixed(2)})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(ex, eyeY + 8, 31, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
    }

    // Long frosty senior eyebrows above eyes!
    if (seniorFactor > 0.25) {
      ctx.strokeStyle = silverStrokeColor;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      for (let b = -2; b <= 2; b++) {
        const bx = ex + b * 10;
        const by = eyeY - 30;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(
          bx + (isLeft ? -12 : 12),
          by - 14 * seniorFactor,
          bx + (isLeft ? -22 : 22),
          by - 4 * seniorFactor
        );
        ctx.stroke();
      }
    }
  });

  // Nose (slightly paler/softer pink-brown in senior years)
  ctx.fillStyle =
    preset.species === '강아지'
      ? isSenior
        ? '#6E5549'
        : '#3B281E'
      : isSenior
      ? '#E5A39D'
      : '#F28B82';
  ctx.beginPath();
  ctx.ellipse(360, noseY, 22, 15, 0, 0, Math.PI * 2);
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

  // Long silver-white whiskers in mature/senior stages
  if (seniorFactor > 0.2) {
    ctx.strokeStyle = silverStrokeColor;
    ctx.lineWidth = 2.5;
    [-1, 1].forEach((dir) => {
      [0, 1, 2].forEach((wi) => {
        const wy = noseY + 12 + wi * 9;
        const wx = 360 + dir * 45;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.quadraticCurveTo(
          wx + dir * 55 * seniorFactor,
          wy - 4 + wi * 4,
          wx + dir * 95 * seniorFactor,
          wy + 12 + wi * 6
        );
        ctx.stroke();
      });
    });
  }

  // Rosy cheeks (bright in youth, warm subtle in senior)
  ctx.fillStyle = `rgba(255, 126, 103, ${(0.24 * (1 - seniorFactor * 0.5)).toFixed(2)})`;
  ctx.beginPath();
  ctx.ellipse(255, noseY + 5, 28, 16, 0, 0, Math.PI * 2);
  ctx.ellipse(465, noseY + 5, 28, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Applies unmistakable, realistic age progression directly onto the pet photo
 */
export async function renderConsistentPetStagePhoto(
  baseImageSrc: string,
  stageType: 'current' | 'prime' | 'mature' | 'senior' | 'offspring',
  offsetYears: number,
  badgeLabel: string,
  subLabel: string,
  presetId?: string
): Promise<string> {
  // If user is testing with one of our 4 sample presets, render the dedicated anatomical age progression!
  if (presetId && presetId !== 'custom' && stageType !== 'offspring') {
    const matchedPreset = SAMPLE_PET_PRESETS.find((p) => p.id === presetId);
    if (matchedPreset) {
      const agedPresetDataUrl = createSamplePresetPhoto(matchedPreset, offsetYears);
      const img = await loadImage(agedPresetDataUrl);
      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 720;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, 720, 720);
      drawStageBadgeOverlay(ctx, badgeLabel, subLabel);
      return canvas.toDataURL('image/jpeg', 0.92);
    }
  }

  const img = await loadImage(baseImageSrc);
  const size = 720;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const minSide = Math.min(img.width, img.height);
  const sx = (img.width - minSide) / 2;
  const sy = (img.height - minSide) / 2;

  ctx.save();

  if (stageType === 'current' || offsetYears === 0) {
    ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
  } else if (stageType === 'prime' || (offsetYears >= 1 && offsetYears <= 4)) {
    // Prime Adult (+1~4 years): Slight stature zoom (+5%), vivid glossy coat contrast, golden rim glow
    const zoom = 1 + Math.min(0.06, offsetYears * 0.015);
    const crop = minSide / zoom;
    const cx = sx + (minSide - crop) / 2;
    const cy = sy + (minSide - crop) / 2;

    ctx.filter = 'contrast(1.14) saturate(1.22) brightness(1.04)';
    ctx.drawImage(img, cx, cy, crop, crop, 0, 0, size, size);
    ctx.filter = 'none';

    // Warm golden vitality aura around edges
    const sunGrad = ctx.createRadialGradient(size * 0.5, size * 0.42, size * 0.18, size * 0.5, size * 0.5, size * 0.65);
    sunGrad.addColorStop(0, 'rgba(255, 248, 225, 0)');
    sunGrad.addColorStop(0.75, 'rgba(255, 195, 110, 0.16)');
    sunGrad.addColorStop(1, 'rgba(255, 140, 80, 0.28)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, size, size);
  } else if (stageType === 'mature' || stageType === 'senior' || offsetYears >= 5) {
    // Dramatic, unmistakable aging progression proportional to offsetYears (5 to 15 years)
    const frostIntensity = Math.min(1, Math.max(0.45, (offsetYears - 2) / 10));
    const desaturate = Math.round(100 - frostIntensity * 38);
    const contrastVal = (1 + frostIntensity * 0.08).toFixed(2);
    const sepiaVal = Math.round(frostIntensity * 24);

    ctx.filter = `saturate(${desaturate}%) sepia(${sepiaVal}%) contrast(${contrastVal})`;
    ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
    ctx.filter = 'none';

    // Sample center face brightness to decide between bright white frost vs silver-ash frost (for white pets!)
    const centerSample = ctx.getImageData(size * 0.4, size * 0.4, size * 0.2, size * 0.2).data;
    let lumSum = 0;
    for (let i = 0; i < centerSample.length; i += 16) {
      lumSum += 0.299 * centerSample[i] + 0.587 * centerSample[i + 1] + 0.114 * centerSample[i + 2];
    }
    const avgFaceLum = lumSum / (centerSample.length / 16);
    const isLightColoredPet = avgFaceLum > 185;

    // 1. Muzzle & Chin Frost / Silvering Zone
    ctx.save();
    const muzzleGrad = ctx.createRadialGradient(
      size * 0.5,
      size * 0.58,
      size * 0.02,
      size * 0.5,
      size * 0.58,
      size * 0.28
    );
    if (isLightColoredPet) {
      // For white/cream pets: warm silver-ash & pearl-gray shading so aging is clearly visible!
      muzzleGrad.addColorStop(0, `rgba(175, 168, 158, ${(0.52 * frostIntensity).toFixed(2)})`);
      muzzleGrad.addColorStop(0.6, `rgba(195, 188, 178, ${(0.32 * frostIntensity).toFixed(2)})`);
      muzzleGrad.addColorStop(1, 'rgba(200, 195, 190, 0)');
    } else {
      muzzleGrad.addColorStop(0, `rgba(250, 250, 252, ${(0.62 * frostIntensity).toFixed(2)})`);
      muzzleGrad.addColorStop(0.55, `rgba(235, 238, 245, ${(0.38 * frostIntensity).toFixed(2)})`);
      muzzleGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    }
    ctx.fillStyle = muzzleGrad;
    ctx.fillRect(0, 0, size, size);

    // 2. Eyebrow & Forehead Silver Frost Zones
    [size * 0.36, size * 0.64].forEach((eyeX) => {
      const browGrad = ctx.createRadialGradient(
        eyeX,
        size * 0.36,
        size * 0.01,
        eyeX,
        size * 0.36,
        size * 0.14
      );
      if (isLightColoredPet) {
        browGrad.addColorStop(0, `rgba(170, 162, 152, ${(0.48 * frostIntensity).toFixed(2)})`);
        browGrad.addColorStop(1, 'rgba(170, 162, 152, 0)');
      } else {
        browGrad.addColorStop(0, `rgba(248, 249, 252, ${(0.55 * frostIntensity).toFixed(2)})`);
        browGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }
      ctx.fillStyle = browGrad;
      ctx.fillRect(0, 0, size, size);
    });

    // 3. Detailed Directional Silver/Frost Fur Strands & Whiskers around Face
    const strandCount = Math.round(140 * frostIntensity);
    ctx.lineCap = 'round';
    for (let i = 0; i < strandCount; i++) {
      const angle = (i / strandCount) * Math.PI * 2;
      const radius = size * (0.06 + ((i * 17) % 20) * 0.011);
      const cx = size * 0.5 + Math.cos(angle) * radius * 1.2;
      const cy = size * 0.55 + Math.sin(angle) * radius * 0.9;
      const len = 10 + (i % 9) * 2.5;

      ctx.strokeStyle = isLightColoredPet
        ? i % 2 === 0
          ? `rgba(148, 140, 130, ${(0.45 * frostIntensity).toFixed(2)})`
          : `rgba(255, 255, 255, ${(0.65 * frostIntensity).toFixed(2)})`
        : `rgba(250, 250, 255, ${(0.50 * frostIntensity).toFixed(2)})`;
      ctx.lineWidth = i % 3 === 0 ? 2.4 : 1.5;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len + 4);
      ctx.stroke();
    }

    // 4. Senior Eyebrow Tufts & Cheek Wrinkle Contours
    [size * 0.36, size * 0.64].forEach((ex, idx) => {
      const dir = idx === 0 ? -1 : 1;
      // Under-eye gentle age crease
      ctx.strokeStyle = `rgba(95, 78, 65, ${(0.35 * frostIntensity).toFixed(2)})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ex, size * 0.43, size * 0.065, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();

      // Frosty senior eyebrow wisps
      ctx.strokeStyle = isLightColoredPet
        ? `rgba(145, 138, 128, ${(0.55 * frostIntensity).toFixed(2)})`
        : `rgba(252, 252, 255, ${(0.68 * frostIntensity).toFixed(2)})`;
      ctx.lineWidth = 2.6;
      for (let b = -3; b <= 3; b++) {
        const bx = ex + b * 8;
        const by = size * 0.36;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + dir * 12, by - 14 * frostIntensity, bx + dir * 24, by - 4);
        ctx.stroke();
      }
    });
    ctx.restore();

    // 5. Warm Golden-Hour Senior Portrait Frame Vignette
    const vignette = ctx.createRadialGradient(size * 0.5, size * 0.48, size * 0.24, size * 0.5, size * 0.5, size * 0.66);
    vignette.addColorStop(0, 'rgba(255, 245, 230, 0)');
    vignette.addColorStop(0.7, `rgba(185, 135, 95, ${(0.18 * frostIntensity).toFixed(2)})`);
    vignette.addColorStop(1, `rgba(92, 66, 48, ${(0.42 * frostIntensity).toFixed(2)})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, size, size);
  } else if (stageType === 'offspring') {
    const babyBg = ctx.createLinearGradient(0, 0, size, size);
    babyBg.addColorStop(0, '#FFF8F3');
    babyBg.addColorStop(1, '#FFE8DF');
    ctx.fillStyle = babyBg;
    ctx.fillRect(0, 0, size, size);

    const cropMargin = minSide * 0.08;
    ctx.save();
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, size * 0.44, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.filter = 'brightness(1.08) saturate(1.1) contrast(0.96)';
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
    ctx.restore();
  }

  drawStageBadgeOverlay(ctx, badgeLabel, subLabel);
  ctx.restore();
  return canvas.toDataURL('image/jpeg', 0.92);
}

function drawStageBadgeOverlay(ctx: CanvasRenderingContext2D, badgeLabel: string, subLabel: string) {
  ctx.fillStyle = 'rgba(43, 45, 66, 0.75)';
  ctx.beginPath();
  ctx.roundRect(22, 22, Math.max(175, badgeLabel.length * 17 + 38), 44, 22);
  ctx.fill();

  ctx.fillStyle = '#FFFDF9';
  ctx.font = 'bold 19px "Pretendard Variable", Pretendard, sans-serif';
  ctx.fillText(badgeLabel, 40, 50);

  if (subLabel) {
    ctx.fillStyle = 'rgba(255, 126, 103, 0.94)';
    ctx.beginPath();
    ctx.roundRect(22, 74, Math.max(145, subLabel.length * 14 + 32), 34, 17);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 15px "Pretendard Variable", Pretendard, sans-serif';
    ctx.fillText(subLabel, 36, 96);
  }
}

/**
 * Renders an adorable animated/posed 2세 baby pet inheriting BOTH Parent 1 and Parent 2 traits!
 * Used for both the 5-Photo Offspring Album AND the 3-Second Video Generator!
 */
export function drawBlendedBabyPetOnCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: {
    species: string;
    parent1Hex: string;
    parent2Hex: string;
    headTiltRad?: number;
    bounceY?: number;
    eyeBlinkAmount?: number; // 0 = open, 1 = closed
    isWinking?: boolean;
    growthScale?: number; // 0.78 (newborn) to 1.0 (5-month baby)
    earWiggleRad?: number;
    showHearts?: boolean;
    timeSec?: number;
  }
) {
  const {
    species,
    parent1Hex,
    parent2Hex,
    headTiltRad = 0,
    bounceY = 0,
    eyeBlinkAmount = 0,
    isWinking = false,
    growthScale = 0.88,
    earWiggleRad = 0,
    showHearts = true,
    timeSec = 0,
  } = options;

  ctx.save();
  ctx.translate(width / 2, height * 0.56 + bounceY);
  ctx.scale(growthScale, growthScale);

  // Cute baby shadow
  ctx.beginPath();
  ctx.ellipse(0, 175, 130, 28, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(74, 78, 105, 0.14)';
  ctx.fill();

  // Baby body (Parent 1 base coat + Parent 2 belly/spot patch!)
  ctx.fillStyle = parent1Hex;
  ctx.beginPath();
  ctx.ellipse(0, 95, 108, 88, 0, 0, Math.PI * 2);
  ctx.fill();

  // Parent 2 inherited spot patch on side of body
  ctx.fillStyle = parent2Hex;
  ctx.beginPath();
  ctx.ellipse(52, 85, 42, 48, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Fluffy baby chest bib
  ctx.fillStyle = '#FFFDF9';
  ctx.beginPath();
  ctx.ellipse(0, 82, 62, 54, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cute baby front paws with pink jelly pads
  [-48, 48].forEach((px) => {
    ctx.fillStyle = parent1Hex;
    ctx.beginPath();
    ctx.ellipse(px, 158, 28, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F7B2AD';
    ctx.beginPath();
    ctx.arc(px, 162, 9, 0, Math.PI * 2);
    ctx.fill();
  });

  // Head Group (rotates with headTiltRad for cute 갸우뚱 pose & video animation!)
  ctx.save();
  ctx.translate(0, -45);
  ctx.rotate(headTiltRad);

  if (species.includes('고양이')) {
    // Left Ear (Parent 1 color) & Right Ear (Parent 2 color!)
    ctx.fillStyle = parent1Hex;
    ctx.beginPath();
    ctx.moveTo(-125, -35);
    ctx.lineTo(-152, -145 - earWiggleRad * 30);
    ctx.lineTo(-45, -95);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = parent2Hex;
    ctx.beginPath();
    ctx.moveTo(125, -35);
    ctx.lineTo(152, -145 + earWiggleRad * 30);
    ctx.lineTo(45, -95);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FAD2CF';
    ctx.beginPath();
    ctx.moveTo(-115, -45);
    ctx.lineTo(-135, -120);
    ctx.lineTo(-65, -85);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(115, -45);
    ctx.lineTo(135, -120);
    ctx.lineTo(65, -85);
    ctx.closePath();
    ctx.fill();
  } else if (species.includes('토끼')) {
    // Bunny ears: Left ear tipped with Parent 2 color, Right ear Parent 2 patch!
    ctx.fillStyle = parent1Hex;
    ctx.beginPath();
    ctx.ellipse(-62, -145, 34, 92, -0.15 - earWiggleRad, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = parent2Hex;
    ctx.beginPath();
    ctx.ellipse(62, -145, 34, 92, 0.15 + earWiggleRad, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FAD2CF';
    ctx.beginPath();
    ctx.ellipse(-62, -140, 18, 65, -0.15 - earWiggleRad, 0, Math.PI * 2);
    ctx.ellipse(62, -140, 18, 65, 0.15 + earWiggleRad, 0, Math.PI * 2);
    ctx.fill();
  } else if (species.includes('햄스터') || species.includes('소동물')) {
    ctx.fillStyle = parent1Hex;
    ctx.beginPath();
    ctx.arc(-105, -85, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = parent2Hex;
    ctx.beginPath();
    ctx.arc(105, -85, 38, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Puppy floppy ears (Parent 2 color on right ear for adorable half-and-half genetics!)
    ctx.fillStyle = parent1Hex;
    ctx.beginPath();
    ctx.ellipse(-132, 12, 48, 92, 0.28 + earWiggleRad, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = parent2Hex;
    ctx.beginPath();
    ctx.ellipse(132, 12, 48, 92, -0.28 - earWiggleRad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Round Baby Head
  ctx.fillStyle = parent1Hex;
  ctx.beginPath();
  ctx.ellipse(0, 0, 136, 122, 0, 0, Math.PI * 2);
  ctx.fill();

  // Adorable Parent 2 Genetic Patch over Right Eye/Forehead!
  ctx.fillStyle = parent2Hex;
  ctx.beginPath();
  ctx.ellipse(58, -28, 62, 54, -0.25, 0, Math.PI * 2);
  ctx.fill();

  // Fluffy baby cheeks
  ctx.fillStyle = '#FFFDF9';
  ctx.beginPath();
  ctx.ellipse(0, 36, 92, 60, 0, 0, Math.PI * 2);
  ctx.fill();

  // Big Sparkling Baby Eyes (proportional to baby's young age)
  [-54, 54].forEach((ex, idx) => {
    const winkThisEye = isWinking && idx === 1;
    if (winkThisEye || eyeBlinkAmount > 0.75) {
      // Happy curved winking/blinking eye
      ctx.strokeStyle = '#2B1B17';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(ex, -4, 18, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else {
      ctx.save();
      ctx.translate(ex, -6);
      ctx.scale(1, 1 - eyeBlinkAmount * 0.85);

      ctx.fillStyle = '#2B1B17';
      ctx.beginPath();
      ctx.arc(0, 0, 23, 0, Math.PI * 2);
      ctx.fill();

      // Big dewy baby catchlights
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-7, -7, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(7, 6, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  });

  // Cute tiny baby nose & happy open smile
  ctx.fillStyle = '#F28B82';
  ctx.beginPath();
  ctx.ellipse(0, 26, 16, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  // Baby tongue & smile
  ctx.fillStyle = '#FF9AA2';
  ctx.beginPath();
  ctx.arc(0, 44, 12, 0, Math.PI);
  ctx.fill();

  ctx.strokeStyle = '#5C4033';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(-14, 38, 14, 0, Math.PI * 0.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(14, 38, 14, Math.PI * 0.15, Math.PI);
  ctx.stroke();

  // Rosy baby blush
  ctx.fillStyle = 'rgba(255, 126, 103, 0.32)';
  ctx.beginPath();
  ctx.ellipse(-82, 22, 24, 14, 0, 0, Math.PI * 2);
  ctx.ellipse(82, 22, 24, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // end head group
  ctx.restore(); // end baby group

  // Floating animated hearts
  if (showHearts) {
    const heartOffsets = [
      { x: width * 0.18, baseY: height * 0.35, phase: 0 },
      { x: width * 0.82, baseY: height * 0.32, phase: 1.5 },
      { x: width * 0.76, baseY: height * 0.58, phase: 3.0 },
    ];
    ctx.font = '28px sans-serif';
    heartOffsets.forEach((h) => {
      const dy = Math.sin(timeSec * 3 + h.phase) * 10;
      ctx.fillText('💗', h.x, h.baseY + dy);
    });
  }
}

/**
 * Generates 5 distinct high-resolution photos of the predicted 2세 baby pet blending BOTH parents!
 */
export async function generateFiveOffspringPhotos(params: {
  parent1PhotoUrl: string;
  parent1Name: string;
  parent1Hex: string;
  partner: PartnerPetInfo;
  species: string;
  babyNickname: string;
}): Promise<OffspringPhotoItem[]> {
  const { parent1PhotoUrl, parent1Name, parent1Hex, partner, species, babyNickname } = params;
  const p1Img = await loadImage(parent1PhotoUrl);
  const p2Img = await loadImage(partner.photoDataUrl);

  const poses: {
    stepNumber: number;
    title: string;
    subtitle: string;
    poseType: OffspringPhotoItem['poseType'];
    bgColors: [string, string];
    headTiltRad: number;
    isWinking: boolean;
    growthScale: number;
  }[] = [
    {
      stepNumber: 1,
      title: '1장 · 생후 1개월 뽀시래기 시절',
      subtitle: `${parent1Name} ♥ ${partner.name} 털색을 반반 물려받은 솜뭉치`,
      poseType: 'newborn',
      bgColors: ['#FFF9F3', '#FFE8DF'],
      headTiltRad: 0,
      isWinking: false,
      growthScale: 0.78,
    },
    {
      stepNumber: 2,
      title: '2장 · 생후 2개월 갸우뚱 심쿵 포즈',
      subtitle: '엄마·아빠 눈망울을 쏙 빼닮은 호기심 표정',
      poseType: 'head_tilt',
      bgColors: ['#FFFDF7', '#FCE8CE'],
      headTiltRad: 0.18,
      isWinking: false,
      growthScale: 0.86,
    },
    {
      stepNumber: 3,
      title: '3장 · 생후 3개월 해맑은 윙크 애교샷',
      subtitle: '장난기 가득한 윙크와 분홍빛 젤리 발바닥',
      poseType: 'wink_play',
      bgColors: ['#F4FBF9', '#DDF2EE'],
      headTiltRad: -0.14,
      isWinking: true,
      growthScale: 0.92,
    },
    {
      stepNumber: 4,
      title: '4장 · 생후 5개월 폭풍성장 판박이샷',
      subtitle: '부모의 귀 모양과 코트 무늬가 뚜렷해진 아기 모습',
      poseType: 'grown_baby',
      bgColors: ['#FFF6F8', '#FCDCE4'],
      headTiltRad: 0.06,
      isWinking: false,
      growthScale: 1.0,
    },
    {
      stepNumber: 5,
      title: '5장 · 엄마·아빠·2세 행복 가족사진',
      subtitle: `${parent1Name} + ${partner.name} + 2세(${babyNickname}) 스튜디오 기념샷`,
      poseType: 'family_portrait',
      bgColors: ['#FFFDF9', '#F7E3D4'],
      headTiltRad: 0,
      isWinking: false,
      growthScale: 0.85,
    },
  ];

  const items: OffspringPhotoItem[] = [];

  for (const p of poses) {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 720;
    const ctx = canvas.getContext('2d')!;

    const bg = ctx.createLinearGradient(0, 0, 720, 720);
    bg.addColorStop(0, p.bgColors[0]);
    bg.addColorStop(1, p.bgColors[1]);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 720, 720);

    if (p.poseType === 'family_portrait') {
      // Photo 5: Family Portrait showing Parent 1 (Left), Parent 2 (Right), and Baby (Center Front)!
      [
        { img: p1Img, x: 205, y: 270, label: parent1Name },
        { img: p2Img, x: 515, y: 270, label: partner.name },
      ].forEach((parentCircle) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(parentCircle.x, parentCircle.y, 130, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        const m = Math.min(parentCircle.img.width, parentCircle.img.height);
        ctx.drawImage(
          parentCircle.img,
          (parentCircle.img.width - m) / 2,
          (parentCircle.img.height - m) / 2,
          m,
          m,
          parentCircle.x - 130,
          parentCircle.y - 130,
          260,
          260
        );
        ctx.restore();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(parentCircle.x, parentCircle.y, 130, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Heart between parents
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText('❤️', 338, 220);

      // Baby in center foreground
      drawBlendedBabyPetOnCanvas(ctx, 720, 820, {
        species,
        parent1Hex,
        parent2Hex: partner.primaryColorHex,
        headTiltRad: 0.05,
        growthScale: 0.78,
        showHearts: true,
      });
    } else {
      // Photos 1..4: Individual posed baby portrait + dual parent mini badges in bottom-right
      drawBlendedBabyPetOnCanvas(ctx, 720, 720, {
        species,
        parent1Hex,
        parent2Hex: partner.primaryColorHex,
        headTiltRad: p.headTiltRad,
        isWinking: p.isWinking,
        growthScale: p.growthScale,
        earWiggleRad: p.stepNumber % 2 === 0 ? 0.12 : -0.08,
        showHearts: true,
      });

      // Dual Parent genetics mini avatars in bottom-right
      [
        { img: p1Img, cx: 565, cy: 635 },
        { img: p2Img, cx: 645, cy: 635 },
      ].forEach((av) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(av.cx, av.cy, 42, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        const m = Math.min(av.img.width, av.img.height);
        ctx.drawImage(
          av.img,
          (av.img.width - m) / 2,
          (av.img.height - m) / 2,
          m,
          m,
          av.cx - 42,
          av.cy - 42,
          84,
          84
        );
        ctx.restore();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(av.cx, av.cy, 42, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('❤️', 595, 642);
    }

    drawStageBadgeOverlay(ctx, p.title, p.subtitle);

    items.push({
      id: `offspring-photo-${p.stepNumber}`,
      stepNumber: p.stepNumber,
      title: p.title,
      subtitle: p.subtitle,
      poseType: p.poseType,
      imageUrl: canvas.toDataURL('image/jpeg', 0.92),
    });
  }

  return items;
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

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#FFFDF9');
  bg.addColorStop(0.5, '#FFF8F1');
  bg.addColorStop(1, '#FDECE3');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#FFC5BB';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(28, 28, width - 56, height - 56, 36);
  ctx.stroke();

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
      // ignore
    }

    ctx.fillStyle = '#4A4E69';
    ctx.font = 'bold 22px "Pretendard Variable", Pretendard, sans-serif';
    ctx.fillText(item.title, x + 20, cardY + imgBoxH + 28);

    ctx.fillStyle = '#FF7E67';
    ctx.font = '600 18px "Pretendard Variable", Pretendard, sans-serif';
    ctx.fillText(item.sub, x + 20, cardY + imgBoxH + 58);
  }

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

  const styleName = result.groomingAndCare.recommendedStyles[0]?.styleName || '맞춤 위생 & 볼륨 스타일링';
  ctx.fillStyle = '#68B0AB';
  ctx.font = 'bold 20px "Pretendard Variable", Pretendard, sans-serif';
  ctx.fillText(
    `✂️ 추천 스타일링: ${styleName} · 빗질(${result.groomingAndCare.brushingSchedule.frequency}) · 목욕(${result.groomingAndCare.bathingAndHygiene.frequency})`,
    92,
    healthY + 330
  );

  ctx.fillStyle = '#6C708A';
  ctx.font = '500 20px "Pretendard Variable", Pretendard, sans-serif';
  ctx.fillText('우리 아이와 함께하는 모든 계절이 건강하고 행복하길 응원합니다 · 펫타임 (PetTime)', 64, 1435);

  return canvas.toDataURL('image/png');
}
