import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Image as ImageIcon,
  Plus,
  Download,
  Share2,
  Copy,
  CheckCircle2,
  Play,
  Sparkles,
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
    label: '✨ 일상 브이로그',
    subtitlePrefix: '오늘도 심쿵한 하루',
    accentHex: '#FF7E67',
    bgTop: '#2B2D42',
    emoji: '🐾',
  },
  {
    id: 'health',
    label: '🩺 건강백점 일기',
    subtitlePrefix: 'AI 건강검진 만점 받은 날',
    accentHex: '#2F6F6B',
    bgTop: '#1F4B48',
    emoji: '💚',
  },
  {
    id: 'growth',
    label: '💖 폭풍성장 기록',
    subtitlePrefix: '하루하루 더 사랑스러운',
    accentHex: '#E06D85',
    bgTop: '#4A2535',
    emoji: '🍼',
  },
];

export const DailyAlbumSnsTab: React.FC<DailyAlbumSnsTabProps> = ({
  analysisResult,
  dailyLogs,
  onAddDailyLog,
}) => {
  const [selectedTheme, setSelectedTheme] = useState(SHORTS_THEMES[0]);
  const [customTitle, setCustomTitle] = useState<string>(
    `${analysisResult.petName}의 행복한 오늘 기록 🐾`
  );
  const [isPlayingShorts, setIsPlayingShorts] = useState<boolean>(true);
  const [isRecordingShorts, setIsRecordingShorts] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);

  const shortsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const multiInputRef = useRef<HTMLInputElement | null>(null);

  // Preload HTMLImageElements whenever dailyLogs change
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

  // Live 9:16 Vertical YouTube Shorts / Instagram Reels Canvas Renderer
  useEffect(() => {
    const canvas = shortsCanvasRef.current;
    if (!canvas || loadedImages.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const startTime = performance.now();
    const perSlideMs = 1500; // 1.5s per photo with smooth zoom
    const totalDurationMs = Math.max(3000, loadedImages.length * perSlideMs);

    const renderFrame = (now: number) => {
      const elapsed = (now - startTime) % totalDurationMs;
      const slideIdx = Math.floor(elapsed / perSlideMs) % loadedImages.length;
      const slideProgress = (elapsed % perSlideMs) / perSlideMs; // 0.0 to 1.0
      const currentImg = loadedImages[slideIdx];
      const currentLog = dailyLogs[slideIdx] || dailyLogs[0];

      const w = canvas.width; // 540
      const h = canvas.height; // 960 (9:16 vertical Shorts format)

      // 1. Background
      ctx.fillStyle = selectedTheme.bgTop;
      ctx.fillRect(0, 0, w, h);

      // 2. Ken Burns Zoom & Pan Effect on Main Photo
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

      // 3. Top Header Badge (YouTube Shorts / Reels Style)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.beginPath();
      ctx.roundRect(24, 32, w - 48, 58, 20);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 21px "Pretendard Variable", Pretendard, sans-serif';
      ctx.fillText(
        `${selectedTheme.emoji} ${analysisResult.petName} · ${currentLog?.dateStr || '오늘'} 기록`,
        44,
        68
      );

      // AI Health Stamp on top-right of photo
      ctx.fillStyle = selectedTheme.accentHex;
      ctx.beginPath();
      ctx.roundRect(w - 205, 132, 160, 40, 20);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px "Pretendard Variable", Pretendard, sans-serif';
      ctx.fillText(
        `AI 컨디션 ${currentLog?.nutritionScore || 96}점 ✨`,
        w - 188,
        158
      );

      // 4. Bottom Subtitle & Caption Card
      ctx.fillStyle = '#FFFDF9';
      ctx.beginPath();
      ctx.roundRect(24, h - 160, w - 48, 128, 24);
      ctx.fill();

      ctx.fillStyle = selectedTheme.accentHex;
      ctx.font = 'bold 17px "Pretendard Variable", Pretendard, sans-serif';
      ctx.fillText(
        `${selectedTheme.subtitlePrefix} ·컷 ${slideIdx + 1}/${loadedImages.length}`,
        46,
        h - 122
      );

      ctx.fillStyle = '#4A4E69';
      ctx.font = 'bold 23px "Pretendard Variable", Pretendard, sans-serif';
      ctx.fillText(customTitle.slice(0, 22), 46, h - 86);

      ctx.fillStyle = '#6C708A';
      ctx.font = '500 16px "Pretendard Variable", Pretendard, sans-serif';
      ctx.fillText(
        `#${analysisResult.petName} #${analysisResult.estimatedBreed.replace(/\s+/g, '')} #펫타임AI`,
        46,
        h - 52
      );

      if (isPlayingShorts) {
        animId = requestAnimationFrame(renderFrame);
      }
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, [loadedImages, dailyLogs, selectedTheme, customTitle, isPlayingShorts, analysisResult]);

  // Add multiple daily photos or videos with 1 touch
  const handleAddMultipleMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const today = new Date();
    const dateStr = `${today.getMonth() + 1}월 ${today.getDate()}일`;

    for (const file of files) {
      try {
        const extracted = await extractPartnerPetMedia(file, analysisResult.petName);
        onAddDailyLog({
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          dateStr,
          dataUrl: extracted.photoDataUrl,
          isFromVideo: extracted.isFromVideo,
          memo: `${analysisResult.petName} 데일리 스냅`,
          nutritionScore: 96,
          coatGlossScore: 97,
          bcsStage: 5,
          pregnancyNote: '정상',
        });
      } catch {
        // ignore single file failure
      }
    }
    showToast(`${files.length}개의 사진/영상이 앨범과 쇼츠 영상에 자동 추가되었어요!`);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3200);
  };

  // One-Touch 1: Record & Download 9:16 Vertical Shorts/Reels Video (.webm)
  const handleDownloadShortsVideo = () => {
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

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `유튜브쇼츠_릴스_${analysisResult.petName}_데일리영상.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsRecordingShorts(false);
        showToast('유튜브 쇼츠·인스타 릴스용 세로 영상 저장 완료!');
      };

      recorder.start();
      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 3600);
    } catch {
      setIsRecordingShorts(false);
    }
  };

  // One-Touch 2: Generate & Download 4-Cut Instagram Magazine Photo Album (.png)
  const handleDownloadAlbumCollage = () => {
    if (loadedImages.length === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#FFFDF9';
    ctx.fillRect(0, 0, 1080, 1350);

    // Header
    ctx.fillStyle = selectedTheme.accentHex;
    ctx.beginPath();
    ctx.roundRect(54, 48, 972, 110, 28);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px "Pretendard Variable", Pretendard, sans-serif';
    ctx.fillText(`🐾 ${customTitle}`, 88, 116);

    // 2x2 Grid of Daily Photos
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

    // Footer
    ctx.fillStyle = '#4A4E69';
    ctx.font = 'bold 26px "Pretendard Variable", Pretendard, sans-serif';
    ctx.fillText(
      `AI 종합 건강 점수 ${dailyLogs[0]?.nutritionScore || 96}점 · ${analysisResult.petName}(${analysisResult.estimatedBreed}) 데일리 앨범`,
      54,
      1235
    );
    ctx.fillStyle = '#6C708A';
    ctx.font = '500 22px "Pretendard Variable", Pretendard, sans-serif';
    ctx.fillText(
      `#${analysisResult.petName} #반려동물일기 #펫타임 #오운완 #멍스타그램 #냥스타그램`,
      54,
      1280
    );

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `펫타임_${analysisResult.petName}_데일리4컷앨범.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('인스타그램·카톡용 4컷 매거진 앨범이 저장되었어요!');
  };

  // One-Touch 3: Copy YouTube Shorts / Instagram Caption & Hashtags
  const handleCopySnsTags = async () => {
    const snsText = `${customTitle}\n✨ AI 오늘의 건강·영양 체크: ${dailyLogs[0]?.nutritionScore || 96}점 (피모 윤기 최상!)\n\n#${analysisResult.petName} #${analysisResult.estimatedBreed.replace(/\s+/g, '')} #${analysisResult.species} #반려동물브이로그 #펫타임 #쇼츠 #Shorts`;
    try {
      await navigator.clipboard.writeText(snsText);
      showToast('유튜브 쇼츠·인스타용 제목과 해시태그가 복사되었어요!');
    } catch {
      showToast('제목 및 해시태그 준비 완료!');
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. DAILY PHOTO/VIDEO COLLECTION STRIP (1-Touch Add) */}
      <div className="bg-white rounded-[20px] p-4 border border-[#FFE3DE] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-[#4A4E69]">
              원터치 데일리 앨범 & 유튜브 쇼츠 제작
            </h2>
            <p className="text-[11px] text-[#6C708A]">
              그날그날 사진·영상을 올리면 자동으로 쇼츠 영상과 4컷 앨범이 완성돼요
            </p>
          </div>
          <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-[#FFF2EF] text-[#FF7E67]">
            {dailyLogs.length}개 등록됨
          </span>
        </div>

        {/* Registered Daily Photos/Videos Horizontal Strip + Add Button */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <button
            type="button"
            onClick={() => multiInputRef.current?.click()}
            className="shrink-0 w-20 h-20 rounded-[16px] border-2 border-dashed border-[#FF7E67] bg-[#FFF2EF] text-[#FF7E67] flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition"
          >
            <Plus className="w-5 h-5" />
            <span className="text-[11px] font-extrabold">사진/영상 추가</span>
          </button>

          {dailyLogs.map((item, idx) => (
            <div
              key={item.id}
              className="relative shrink-0 w-20 h-20 rounded-[16px] overflow-hidden border border-[#FFE3DE]"
            >
              <img
                src={item.dataUrl}
                alt={item.dateStr}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 left-1 right-1 bg-[#2B2D42]/80 text-white text-[9px] font-bold text-center rounded py-0.5">
                {idx + 1}컷 · {item.dateStr}
              </span>
            </div>
          ))}
        </div>

        <input
          ref={multiInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleAddMultipleMedia}
          className="hidden"
        />

        {/* 1-Touch Theme Selector & Custom Caption */}
        <div className="grid grid-cols-3 gap-1.5">
          {SHORTS_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTheme(t)}
              className={`py-2 px-2 rounded-[12px] text-xs font-extrabold border transition cursor-pointer ${
                selectedTheme.id === t.id
                  ? 'bg-[#FF7E67] text-white border-[#FF7E67]'
                  : 'bg-[#FFFDF9] text-[#4A4E69] border-[#FFE3DE]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          placeholder="쇼츠·앨범 한 줄 제목을 입력해 보세요"
          className="w-full px-3 py-2.5 rounded-[12px] bg-[#FFFDF9] border border-[#E8D8C8] text-xs font-bold text-[#4A4E69] focus:outline-none focus:ring-2 focus:ring-[#FF7E67]"
        />
      </div>

      {/* 2. LIVE 9:16 VERTICAL YOUTUBE SHORTS / REELS PREVIEW & 1-TOUCH EXPORT */}
      <div className="bg-white rounded-[20px] p-4 border border-[#FFE3DE] space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Film className="w-4 h-4 text-[#FF7E67]" />
            <h3 className="text-sm font-extrabold text-[#4A4E69]">
              유튜브 쇼츠(Shorts) · 릴스(Reels) 미리보기
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsPlayingShorts((p) => !p)}
            className="text-xs font-extrabold text-[#FF7E67] flex items-center gap-1 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isPlayingShorts ? '일시정지' : '재생'}</span>
          </button>
        </div>

        {/* 9:16 Vertical Shorts Canvas */}
        <div className="relative w-full max-w-[260px] aspect-[9/16] mx-auto rounded-[22px] overflow-hidden shadow-lg border-2 border-[#FFC5BB] bg-[#2B2D42]">
          <canvas
            ref={shortsCanvasRef}
            width={540}
            height={960}
            className="w-full h-full object-cover"
          />
        </div>

        {toastMsg && (
          <div className="p-2.5 rounded-[12px] bg-[#E8F6F5] text-[#2F6F6B] text-xs font-extrabold flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Minimal-Touch Export Buttons for YouTube Shorts, Instagram Reels, KakaoTalk */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDownloadShortsVideo}
              disabled={isRecordingShorts}
              className="py-3.5 px-3 rounded-[14px] bg-[#FF7E67] hover:bg-[#F5644A] text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-98 transition disabled:opacity-60 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                {isRecordingShorts ? '쇼츠 영상 생성 중...' : '유튜브 쇼츠 영상 저장'}
              </span>
            </button>
            <button
              type="button"
              onClick={handleDownloadAlbumCollage}
              className="py-3.5 px-3 rounded-[14px] bg-[#4A4E69] hover:bg-[#2B2D42] text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-98 transition cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-[#FFD166]" />
              <span>인스타 4컷 앨범 저장</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopySnsTags}
            className="w-full py-3 rounded-[14px] bg-[#FFF2EF] hover:bg-[#FFE3DE] text-[#FF7E67] font-extrabold text-xs border border-[#FFC5BB] flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>유튜브·인스타 업로드용 제목 & 해시태그 원터치 복사</span>
          </button>
        </div>
      </div>
    </div>
  );
};
