import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Camera,
  Download,
  Share2,
  Play,
  Sparkles,
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
    label: '🐶 초코',
    furColorHex: '#9C6644',
    secondaryHex: '#E6CCB2',
    presetRef: SAMPLE_PET_PRESETS[0],
  },
  {
    id: 'partner-nabi',
    name: '나비',
    label: '🐱 나비',
    furColorHex: '#E76F51',
    secondaryHex: '#FFF8F0',
    presetRef: SAMPLE_PET_PRESETS[1],
  },
  {
    id: 'partner-mocha',
    name: '모카',
    label: '🐰 모카',
    furColorHex: '#DDB892',
    secondaryHex: '#7F5539',
    presetRef: SAMPLE_PET_PRESETS[2],
  },
  {
    id: 'partner-cookie',
    name: '쿠키',
    label: '🐹 쿠키',
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
  const [partnerNameInput, setPartnerNameInput] = useState<string>('');
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
      colorDesc: '초코 브라운',
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

  const effectivePartnerName = partnerNameInput.trim() || partner.name;

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
      partner: { ...partner, name: effectivePartnerName },
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
  }, [parent1PhotoUrl, parent1Hex, partner, effectivePartnerName, analysisResult]);

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
      bg.addColorStop(0, '#FFF6F0');
      bg.addColorStop(0.5, '#FFF0F6');
      bg.addColorStop(1, '#EEF6FF');
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

      ctx.fillStyle = 'rgba(43, 45, 66, 0.78)';
      ctx.beginPath();
      ctx.roundRect(18, 18, 290, 36, 18);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px "Pretendard Variable", Pretendard, sans-serif';
      ctx.fillText(
        `🍼 ${analysisResult.petName} ♥ ${effectivePartnerName} 2세`,
        32,
        41
      );

      ctx.fillStyle = '#FF6B9D';
      ctx.beginPath();
      ctx.roundRect(w - 112, 18, 94, 34, 17);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px "Pretendard Variable", Pretendard, sans-serif';
      ctx.fillText(`${tSec.toFixed(1)}s / 3s`, w - 96, 40);

      if (isPlayingVideo) {
        animId = requestAnimationFrame(renderFrame);
      }
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, [viewMode, isPlayingVideo, analysisResult, parent1Hex, partner, effectivePartnerName]);

  const handlePartnerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsGeneratingMedia(true);
    try {
      const extracted = await extractPartnerPetMedia(file, effectivePartnerName);
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
        const fileName = `2세_${analysisResult.petName}x${effectivePartnerName}_3초영상.webm`;

        if (useMobileShare && navigator.share) {
          try {
            const file = new File([blob], fileName, { type: 'video/webm' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: `2세 3초 영상`,
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
    a.download = `2세_${item.stepNumber}번_${analysisResult.petName}.jpg`;
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
    <div className="space-y-2.5">
      {/* 1. COMPACT DUAL-PARENT CARD */}
      <div className="bg-white rounded-[20px] p-3.5 border border-[#FFC4DC] space-y-2.5">
        <div className="grid grid-cols-11 gap-2 items-center bg-[#FFF8FB] p-2.5 rounded-[16px] border border-[#FFC4DC]">
          <div className="col-span-5 text-center space-y-1">
            <div className="w-15 h-15 mx-auto rounded-full overflow-hidden border-2 border-[#FF8A3D]">
              <img
                src={parent1PhotoUrl}
                alt={analysisResult.petName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-xs font-extrabold text-[#2B2D42] truncate">
              {analysisResult.petName}
            </div>
          </div>

          <div className="col-span-1 flex justify-center">
            <Heart className="w-5 h-5 text-[#FF6B9D] fill-[#FF6B9D] animate-pulse" />
          </div>

          <div className="col-span-5 text-center space-y-1">
            <div
              onClick={() => partnerAlbumRef.current?.click()}
              className="relative w-15 h-15 mx-auto rounded-full overflow-hidden border-2 border-dashed border-[#FF6B9D] bg-white cursor-pointer active:scale-95 transition"
            >
              <img
                src={partner.photoDataUrl}
                alt={effectivePartnerName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-[#FF6B9D] text-white text-[9px] font-bold">
                변경
              </div>
            </div>
            <div className="text-xs font-extrabold text-[#FF6B9D] truncate">
              {effectivePartnerName}
            </div>
          </div>
        </div>

        {/* Faint Placeholder Partner Name Input */}
        <input
          type="text"
          value={partnerNameInput}
          onChange={(e) => setPartnerNameInput(e.target.value)}
          placeholder="상대 펫 이름·특징 입력 (적으면 안내글이 사라져요)"
          className="w-full min-h-[38px] px-3 rounded-[12px] bg-[#FFFDF9] border border-[#FFC4DC] text-xs font-bold text-[#2B2D42] placeholder:text-[#B08D9E] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]"
        />

        {/* Partner Upload Buttons */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => partnerCameraRef.current?.click()}
            className="min-h-[42px] rounded-[12px] bg-[#FF8A3D] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>상대 펫 촬영</span>
          </button>
          <button
            type="button"
            onClick={() => partnerAlbumRef.current?.click()}
            className="min-h-[42px] rounded-[12px] bg-[#EEF6FF] text-[#4A90E2] border border-[#BFE0FF] font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>사진·영상 선택</span>
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

        <div className="grid grid-cols-4 gap-1">
          {PARTNER_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPartnerPreset(p)}
              className={`min-h-[34px] rounded-[10px] text-[11px] font-extrabold border transition cursor-pointer ${
                partner.name === p.name
                  ? 'bg-[#FF6B9D] text-white border-[#FF6B9D]'
                  : 'bg-white text-[#4A4E69] border-[#E2E8F0]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. SUB-MODE SWITCHER: 3초 영상 vs 5장 사진 */}
      <div className="grid grid-cols-2 gap-1.5 bg-white p-1.5 rounded-[16px] border border-[#FFD5B5]">
        <button
          type="button"
          onClick={() => setViewMode('video')}
          className={`min-h-[42px] rounded-[12px] text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            viewMode === 'video'
              ? 'bg-[#FF8A3D] text-white shadow-xs'
              : 'text-[#4A4E69]'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>3초 영상</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('photos')}
          className={`min-h-[42px] rounded-[12px] text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            viewMode === 'photos'
              ? 'bg-[#FF6B9D] text-white shadow-xs'
              : 'text-[#4A4E69]'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>사진 5장</span>
        </button>
      </div>

      {/* 3. VIEW CONTENT */}
      {viewMode === 'video' ? (
        <div className="bg-white rounded-[20px] p-3.5 border border-[#FFD5B5] space-y-2.5">
          <div className="relative rounded-[18px] overflow-hidden border-2 border-[#FFC4DC] aspect-square w-full max-w-[300px] mx-auto bg-[#FFF9F4]">
            <canvas
              ref={videoCanvasRef}
              width={540}
              height={540}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="w-full h-2 bg-[#FFF0F6] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FF8A3D] to-[#FF6B9D] transition-all duration-100"
              style={{ width: `${Math.min(100, (videoTimeSec / 3.0) * 100)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setIsPlayingVideo((prev) => !prev)}
              className="min-h-[44px] rounded-[12px] bg-[#FFF3E8] text-[#FF8A3D] text-xs font-extrabold flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isPlayingVideo ? '정지' : '재생'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSaveOrShare3SecVideo(false)}
              disabled={isRecordingDownload}
              className="min-h-[44px] rounded-[12px] bg-[#FF8A3D] text-white text-xs font-extrabold flex items-center justify-center gap-1 active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isRecordingDownload ? '저장중' : '영상저장'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSaveOrShare3SecVideo(true)}
              disabled={isRecordingDownload}
              className="min-h-[44px] rounded-[12px] bg-[#4A90E2] text-white text-xs font-extrabold flex items-center justify-center gap-1 active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>공유</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[20px] p-3.5 border border-[#FFC4DC] space-y-2.5">
          {activePhoto && !isGeneratingMedia ? (
            <>
              <div className="relative rounded-[18px] overflow-hidden border-2 border-[#FFC4DC] aspect-square w-full max-w-[300px] mx-auto bg-white">
                <img
                  src={activePhoto.imageUrl}
                  alt={activePhoto.title}
                  className="w-full h-full object-cover"
                />
              </div>

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
                          ? 'border-[#FF6B9D] scale-[1.03]'
                          : 'border-[#E2E8F0] opacity-75'
                      }`}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-[#FF6B9D] text-white text-[10px] font-extrabold flex items-center justify-center">
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
                  className="min-h-[44px] rounded-[12px] bg-[#EEF6FF] text-[#4A90E2] border border-[#BFE0FF] text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>1장 저장</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadAllFivePhotos()}
                  className="min-h-[44px] rounded-[12px] bg-[#FF6B9D] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>5장 모두 저장</span>
                </button>
              </div>
            </>
          ) : (
            <div className="py-10 text-center text-xs font-bold text-[#6C708A]">
              <Sparkles className="w-6 h-6 text-[#FF6B9D] animate-spin mx-auto mb-2" />
              생성 중...
            </div>
          )}
        </div>
      )}
    </div>
  );
};
