import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Camera,
  Download,
  Play,
  Sparkles,
  CheckCircle2,
  Heart,
  Image as ImageIcon,
  Film,
} from 'lucide-react';
import {
  OffspringPhotoItem,
  PartnerPetInfo,
  PetTimeAnalysisResult,
} from '../types';
import {
  analyzeUploadedPhotoColors,
  createSamplePresetPhoto,
  drawBlendedBabyPetOnCanvas,
  extractPartnerPetMedia,
  generateFiveOffspringPhotos,
} from '../utils/petImageProcessor';
import { SAMPLE_PET_PRESETS } from '../data/petTriviaAndPresets';

interface OffspringSimulatorTabProps {
  analysisResult: PetTimeAnalysisResult;
  parent1PhotoUrl: string;
}

const PARTNER_PRESETS = [
  {
    id: 'partner-choco',
    name: '초코',
    label: '🐶 초코 (브라운)',
    furColorHex: '#9C6644',
    secondaryHex: '#E6CCB2',
    presetRef: SAMPLE_PET_PRESETS[0],
  },
  {
    id: 'partner-nabi',
    name: '나비',
    label: '🐱 나비 (치즈크림)',
    furColorHex: '#E76F51',
    secondaryHex: '#FFF8F0',
    presetRef: SAMPLE_PET_PRESETS[1],
  },
  {
    id: 'partner-mocha',
    name: '모카',
    label: '🐰 모카 (시나몬)',
    furColorHex: '#DDB892',
    secondaryHex: '#7F5539',
    presetRef: SAMPLE_PET_PRESETS[2],
  },
  {
    id: 'partner-cookie',
    name: '쿠키',
    label: '🐹 쿠키 (다크초코)',
    furColorHex: '#583101',
    secondaryHex: '#F3D5B5',
    presetRef: SAMPLE_PET_PRESETS[3],
  },
];

