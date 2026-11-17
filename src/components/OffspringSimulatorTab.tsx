import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Camera,
  Download,
  Share2,
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
    label: '🐶 초코(브라운)',
    furColorHex: '#9C6644',
    secondaryHex: '#E6CCB2',
    presetRef: SAMPLE_PET_PRESETS[0],
  },
  {
    id: 'partner-nabi',
    name: '나비',
    label: '🐱 나비(치즈)',
    furColorHex: '#E76F51',
    secondaryHex: '#FFF8F0',
    presetRef: SAMPLE_PET_PRESETS[1],
  },
  {
    id: 'partner-mocha',
    name: '모카',
    label: '🐰 모카(시나몬)',
    furColorHex: '#DDB892',
    secondaryHex: '#7F5539',
    presetRef: SAMPLE_PET_PRESETS[2],
  },
  {
    id: 'partner-cookie',
    name: '쿠키',
    label: '🐹 쿠키(다크)',
    furColorHex: '#583101',
    secondaryHex: '#F3D5B5',
    presetRef: SAMPLE_PET_PRESETS[3],
  },
];

export const OffspringSimulatorTab: React.FC<OffspringSimulatorTabProps> = ({
  analysisResult,
  parent1PhotoUrl,
}) => {
  const [viewMode, setViewMode] = useState<'video' | 'photos'>('video');
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

  const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(true);
  const [videoTimeSec, setVideoTimeSec] = useState<number>(0);
  const [isRecordingDownload, setIsRecordingDownload] = useState<boolean>(false);
  const partnerCameraRef = useRef<HTMLInputElement | null>(null);
  const partnerAlbumRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    analyzeUploadedPhotoColors(parent1PhotoUrl).then((info) => {
      setParent1Hex(info.rgbHex);
    });
  }, [parent1PhotoUrl]);

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

  // 3.0-Second Animation Loop
  useEffect(() => {
    if (viewMode !== 'video') return;
    const canvas = videoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const startTime = performance.now();
    const durationMs = 3000;

    const renderFrame = (now: number) => {
      const elapsed = isPlayingVideo ? (now - startTime) % durationMs : videoTimeSec * 1000;
      const tSec = elapsed / 1000;
      if (isPlayingVideo) {
        setVideoTimeSec(Number(tSec.toFixed(1)));
      }

      const w = canvas.width;
      const h = canvas.height;

      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#FFF9F4');
      bg.addColorStop(1, '#FCE4D8');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const headTiltRad = Math.sin(tSec * Math.PI * 1.35) * 0.16;
      const bounceY = Math.abs(Math.sin(tSec * Math.PI * 2.7)) * -14;
      const earWiggleRad = Math.sin(tSec * Math.PI * 4) * 0.14;

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
  }, [viewMode, isPlayingVideo, analysisResult, parent1Hex, partner]);

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

  const handleSaveOrShare3SecVideo = async (useMobileShare: boolean) => {
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

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: mimeType });
        const fileName = `펫타임_${analysisResult.petName}x${partner.name}_2세_3초영상.webm`;

        if (useMobileShare && navigator.share) {
          try {
            const file = new File([blob], fileName, { type: 'video/webm' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: `${analysisResult.petName} ♥ ${partner.name} 2세 예측 3초 영상`,
                files: [file],
              });
              setIsRecordingDownload(false);
              return;
            }
          } catch {
            // fallback
          }
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
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
    <div className="space-y-3">
      {/* 1. COMPACT MOBILE DUAL-PARENT & PARTNER UPLOAD CARD */}
      <div className="bg-white rounded-[20px] p-3.5 border border-[#FFE3DE] space-y-2.5">
        <div className="grid grid-cols-11 gap-2 items-center bg-[#FFFDF9] p-2.5 rounded-[16px] border border-[#F3E3D3]">
          <div className="col-span-5 text-center space-y-1">
            <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-[#FF7E67]">
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

          <div className="col-span-1 flex justify-center">
            <Heart className="w-5 h-5 text-[#FF7E67] fill-[#FF7E67] animate-pulse" />
          </div>

          <div className="col-span-5 text-center space-y-1">
            <div
              onClick={() => partnerAlbumRef.current?.click()}
              className="relative w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-dashed border-[#FF7E67] bg-[#FFF2EF] cursor-pointer active:scale-95 transition"
            >
              <img
                src={partner.photoDataUrl}
                alt={partner.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-[#2B2D42]/75 text-white text-[9px] font-bold py-0.5">
                변경
              </div>
            </div>
            <div className="text-xs font-extrabold text-[#FF7E67] truncate">
              {partner.name} {partner.isFromVideo ? '(🎬영상)' : '(상대 펫)'}
            </div>
          </div>
        </div>

        {/* Big Mobile Partner Upload Buttons: Camera vs Album */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => partnerCameraRef.current?.click()}
            className="min-h-[44px] px-2 rounded-[12px] bg-[#FF7E67] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>상대 펫 촬영</span>
          </button>
          <button
            type="button"
            onClick={() => partnerAlbumRef.current?.click()}
            className="min-h-[44px] px-2 rounded-[12px] bg-[#FFF2EF] text-[#FF7E67] border border-[#FFC5BB] font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>상대 사진·영상 선택</span>
          </button>
        </div>

        <input
          ref={partnerCameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePartnerFileUpload}
          className="hidden"
        />
        <input
          ref={partnerAlbumRef}
          type="file"
          accept="image/*,video/*"
          onChange={handlePartnerFileUpload}
          className="hidden"
        />

        {/* 1-Tap Partner Sample Chips */}
        <div className="grid grid-cols-4 gap-1">
          {PARTNER_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPartnerPreset(p)}
              className={`min-h-[34px] rounded-[10px] text-[10px] font-extrabold border transition cursor-pointer ${
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

      {/* 2. ONE-HANDED SUB-MODE SWITCHER: 3초 영상 vs 5장 사진 */}
      <div className="grid grid-cols-2 gap-1.5 bg-white p-1.5 rounded-[16px] border border-[#FFE3DE]">
        <button
          type="button"
          onClick={() => setViewMode('video')}
          className={`min-h-[44px] rounded-[12px] text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            viewMode === 'video'
              ? 'bg-[#FF7E67] text-white shadow-xs'
              : 'text-[#4A4E69]'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>2세 3초 모션 영상</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('photos')}
          className={`min-h-[44px] rounded-[12px] text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            viewMode === 'photos'
              ? 'bg-[#FF7E67] text-white shadow-xs'
              : 'text-[#4A4E69]'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>2세 사진 5장 앨범</span>
        </button>
      </div>

      {/* 3. VIEW MODE CONTENT (Fits cleanly on 1 Phone Screen!) */}
      {viewMode === 'video' ? (
        <div className="bg-white rounded-[20px] p-4 border border-[#FFE3DE] space-y-3">
          <div className="relative rounded-[18px] overflow-hidden border-2 border-[#FFC5BB] aspect-square w-full max-w-[310px] mx-auto bg-[#FFF9F4]">
            <canvas
              ref={videoCanvasRef}
              width={540}
              height={540}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="w-full h-2 bg-[#FFF2EF] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FF7E67] transition-all duration-100"
              style={{ width: `${Math.min(100, (videoTimeSec / 3.0) * 100)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setIsPlayingVideo((prev) => !prev)}
              className="min-h-[46px] rounded-[12px] bg-[#FFF2EF] text-[#4A4E69] text-xs font-extrabold flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-[#FF7E67]" />
              <span>{isPlayingVideo ? '일시정지' : '재생'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSaveOrShare3SecVideo(false)}
              disabled={isRecordingDownload}
              className="min-h-[46px] rounded-[12px] bg-[#FF7E67] text-white text-xs font-extrabold flex items-center justify-center gap-1 shadow-xs active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isRecordingDownload ? '저장 중...' : '3초영상 저장'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSaveOrShare3SecVideo(true)}
              disabled={isRecordingDownload}
              className="min-h-[46px] rounded-[12px] bg-[#4A4E69] text-white text-xs font-extrabold flex items-center justify-center gap-1 shadow-xs active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-[#FFD166]" />
              <span>SNS 공유</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[20px] p-4 border border-[#FFE3DE] space-y-3">
          {activePhoto && !isGeneratingMedia ? (
            <>
              <div className="relative rounded-[18px] overflow-hidden border-2 border-[#FFE3DE] aspect-square w-full max-w-[310px] mx-auto bg-[#FFFDF9]">
                <img
                  src={activePhoto.imageUrl}
                  alt={activePhoto.title}
                  className="w-full h-full object-cover"
                />
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
                          : 'border-[#FFE3DE] opacity-75'
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

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadSinglePhoto(activePhoto)}
                  className="min-h-[46px] rounded-[12px] bg-[#FFF2EF] text-[#FF7E67] border border-[#FFC5BB] text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>현재 사진 저장</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadAllFivePhotos}
                  className="min-h-[46px] rounded-[12px] bg-[#FF7E67] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>5장 모두 저장</span>
                </button>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs font-bold text-[#6C708A]">
              <Sparkles className="w-6 h-6 text-[#FF7E67] animate-spin mx-auto mb-2" />
              5장의 사진을 생성하고 있어요...
            </div>
          )}
        </div>
      )}
    </div>
  );
};
