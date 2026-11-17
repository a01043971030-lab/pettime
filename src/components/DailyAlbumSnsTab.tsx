import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Image as ImageIcon,
  Plus,
  Camera,
  Download,
  Share2,
  Copy,
  CheckCircle2,
  Play,
} from 'lucide-react';
import { PetTimeAnalysisResult } from '../types';
import { DailyCareMediaItem } from './AutoCareSystemTab';
import { extractPartnerPetMedia } from '../utils/petImageProcessor';

interface DailyAlbumSnsTabProps {
  analysisResult: PetTimeAnalysisResult;
  dailyLogs: DailyCareMediaItem[];
  onAddDailyLog: (item: DailyCareMediaItem) => void;
}

const SHORTS_THEMES = [
  {
    id: 'vlog',
    label: '🧡 일상',
    subtitlePrefix: '오늘의 귀여움',
    accentHex: '#FF8A3D',
    bgTop: '#2B2D42',
    emoji: '🐾',
  },
  {
    id: 'growth',
    label: '💗 성장',
    subtitlePrefix: '심쿵 성장일기',
    accentHex: '#FF6B9D',
    bgTop: '#3E2336',
    emoji: '🍼',
  },
  {
    id: 'health',
    label: '💙 건강',
    subtitlePrefix: '건강 만점 기록',
    accentHex: '#4A90E2',
    bgTop: '#1E3552',
    emoji: '✨',
  },
];

