import React, { useState, useRef, useEffect } from 'react';
import { Camera, Download, RefreshCcw, Zap, Star, ChevronLeft } from 'lucide-react';

// --- Konfigurasi Tema Manga & Layout ---
const THEMES = [
  { 
    id: 'shonen', 
    name: 'SHONEN ACTION', 
    layout: 'vertical', 
    bg: '#ffffff', 
    primary: '#000000', 
    pattern: 'radial-gradient(circle, #000 1px, transparent 1px)', 
    patternSize: '8px 8px',
    description: 'Classic Vertical Strip',
    stripRatio: 'aspect-[320/1200]' 
  },
  { 
    id: 'cyber', 
    name: 'CYBER GRID', 
    layout: 'grid', 
    bg: '#000000', 
    primary: '#ffffff', 
    pattern: 'linear-gradient(45deg, #222 25%, transparent 25%, transparent 75%, #222 75%), linear-gradient(45deg, #222 25%, transparent 25%, transparent 75%, #222 75%)', 
    patternSize: '20px 20px',
    description: '2x2 Box Layout',
    stripRatio: 'aspect-[600/800]'
  },
  { 
    id: 'checker', 
    name: 'WIDE CINEMA', 
    layout: 'film', 
    bg: '#ffffff', 
    primary: '#000000', 
    pattern: 'repeating-linear-gradient(45deg, #e5e5e5 0, #e5e5e5 10px, #fff 10px, #fff 20px)', 
    patternSize: '100% 100%',
    description: 'Wide Film Style',
    stripRatio: 'aspect-[400/1000]'
  },
];

const FILTERS = [
  { name: 'INK', filter: 'grayscale(100%) contrast(1.2) brightness(1.1)' },
  { name: 'DARK', filter: 'grayscale(100%) contrast(1.5) brightness(0.8)' },
  { name: 'FADE', filter: 'grayscale(100%) brightness(1.2) sepia(20%)' },
  { name: 'SHARP', filter: 'grayscale(100%) contrast(1.1) drop-shadow(0px 0px 5px rgba(0,0,0,0.5))' },
  { name: 'NORMAL', filter: 'none' }, 
];

// --- Komponen SVG Manga Assets ---
const MangaEye = ({ className }) => (
  <svg viewBox="0 0 100 50" className={className} fill="currentColor">
    <path d="M10,25 Q50,-10 90,25 Q95,28 90,30 Q50,0 10,25 Z" />
    <circle cx="50" cy="25" r="12" />
    <circle cx="55" cy="22" r="4" fill="white" />
  </svg>
);

const SpeedLines = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} preserveAspectRatio="none">
    <path d="M0,0 L10,50 L0,100 M20,0 L30,50 L20,100 M40,0 L50,50 L40,100 M60,0 L70,50 L60,100 M80,0 L90,50 L80,100 M100,0 L110,50 L100,100" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3"/>
  </svg>
);