export const OffspringSimulatorTab: React.FC<OffspringSimulatorTabProps> = ({
  analysisResult,
  parent1PhotoUrl,
}) => {
  const [parent1Hex, setParent1Hex] = useState<string>('#F3D2B3');
  const [partner, setPartner] = useState<PartnerPetInfo>(() => {
    const p = PARTNER_PRESETS[0];
    const customPreset = {
      ...p.presetRef,
      furColorHex: p.furColorHex,
      secondaryHex: p.secondaryHex,
    };
    return {
      name: p.name,
      photoDataUrl: createSamplePresetPhoto(customPreset, 0),
      isFromVideo: false,
      primaryColorHex: p.furColorHex,
      secondaryColorHex: p.secondaryHex,
      colorDesc: '따뜻한 초코 브라운 & 크림',
    };
  });

  const [fivePhotos, setFivePhotos] = useState<OffspringPhotoItem[]>([]);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState<number>(0);
  const [isGeneratingMedia, setIsGeneratingMedia] = useState<boolean>(false);

  // 3-Second Video Player State
  const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(true);
  const [videoTimeSec, setVideoTimeSec] = useState<number>(0);
  const [isRecordingDownload, setIsRecordingDownload] = useState<boolean>(false);
  const partnerInputRef = useRef<HTMLInputElement | null>(null);

  // Analyze Parent 1 color once
  useEffect(() => {
    analyzeUploadedPhotoColors(parent1PhotoUrl).then((info) => {
      setParent1Hex(info.rgbHex);
    });
  }, [parent1PhotoUrl]);

  // Generate the 5 Offspring Photos whenever Parent 1 or Partner changes
  useEffect(() => {
    let cancelled = false;
    setIsGeneratingMedia(true);
    generateFiveOffspringPhotos({
      parent1PhotoUrl,
      parent1Name: analysisResult.petName,
      parent1Hex,
      partner,
      species: analysisResult.species,
      babyNickname: analysisResult.offspringPrediction.babyNickname,
    })
      .then((items) => {
        if (!cancelled) {
          setFivePhotos(items);
          setIsGeneratingMedia(false);
        }
      })
      .catch(() => {
        if (!cancelled) setIsGeneratingMedia(false);
      });

    return () => {
      cancelled = true;
    };
  }, [parent1PhotoUrl, parent1Hex, partner, analysisResult]);

  // 3-Second (3.0s) Animation Loop on videoCanvasRef
  useEffect(() => {
    const canvas = videoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const startTime = performance.now();
    const durationMs = 3000; // 3.0 seconds exact loop

    const renderFrame = (now: number) => {
      const elapsed = isPlayingVideo ? (now - startTime) % durationMs : videoTimeSec * 1000;
      const tSec = elapsed / 1000; // 0.0 to 3.0
      if (isPlayingVideo) {
        setVideoTimeSec(Number(tSec.toFixed(1)));
      }

      const w = canvas.width;
      const h = canvas.height;

      // Soft warm nursery studio background
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#FFF9F4');
      bg.addColorStop(1, '#FCE4D8');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Animated motion parameters across 3.0 seconds
      const headTiltRad = Math.sin(tSec * Math.PI * 1.35) * 0.16;
      const bounceY = Math.abs(Math.sin(tSec * Math.PI * 2.7)) * -14;
      const earWiggleRad = Math.sin(tSec * Math.PI * 4) * 0.14;

      // Natural eye blink around t = 0.8s and t = 2.2s
      let eyeBlinkAmount = 0;
      if (Math.abs(tSec - 0.85) < 0.12) {
        eyeBlinkAmount = 1 - Math.abs(tSec - 0.85) / 0.12;
      } else if (Math.abs(tSec - 2.25) < 0.12) {
        eyeBlinkAmount = 1 - Math.abs(tSec - 2.25) / 0.12;
      }

      const isWinking = tSec > 1.45 && tSec < 1.85;

      drawBlendedBabyPetOnCanvas(ctx, w, h, {
        species: analysisResult.species,
        parent1Hex,
        parent2Hex: partner.primaryColorHex,
        headTiltRad,
        bounceY,
        eyeBlinkAmount,
        isWinking,
        growthScale: 0.9,
        earWiggleRad,
        showHearts: true,
        timeSec: tSec,
      });

      // Top overlay badge inside video
      ctx.fillStyle = 'rgba(43, 45, 66, 0.75)';
      ctx.beginPath();
      ctx.roundRect(18, 18, 330, 38, 19);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px "Pretendard Variable", Pretendard, sans-serif';
      ctx.fillText(
        `🎬 AI 2세 3초 영상 · ${analysisResult.petName} ♥ ${partner.name}`,
        32,
        42
      );

      // Timer badge at top-right
      ctx.fillStyle = 'rgba(255, 126, 103, 0.92)';
      ctx.beginPath();
      ctx.roundRect(w - 118, 18, 100, 34, 17);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px "Pretendard Variable", Pretendard, sans-serif';
      ctx.fillText(`${tSec.toFixed(1)}s / 3.0s`, w - 102, 40);

      if (isPlayingVideo) {
        animId = requestAnimationFrame(renderFrame);
      }
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, [isPlayingVideo, analysisResult, parent1Hex, partner]);

  // Handle Partner Pet Photo or Video Upload
  const handlePartnerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsGeneratingMedia(true);
    try {
      const extracted = await extractPartnerPetMedia(file, partner.name);
      setPartner(extracted);
    } finally {
      setIsGeneratingMedia(false);
    }
  };

  // Select a partner preset
  const handleSelectPartnerPreset = (p: (typeof PARTNER_PRESETS)[0]) => {
    const customPreset = {
      ...p.presetRef,
      furColorHex: p.furColorHex,
      secondaryHex: p.secondaryHex,
    };
    setPartner({
      name: p.name,
      photoDataUrl: createSamplePresetPhoto(customPreset, 0),
      isFromVideo: false,
      primaryColorHex: p.furColorHex,
      secondaryColorHex: p.secondaryHex,
      colorDesc: p.label,
    });
  };

  // Record & Download the 3-second video as a real WebM/MP4 file
  const handleDownload3SecVideo = async () => {
    const canvas = videoCanvasRef.current;
    if (!canvas || isRecordingDownload) return;

    try {
      setIsRecordingDownload(true);
      setIsPlayingVideo(true);
      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeBitsPerSecond: 2500000, mimeType });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `펫타임_${analysisResult.petName}x${partner.name}_2세예측_3초영상.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsRecordingDownload(false);
      };

      recorder.start();
      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 3050);
    } catch {
      setIsRecordingDownload(false);
    }
  };

  // Download single or all 5 photos
  const handleDownloadSinglePhoto = (item: OffspringPhotoItem) => {
    const a = document.createElement('a');
    a.href = item.imageUrl;
    a.download = `펫타임_2세예측_${item.stepNumber}번_${analysisResult.petName}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAllFivePhotos = () => {
    fivePhotos.forEach((item, idx) => {
      setTimeout(() => handleDownloadSinglePhoto(item), idx * 250);
    });
  };

  const activePhoto = fivePhotos[selectedPhotoIdx] || fivePhotos[0];

  return (
    <div className="space-y-4">
      {/* 1. PARENT 1 + PARTNER PET UPLOAD CARD (Photo or Video!) */}
      <div className="bg-white rounded-[20px] p-4 border border-[#FFE3DE] space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#4A4E69]">
            우리 아이 ♥ 상대 펫 2세 시뮬레이터
          </h2>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFF2EF] text-[#FF7E67]">
            사진 5장 + 3초 영상
          </span>
        </div>

        {/* Parent 1 vs Partner Pet Side-by-Side */}
        <div className="grid grid-cols-11 gap-2 items-center bg-[#FFFDF9] p-3 rounded-[16px] border border-[#F3E3D3]">
          {/* Parent 1 */}
          <div className="col-span-5 text-center space-y-1.5">
            <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-[#FF7E67] shadow-xs">
              <img
                src={parent1PhotoUrl}
                alt={analysisResult.petName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-xs font-extrabold text-[#4A4E69] truncate">
              {analysisResult.petName} (우리 아이)
            </div>
          </div>

          {/* Heart icon */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            <Heart className="w-5 h-5 text-[#FF7E67] fill-[#FF7E67] animate-pulse" />
          </div>

          {/* Partner Pet (Upload Photo or Video!) */}
          <div className="col-span-5 text-center space-y-1.5">
            <div
              onClick={() => partnerInputRef.current?.click()}
              className="relative w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-dashed border-[#FF7E67] bg-[#FFF2EF] cursor-pointer group shadow-xs"
            >
              <img
                src={partner.photoDataUrl}
                alt={partner.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-[#2B2D42]/75 text-white text-[10px] font-bold py-0.5">
                변경
              </div>
            </div>
            <div className="text-xs font-extrabold text-[#FF7E67] truncate">
              {partner.name} {partner.isFromVideo ? '(🎬영상추출)' : '(상대 펫)'}
            </div>
          </div>
        </div>

        {/* Upload Partner Photo or Video Button */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => partnerInputRef.current?.click()}
            className="w-full py-3 px-4 rounded-[14px] bg-[#FF7E67] hover:bg-[#F5644A] text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 active:scale-98 transition cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>상대 펫 사진 또는 동영상 업로드하기</span>
            <Video className="w-4 h-4" />
          </button>
          <input
            ref={partnerInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handlePartnerFileUpload}
            className="hidden"
          />

          {/* Quick Partner Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            <span className="text-[11px] font-bold text-[#6C708A] shrink-0">
              상대 펫 샘플:
            </span>
            {PARTNER_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPartnerPreset(p)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                  partner.name === p.name
                    ? 'bg-[#4A4E69] text-white border-[#4A4E69]'
                    : 'bg-[#FFFDF9] text-[#4A4E69] border-[#FFE3DE]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. 3-SECOND BABY VIDEO PREDICTION CARD */}
      <div className="bg-white rounded-[20px] p-4 border border-[#FFE3DE] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Film className="w-4 h-4 text-[#FF7E67]" />
            <h3 className="text-sm font-extrabold text-[#4A4E69]">
              2세 예측 3초 모션 영상
            </h3>
          </div>
          <span className="text-[11px] font-bold text-[#FF7E67]">
            3.0초 무한 루프 재생 중
          </span>
        </div>

        <div className="relative rounded-[18px] overflow-hidden border-2 border-[#FFC5BB] aspect-square w-full max-w-[340px] mx-auto bg-[#FFF9F4] shadow-sm">
          <canvas
            ref={videoCanvasRef}
            width={540}
            height={540}
            className="w-full h-full object-cover"
          />
        </div>

        {/* 3-Second Video Progress Bar & Controls */}
        <div className="space-y-2">
          <div className="w-full h-2 bg-[#FFF2EF] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FF7E67] transition-all duration-100"
              style={{ width: `${Math.min(100, (videoTimeSec / 3.0) * 100)}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsPlayingVideo((prev) => !prev)}
              className="py-2.5 rounded-[12px] bg-[#FFF2EF] text-[#4A4E69] text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-[#FF7E67]" />
              <span>{isPlayingVideo ? '일시정지' : '3초 영상 재생'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload3SecVideo}
              disabled={isRecordingDownload}
              className="py-2.5 rounded-[12px] bg-[#FF7E67] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-60 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {isRecordingDownload ? '3초 영상 녹화 중...' : '3초 영상 파일 저장'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. 5-PHOTO OFFSPRING ALBUM CARD */}
      <div className="bg-white rounded-[20px] p-4 border border-[#FFE3DE] space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-[#FF7E67]" />
            <h3 className="text-sm font-extrabold text-[#4A4E69]">
              2세 성장 & 포즈 사진 5장 앨범
            </h3>
          </div>
          <button
            type="button"
            onClick={handleDownloadAllFivePhotos}
            className="text-xs font-extrabold text-[#FF7E67] underline cursor-pointer"
          >
            5장 모두 저장
          </button>
        </div>

        {/* Main Selected Photo Viewer */}
        {activePhoto && !isGeneratingMedia ? (
          <div className="space-y-2.5">
            <div className="relative rounded-[18px] overflow-hidden border-2 border-[#FFE3DE] aspect-square w-full max-w-[340px] mx-auto bg-[#FFFDF9]">
              <img
                src={activePhoto.imageUrl}
                alt={activePhoto.title}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleDownloadSinglePhoto(activePhoto)}
                className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-[#2B2D42]/80 text-white text-xs font-bold flex items-center gap-1 shadow cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>이 사진 저장</span>
              </button>
            </div>

            {/* 5 Thumbnails Strip */}
            <div className="grid grid-cols-5 gap-1.5">
              {fivePhotos.map((item, idx) => {
                const isSelected = selectedPhotoIdx === idx;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedPhotoIdx(idx)}
                    className={`relative rounded-[12px] overflow-hidden aspect-square border-2 transition cursor-pointer ${
                      isSelected
                        ? 'border-[#FF7E67] scale-[1.03] shadow-sm'
                        : 'border-[#FFE3DE] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-[#2B2D42]/80 text-white text-[10px] font-extrabold flex items-center justify-center">
                      {item.stepNumber}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-xs font-bold text-[#6C708A]">
            <Sparkles className="w-6 h-6 text-[#FF7E67] animate-spin mx-auto mb-2" />
            두 부모의 외모를 닮은 5장의 사진과 영상을 생성하고 있어요...
          </div>
        )}

        {/* Genetic Resemblance Summary */}
        <div className="p-3.5 rounded-[16px] bg-[#FFF9F0] border border-[#F9E4C8] space-y-1.5">
          <div className="text-xs font-extrabold text-[#4A4E69]">
            🧬 {analysisResult.petName} ♥ {partner.name} 2세 유전 포인트
          </div>
          <ul className="space-y-1">
            <li className="text-xs text-[#4A4E69] flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF7E67] shrink-0 mt-0.5" />
              <span>
                <strong>모질 & 무늬:</strong> {analysisResult.petName}의 베이스 털빛과 {partner.name}의 포인트 무늬가 반반 조화롭게 유전됨
              </span>
            </li>
            {analysisResult.offspringPrediction.inheritedFeatures.slice(0, 2).map((feat, i) => (
              <li key={i} className="text-xs text-[#4A4E69] flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#FF7E67] shrink-0 mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