export const DailyAlbumSnsTab: React.FC<DailyAlbumSnsTabProps> = ({
  analysisResult,
  dailyLogs,
  onAddDailyLog,
}) => {
  const [studioMode, setStudioMode] = useState<'shorts' | 'album'>('shorts');
  const [selectedTheme, setSelectedTheme] = useState(SHORTS_THEMES[0]);
  // Starts empty so faint placeholder guide text shows and disappears when user types!
  const [customTitle, setCustomTitle] = useState<string>('');
  const [isPlayingShorts, setIsPlayingShorts] = useState<boolean>(true);
  const [isRecordingShorts, setIsRecordingShorts] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);
  const [albumPreviewUrl, setAlbumPreviewUrl] = useState<string>('');

  const shortsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const multiInputRef = useRef<HTMLInputElement | null>(null);
  const cameraQuickRef = useRef<HTMLInputElement | null>(null);

  const effectiveTitle =
    customTitle.trim() || `${analysisResult.petName}의 행복한 하루 🐾`;

  useEffect(() => {
    let active = true;
    Promise.all(
      dailyLogs.map(
        (item) =>
          new Promise<HTMLImageElement>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(img);
            img.src = item.dataUrl;
          })
      )
    ).then((imgs) => {
      if (active) setLoadedImages(imgs.filter((im) => im.width > 0));
    });
    return () => {
      active = false;
    };
  }, [dailyLogs]);

  // Generate 4-Cut Album Collage Preview
  useEffect(() => {
    if (loadedImages.length === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 1080, 1350);

    ctx.fillStyle = selectedTheme.accentHex;
    ctx.beginPath();
    ctx.roundRect(54, 48, 972, 110, 28);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px "Pretendard Variable", Pretendard, sans-serif';
    ctx.fillText(`🐾 ${effectiveTitle}`, 88, 116);

    const slots = [0, 1, 2, 3].map((i) => loadedImages[i % loadedImages.length]);
    const boxSize = 468;
    const positions = [
      { x: 54, y: 190 },
      { x: 558, y: 190 },
      { x: 54, y: 694 },
      { x: 558, y: 694 },
    ];

    slots.forEach((img, idx) => {
      const pos = positions[idx];
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(pos.x, pos.y, boxSize, boxSize, 26);
      ctx.clip();
      const m = Math.min(img.width, img.height);
      ctx.drawImage(
        img,
        (img.width - m) / 2,
        (img.height - m) / 2,
        m,
        m,
        pos.x,
        pos.y,
        boxSize,
        boxSize
      );
      ctx.restore();
    });

    ctx.fillStyle = '#2B2D42';
    ctx.font = 'bold 26px "Pretendard Variable", Pretendard, sans-serif';
    ctx.fillText(
      `AI 컨디션 ${dailyLogs[0]?.nutritionScore || 96}점 · ${analysisResult.petName}`,
      54,
      1235
    );
    ctx.fillStyle = '#4A90E2';
    ctx.font = '600 22px "Pretendard Variable", Pretendard, sans-serif';
    ctx.fillText(
      `#${analysisResult.petName} #반려동물 #펫타임 #쇼츠`,
      54,
      1280
    );

    setAlbumPreviewUrl(canvas.toDataURL('image/png'));
  }, [loadedImages, selectedTheme, effectiveTitle, dailyLogs, analysisResult]);

  // Live 9:16 Vertical Shorts Renderer
  useEffect(() => {
    if (studioMode !== 'shorts') return;
    const canvas = shortsCanvasRef.current;
    if (!canvas || loadedImages.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const startTime = performance.now();
    const perSlideMs = 1500;
    const totalDurationMs = Math.max(3000, loadedImages.length * perSlideMs);

    const renderFrame = (now: number) => {
      const elapsed = (now - startTime) % totalDurationMs;
      const slideIdx = Math.floor(elapsed / perSlideMs) % loadedImages.length;
      const slideProgress = (elapsed % perSlideMs) / perSlideMs;
      const currentImg = loadedImages[slideIdx];
      const currentLog = dailyLogs[slideIdx] || dailyLogs[0];

      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = selectedTheme.bgTop;
      ctx.fillRect(0, 0, w, h);

      if (currentImg && currentImg.width > 0) {
        const zoom = 1.0 + slideProgress * 0.12;
        const minSide = Math.min(currentImg.width, currentImg.height);
        const cropSize = minSide / zoom;
        const sx = (currentImg.width - cropSize) / 2;
        const sy = (currentImg.height - cropSize) / 2;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(24, 110, w - 48, h - 290, 28);
        ctx.clip();
        ctx.drawImage(currentImg, sx, sy, cropSize, cropSize, 24, 110, w - 48, h - 290);
        ctx.restore();
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.beginPath();
      ctx.roundRect(24, 32, w - 48, 58, 20);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 21px "Pretendard Variable", Pretendard, sans-serif';
      ctx.fillText(
        `${selectedTheme.emoji} ${analysisResult.petName} · ${currentLog?.dateStr || '오늘'}`,
        44,
        68
      );

      ctx.fillStyle = selectedTheme.accentHex;
      ctx.beginPath();
      ctx.roundRect(w - 195, 132, 150, 40, 20);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px "Pretendard Variable", Pretendard, sans-serif';
      ctx.fillText(`컨디션 ${currentLog?.nutritionScore || 96}점 ✨`, w - 178, 158);

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(24, h - 160, w - 48, 128, 24);
      ctx.fill();

      ctx.fillStyle = selectedTheme.accentHex;
      ctx.font = 'bold 17px "Pretendard Variable", Pretendard, sans-serif';
      ctx.fillText(
        `${selectedTheme.subtitlePrefix} (${slideIdx + 1}/${loadedImages.length})`,
        46,
        h - 122
      );

      ctx.fillStyle = '#2B2D42';
      ctx.font = 'bold 23px "Pretendard Variable", Pretendard, sans-serif';
      ctx.fillText(effectiveTitle.slice(0, 22), 46, h - 86);

      ctx.fillStyle = '#4A90E2';
      ctx.font = '600 16px "Pretendard Variable", Pretendard, sans-serif';
      ctx.fillText(
        `#${analysisResult.petName} #${analysisResult.species} #펫타임`,
        46,
        h - 52
      );

      if (isPlayingShorts) {
        animId = requestAnimationFrame(renderFrame);
      }
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, [studioMode, loadedImages, dailyLogs, selectedTheme, effectiveTitle, isPlayingShorts, analysisResult]);

  const handleAddMultipleMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const today = new Date();
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}`;

    for (const file of files) {
      try {
        const extracted = await extractPartnerPetMedia(file, analysisResult.petName);
        onAddDailyLog({
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          dateStr,
          dataUrl: extracted.photoDataUrl,
          isFromVideo: extracted.isFromVideo,
          memo: `${analysisResult.petName}`,
          nutritionScore: 96,
          coatGlossScore: 97,
          bcsStage: 5,
          pregnancyNote: '정상',
        });
      } catch {
        // ignore
      }
    }
    showToast(`${files.length}개 추가 완료!`);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleSaveOrShareShortsVideo = (useMobileShare: boolean) => {
    const canvas = shortsCanvasRef.current;
    if (!canvas || isRecordingShorts) return;

    try {
      setIsRecordingShorts(true);
      setIsPlayingShorts(true);
      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeBitsPerSecond: 3000000, mimeType });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: mimeType });
        const fileName = `쇼츠_${analysisResult.petName}.webm`;

        if (useMobileShare && navigator.share) {
          try {
            const file = new File([blob], fileName, { type: 'video/webm' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: effectiveTitle,
                files: [file],
              });
              setIsRecordingShorts(false);
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
        setIsRecordingShorts(false);
        showToast('쇼츠 영상 저장 완료!');
      };

      recorder.start();
      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 3100);
    } catch {
      setIsRecordingShorts(false);
    }
  };

  const handleSaveOrShareAlbum = async (useMobileShare: boolean) => {
    if (!albumPreviewUrl) return;
    const fileName = `앨범_${analysisResult.petName}.png`;

    if (useMobileShare && navigator.share) {
      try {
        const res = await fetch(albumPreviewUrl);
        const blob = await res.blob();
        const file = new File([blob], fileName, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: effectiveTitle,
            files: [file],
          });
          return;
        }
      } catch {
        // fallback
      }
    }

    const a = document.createElement('a');
    a.href = albumPreviewUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('4컷 앨범 저장 완료!');
  };

  const handleCopySnsTags = async () => {
    const snsText = `${effectiveTitle}\n#${analysisResult.petName} #${analysisResult.species} #펫타임 #쇼츠 #Shorts`;
    try {
      await navigator.clipboard.writeText(snsText);
      showToast('제목·해시태그 복사 완료!');
    } catch {
      showToast('복사 완료!');
    }
  };

  return (
    <div className="space-y-2.5">
      {/* 1. COMPACT PHOTO/VIDEO STRIP + INPUT WITH FAINT PLACEHOLDER */}
      <div className="bg-white rounded-[20px] p-3.5 border border-[#FFC4DC] space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-[#2B2D42]">쇼츠 · 4컷 앨범</h2>
          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#FFF0F6] text-[#FF6B9D]">
            {dailyLogs.length}컷
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <button
            type="button"
            onClick={() => cameraQuickRef.current?.click()}
            className="shrink-0 w-15 h-15 rounded-[14px] bg-[#FF8A3D] text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span className="text-[10px] font-extrabold">촬영</span>
          </button>

          <button
            type="button"
            onClick={() => multiInputRef.current?.click()}
            className="shrink-0 w-15 h-15 rounded-[14px] border-2 border-dashed border-[#4A90E2] bg-[#EEF6FF] text-[#4A90E2] flex flex-col items-center justify-center gap-0.5 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="text-[10px] font-extrabold">추가</span>
          </button>

          {dailyLogs.map((item, idx) => (
            <div
              key={item.id}
              className="relative shrink-0 w-15 h-15 rounded-[14px] overflow-hidden border border-[#FFD5B5]"
            >
              <img
                src={item.dataUrl}
                alt={item.dateStr}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 inset-x-0 bg-[#2B2D42]/75 text-white text-[9px] font-bold text-center">
                {idx + 1}
              </span>
            </div>
          ))}
        </div>

        <input
          ref={cameraQuickRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleAddMultipleMedia}
          className="hidden"
        />
        <input
          ref={multiInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleAddMultipleMedia}
          className="hidden"
        />

        {/* Faint Placeholder Input (Disappears when user types!) */}
        <input
          type="text"
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          placeholder="영상·앨범 제목 입력 (비워두면 기본 제목 자동 적용)"
          className="w-full min-h-[40px] px-3 rounded-[12px] bg-[#FFF8FB] border border-[#FFC4DC] text-xs font-bold text-[#2B2D42] placeholder:text-[#B08D9E] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]"
        />

        <div className="grid grid-cols-3 gap-1.5">
          {SHORTS_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTheme(t)}
              className={`min-h-[36px] rounded-[10px] text-xs font-extrabold border transition cursor-pointer ${
                selectedTheme.id === t.id
                  ? 'bg-[#2B2D42] text-white border-[#2B2D42]'
                  : 'bg-white text-[#4A4E69] border-[#E2E8F0]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. MODE SWITCHER */}
      <div className="grid grid-cols-2 gap-1.5 bg-white p-1.5 rounded-[16px] border border-[#BFE0FF]">
        <button
          type="button"
          onClick={() => setStudioMode('shorts')}
          className={`min-h-[42px] rounded-[12px] text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            studioMode === 'shorts'
              ? 'bg-[#FF8A3D] text-white shadow-xs'
              : 'text-[#4A4E69]'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>유튜브 쇼츠 영상</span>
        </button>
        <button
          type="button"
          onClick={() => setStudioMode('album')}
          className={`min-h-[42px] rounded-[12px] text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            studioMode === 'album'
              ? 'bg-[#FF6B9D] text-white shadow-xs'
              : 'text-[#4A4E69]'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>인스타 4컷 앨범</span>
        </button>
      </div>

      {/* 3. PREVIEW & 1-TOUCH SHARE/SAVE */}
      <div className="bg-white rounded-[20px] p-3.5 border border-[#BFE0FF] space-y-2.5">
        {studioMode === 'shorts' ? (
          <>
            <div className="relative w-full max-w-[220px] aspect-[9/16] mx-auto rounded-[20px] overflow-hidden shadow-md border-2 border-[#FFD5B5] bg-[#2B2D42]">
              <canvas
                ref={shortsCanvasRef}
                width={540}
                height={960}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setIsPlayingShorts((p) => !p)}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/50 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3" />
                <span>{isPlayingShorts ? '정지' : '재생'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSaveOrShareShortsVideo(false)}
                disabled={isRecordingShorts}
                className="min-h-[46px] rounded-[14px] bg-[#FF8A3D] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isRecordingShorts ? '생성중...' : '영상 저장'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSaveOrShareShortsVideo(true)}
                disabled={isRecordingShorts}
                className="min-h-[46px] rounded-[14px] bg-[#4A90E2] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>SNS 공유</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {albumPreviewUrl && (
              <div className="w-full max-w-[250px] mx-auto rounded-[18px] overflow-hidden shadow-md border border-[#FFC4DC]">
                <img
                  src={albumPreviewUrl}
                  alt="4컷 앨범"
                  className="w-full h-auto object-contain"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSaveOrShareAlbum(false)}
                className="min-h-[46px] rounded-[14px] bg-[#FF6B9D] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>앨범 저장</span>
              </button>
              <button
                type="button"
                onClick={() => handleSaveOrShareAlbum(true)}
                className="min-h-[46px] rounded-[14px] bg-[#4A90E2] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>카톡·SNS 공유</span>
              </button>
            </div>
          </>
        )}

        {toastMsg && (
          <div className="p-2 rounded-[10px] bg-[#EEF6FF] text-[#4A90E2] text-xs font-extrabold flex items-center justify-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMsg}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleCopySnsTags}
          className="w-full min-h-[40px] rounded-[12px] bg-[#F8FAFC] text-[#4A90E2] font-extrabold text-xs border border-[#BFE0FF] flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>해시태그 복사</span>
        </button>
      </div>
    </div>
  );
};