const MangaPhotobooth = () => {
  const [step, setStep] = useState('selection'); 
  const videoRef = useRef(null);
  const resultCanvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [photos, setPhotos] = useState([]); 
  const [countdown, setCountdown] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);

  const CAM_WIDTH = 640;
  const CAM_HEIGHT = 480;

  // --- 1. Camera Lifecycle ---
  useEffect(() => {
    if (step === 'booth') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [step]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: CAM_WIDTH, height: CAM_HEIGHT, facingMode: "user" },
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      alert("Camera Error: Izin kamera diperlukan.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // --- 2. Photo Logic ---
  const startPhotoSequence = () => {
    setCountdown(3);
    
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          takePhoto();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const takePhoto = () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 100);

    const video = videoRef.current;
    if (video) {
        const canvas = document.createElement('canvas');
        canvas.width = CAM_WIDTH;
        canvas.height = CAM_HEIGHT;
        const ctx = canvas.getContext('2d');

        ctx.filter = selectedFilter.filter;
        ctx.translate(CAM_WIDTH, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, CAM_WIDTH, CAM_HEIGHT);
        
        const photoData = canvas.toDataURL('image/png');
        setPhotos(prev => {
            const updated = [...prev, photoData];
            if (updated.length >= 4) {
                 setTimeout(() => setStep('result'), 800);
            }
            return updated;
        });
    }
  };

  useEffect(() => {
    if (step === 'result' && photos.length === 4) {
      drawMangaStrip();
    }
  }, [step, photos, selectedTheme]);

  const drawMangaStrip = () => {
    const canvas = resultCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let stripW, stripH, headerH, footerH, photoW, photoH, gap;
    
    headerH = 80;
    footerH = 200; 
    gap = 20;

    // --- LOGIC LAYOUT ---
    if (selectedTheme.layout === 'grid') {
        stripW = 600;
        photoW = (stripW - (gap * 3)) / 2;
        photoH = photoW * 0.75; 
        stripH = headerH + (photoH * 2) + (gap * 3) + footerH;
    } else if (selectedTheme.layout === 'film') {
        stripW = 400;
        photoW = stripW - (gap * 2);
        photoH = photoW * 0.56; 
        stripH = headerH + (photoH * 4) + (gap * 5) + footerH;
    } else {
        stripW = 320;
        photoW = stripW - (gap * 2);
        photoH = photoW * 0.75; 
        stripH = headerH + (photoH * 4) + (gap * 5) + footerH;
    }

    canvas.width = stripW;
    canvas.height = stripH;

    // Background
    ctx.fillStyle = selectedTheme.bg;
    ctx.fillRect(0, 0, stripW, stripH);

    // Pattern
    if (selectedTheme.id === 'shonen') {
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        for(let i=0; i<stripW; i+=4) for(let j=0; j<stripH; j+=4) if((i+j)%8 === 0) ctx.fillRect(i,j,2,2);
    }

    // Border
    ctx.strokeStyle = selectedTheme.primary;
    ctx.lineWidth = 8;
    ctx.strokeRect(5, 5, stripW - 10, stripH - 10);

    // Header
    ctx.fillStyle = selectedTheme.primary;
    ctx.fillRect(gap, gap, stripW - (gap*2), headerH - gap);
    ctx.fillStyle = selectedTheme.bg;
    ctx.font = "900 36px 'Bebas Neue', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PHOTO.LOG", stripW / 2, gap + (headerH/2) + 10);

    // Photos
    photos.forEach((photo, index) => {
      const img = new Image();
      img.src = photo;
      img.onload = () => {
        let xPos, yPos, pW, pH;

        if (selectedTheme.layout === 'grid') {
            const col = index % 2;
            const row = Math.floor(index / 2);
            pW = photoW;
            pH = photoH;
            xPos = gap + (col * (pW + gap));
            yPos = headerH + gap + (row * (pH + gap));
        } else {
            pW = photoW;
            pH = photoH;
            xPos = gap;
            yPos = headerH + gap + (index * (pH + gap));
        }

        ctx.lineWidth = 4;
        ctx.strokeStyle = selectedTheme.primary;
        ctx.strokeRect(xPos, yPos, pW, pH);
        
        const sW = 640;
        const sH = 480;
        const cropH = (sW * pH) / pW; 
        const sY = (sH - cropH) / 2;

        ctx.drawImage(img, 0, sY, sW, cropH, xPos, yPos, pW, pH);
        
        // Triangle Number
        ctx.fillStyle = selectedTheme.primary;
        ctx.beginPath();
        ctx.moveTo(xPos + pW, yPos + pH);
        ctx.lineTo(xPos + pW - 30, yPos + pH);
        ctx.lineTo(xPos + pW, yPos + pH - 30);
        ctx.fill();
        ctx.fillStyle = selectedTheme.bg;
        ctx.font = "bold 14px 'Changa One', sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(index + 1, xPos + pW - 5, yPos + pH - 5);
      };
    });

    // Footer
    const footerStartY = stripH - footerH;

    ctx.beginPath();
    ctx.moveTo(gap, footerStartY);
    ctx.lineTo(stripW - gap, footerStartY);
    ctx.strokeStyle = selectedTheme.primary;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = selectedTheme.primary;
    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText("DATE: " + new Date().toLocaleDateString('en-GB'), stripW / 2, footerStartY + 30);
    
    ctx.font = "900 32px 'Changa One', sans-serif";
    ctx.fillText("(dzikridev)", stripW / 2, footerStartY + 70);

    const barcodeY = footerStartY + 90;
    const barcodeH = 40;
    const barcodeW = stripW - (gap * 4);
    const startX = gap * 2;

    ctx.fillStyle = selectedTheme.primary;
    for(let k=0; k<barcodeW; k+=4) {
        if(Math.random() > 0.3) ctx.fillRect(startX + k, barcodeY, 2, barcodeH);
    }
    
    ctx.font = "10px 'Courier New', monospace";
    ctx.fillText("SCAN FOR MEMORIES", stripW / 2, barcodeY + barcodeH + 15);

    const qrSize = 50;
    const qrX = stripW - gap - qrSize - 10;
    const qrY = footerStartY + 85;
    
    ctx.fillStyle = selectedTheme.bg;
    ctx.fillRect(qrX, qrY, qrSize, qrSize);
    ctx.strokeStyle = selectedTheme.primary;
    ctx.lineWidth = 2;
    ctx.strokeRect(qrX, qrY, qrSize, qrSize);
    
    ctx.fillStyle = selectedTheme.primary;
    for(let qx=0; qx<qrSize; qx+=5) {
        for(let qy=0; qy<qrSize; qy+=5) {
            if(Math.random() > 0.5) ctx.fillRect(qrX + qx, qrY + qy, 4, 4);
        }
    }
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.download = `manga-strip-dzikridev-${Date.now()}.png`;
    link.href = resultCanvasRef.current.toDataURL('image/png');
    link.click();
  };

  const resetAll = () => {
    setPhotos([]);
    setStep('selection');
  };

  return (
    <div className="min-h-screen font-mono text-black transition-colors duration-300 relative overflow-hidden"
         style={{ 
             backgroundColor: selectedTheme.bg,
             backgroundImage: selectedTheme.pattern,
             backgroundSize: selectedTheme.patternSize,
             color: selectedTheme.primary
         }}>
      
      {/* Import Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Changa+One:ital@0;1&display=swap');
        .font-bebas-neue { font-family: 'Bebas Neue', sans-serif; }
        .font-changa-one { font-family: 'Changa One', cursive; }
        
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 15s linear infinite;
        }
      `}</style>
      
      {/* --- MENU STEP: SELECTION --- */}
      {step === 'selection' && (
        <div className="flex flex-col min-h-screen">
            
            {/* MARQUEE TOP */}
            <div className="bg-black text-white py-2 overflow-hidden border-b-4 border-black z-10">
                <div className="whitespace-nowrap animate-marquee font-bebas-neue text-2xl tracking-widest">
                    WELCOME TO MANGA BOOTH // SELECT YOUR FIGHTER // CHOOSE YOUR STYLE // CAPTURE THE MOMENT // BE THE PROTAGONIST //
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
                {/* Background Decoration */}
                <MangaEye className="absolute top-20 left-10 w-48 opacity-10 rotate-12" />
                <SpeedLines className="absolute inset-0 pointer-events-none opacity-20" />

                <h1 className="text-6xl font-black mb-12 text-center bg-white border-4 border-black px-8 py-4 shadow-[10px_10px_0px_0px_#000] rotate-[-2deg] font-changa-one z-10">
                    CHOOSE LAYOUT
                </h1>
                
                <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full max-w-6xl z-10">
                    {THEMES.map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => { setSelectedTheme(theme); setPhotos([]); setCountdown(null); setStep('booth'); }}
                            className="group relative bg-white border-4 border-black hover:bg-black hover:text-white transition-all transform hover:-translate-y-4 hover:rotate-1 shadow-[12px_12px_0px_0px_#000] p-4 flex flex-col items-center w-72 h-[500px]"
                        >
                            {/* PREVIEW MINIATUR YANG SAMA PERSIS DENGAN HASIL */}
                            <div className="w-full flex-1 border-2 border-current mb-4 bg-gray-100 p-2 overflow-hidden relative group-hover:bg-gray-800">
                                
                                {/* Header Strip Mini */}
                                <div className="w-full h-4 bg-black mb-2 opacity-80"></div>

                                {/* Layout Visualization */}
                                <div className={`w-full h-full grid gap-1 content-start 
                                    ${theme.layout === 'vertical' ? 'grid-cols-1' : 
                                      theme.layout === 'grid' ? 'grid-cols-2' : 
                                      'grid-cols-1'}`}> {/* Film also 1 col but diff ratio */}
                                    
                                    {[1,2,3,4].map(i => (
                                        <div key={i} className={`bg-gray-400 w-full border border-black group-hover:border-white
                                            ${theme.layout === 'vertical' ? 'aspect-[4/3]' : 
                                              theme.layout === 'grid' ? 'aspect-[4/3]' : 
                                              'aspect-[16/9]' // Wide
                                            }`}
                                        ></div>
                                    ))}
                                </div>

                                {/* Footer Strip Mini */}
                                <div className="absolute bottom-2 left-2 right-2 h-8 border-t-2 border-current flex flex-col items-center justify-end opacity-50">
                                    <div className="w-1/2 h-1 bg-current mb-1"></div>
                                    <div className="w-3/4 h-2 bg-current"></div>
                                </div>
                            </div>

                            <div className="w-full text-center">
                                <h3 className="text-2xl font-black font-bebas-neue tracking-wide">{theme.name}</h3>
                                <div className="flex justify-center gap-1 mt-1">
                                    <Star className="w-4 h-4 fill-current" />
                                    <Star className="w-4 h-4 fill-current" />
                                    <Star className="w-4 h-4 fill-current" />
                                </div>
                            </div>

                            {/* Corner Badge */}
                            <div className="absolute -top-3 -right-3 bg-red-600 text-white font-bold px-2 py-1 text-xs border-2 border-black rotate-12 group-hover:rotate-0 transition-transform">
                                {theme.id === 'shonen' ? 'POPULAR' : 'NEW'}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* MARQUEE BOTTOM */}
            <div className="bg-white text-black py-2 overflow-hidden border-t-4 border-black z-10">
                <div className="whitespace-nowrap animate-marquee font-bebas-neue text-xl tracking-widest" style={{ animationDirection: 'reverse' }}>
                    READY TO SNAP? // CLICK TO START // NO FILTER NO LIFE // MANGA STYLE // 
                </div>
            </div>
        </div>
      )}

      {/* --- MENU STEP: BOOTH (CAMERA) --- */}
      {step === 'booth' && (
        <div className="flex flex-col min-h-screen p-4">
            {/* Header Controls */}
            <div className="flex justify-between items-center mb-4 bg-white border-4 border-black p-3 shadow-[4px_4px_0px_0px_#000]">
                <button onClick={() => {setPhotos([]); setStep('selection');}} className="flex items-center gap-2 font-black hover:underline font-bebas-neue text-xl">
                    <ChevronLeft className="w-6 h-6" /> CHANGE LAYOUT
                </button>
                <div className="text-right flex items-center gap-4">
                    <span className="bg-black text-white px-2 py-1 font-bold text-xs uppercase tracking-widest mr-2">REC</span>
                    <span className="font-bebas-neue text-xl">{selectedTheme.name}</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-6 max-w-6xl mx-auto w-full items-center">
                {/* CAMERA FEED */}
                <div className="flex-1 w-full relative">
                    <div className="border-[8px] border-black bg-black shadow-[12px_12px_0px_0px_rgba(0,0,0,0.3)] relative group">
                        <video 
                            ref={videoRef}
                            autoPlay playsInline muted
                            className="w-full aspect-[4/3] object-cover transform -scale-x-100"
                            style={{ filter: selectedFilter.filter }}
                        />
                        
                        {/* Overlay Elements */}
                        <div className="absolute top-4 right-4 pointer-events-none">
                           <Zap className="w-12 h-12 text-yellow-400 fill-yellow-400 drop-shadow-[2px_2px_0px_#000] animate-pulse"/>
                        </div>
                        
                        {/* Shutter Flash */}
                        {isFlashing && <div className="absolute inset-0 bg-white z-50"></div>}
                        
                        {/* Countdown */}
                        {countdown && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-40 backdrop-blur-sm">
                                <span className="text-white text-[150px] font-black italic font-changa-one animate-bounce drop-shadow-[5px_5px_0px_#000]">
                                    {countdown}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Filter Selector */}
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        {FILTERS.map(f => (
                            <button
                                key={f.name}
                                onClick={() => setSelectedFilter(f)}
                                className={`px-4 py-2 border-4 border-black font-black text-sm uppercase transition-all transform hover:-translate-y-1 font-bebas-neue tracking-wider
                                    ${selectedFilter.name === f.name ? 'bg-black text-white shadow-[4px_4px_0px_0px_#666]' : 'bg-white shadow-[4px_4px_0px_0px_#000]'}`}
                            >
                                {f.name}
                            </button>
                        ))}
                    </div>

                    {/* Capture Button */}
                    <div className="mt-8 flex justify-center">
                        <button 
                            onClick={startPhotoSequence}
                            disabled={countdown || photos.length >= 4}
                            className="w-24 h-24 rounded-full bg-red-600 border-[6px] border-black hover:bg-red-500 active:scale-95 transition-all flex items-center justify-center shadow-[6px_6px_0px_0px_#000] disabled:opacity-50 disabled:grayscale"
                        >
                            <Camera className="w-10 h-10 text-white" />
                        </button>
                    </div>
                </div>

                {/* SIDEBAR PREVIEW */}
                <div className="w-full md:w-80 bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_#000] flex flex-col h-full max-h-[600px]">
                    <h3 className="font-black text-center border-b-4 border-black pb-2 mb-4 font-bebas-neue text-2xl">YOUR SNAPS</h3>
                    <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2">
                        {photos.map((src, i) => (
                            <div key={i} className="w-full aspect-[4/3] border-4 border-black relative shadow-[4px_4px_0px_0px_#ccc]">
                                <img src={src} className="w-full h-full object-cover grayscale" alt="snap" />
                                <div className="absolute -bottom-2 -right-2 bg-black text-white w-8 h-8 flex items-center justify-center font-black border-2 border-white font-changa-one">
                                    {i+1}
                                </div>
                            </div>
                        ))}
                        {[...Array(4 - photos.length)].map((_, i) => (
                            <div key={i} className="w-full aspect-[4/3] border-4 border-black border-dashed bg-gray-100 flex items-center justify-center opacity-50">
                                <span className="font-bebas-neue text-4xl text-gray-400">?</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- MENU STEP: RESULT --- */}
      {step === 'result' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 animate-in fade-in zoom-in duration-500">
            <h2 className="text-5xl font-black mb-8 font-changa-one bg-black text-white px-6 py-2 rotate-[-1deg] border-4 border-white shadow-[5px_5px_0px_0px_#000]">
                MISSION COMPLETE
            </h2>
            
            <div className="bg-white p-4 border-4 border-black shadow-[20px_20px_0px_0px_#000] mb-10 transform rotate-1">
                <canvas ref={resultCanvasRef} className="max-h-[65vh] w-auto border-2 border-black"></canvas>
            </div>

            <div className="flex gap-6">
                <button 
                    onClick={resetAll}
                    className="px-8 py-4 bg-white border-4 border-black font-black uppercase hover:bg-black hover:text-white transition-all flex items-center gap-3 font-bebas-neue text-xl shadow-[6px_6px_0px_0px_#000]"
                >
                    <RefreshCcw className="w-6 h-6"/> RETRY
                </button>
                <button 
                    onClick={downloadImage}
                    className="px-8 py-4 bg-yellow-400 border-4 border-black font-black uppercase hover:bg-yellow-300 transition-all flex items-center gap-3 font-bebas-neue text-xl shadow-[6px_6px_0px_0px_#000]"
                >
                    <Download className="w-6 h-6"/> SAVE STRIP
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default MangaPhotobooth;