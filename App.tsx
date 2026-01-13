import React, { useState, useEffect, useRef } from 'react';
import DropZone from './components/DropZone';
import ToolPanel from './components/ToolPanel';
import Workspace from './components/Workspace';
import { ImageState, ToolType, ImageFormat, CropArea, AIAnalysisResult } from './types';
import { resizeImage, cropImage, compressAndConvertImage, formatBytes, loadImage } from './utils/imageProcessing';
import { analyzeImage } from './services/geminiService';

const App: React.FC = () => {
  const [imageState, setImageState] = useState<ImageState | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.NONE);
  const [processing, setProcessing] = useState(false);
  
  const uploadInputRef = useRef<HTMLInputElement>(null);
  
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [compressionQuality, setCompressionQuality] = useState(0.85);
  const [targetFormat, setTargetFormat] = useState<ImageFormat>('image/jpeg');
  
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);

  const [outputSize, setOutputSize] = useState<string>('');

  const handleFileSelect = async (file: File) => {
    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    
    setImageState({
      originalFile: file,
      originalUrl: url,
      currentUrl: url,
      history: [url],
      dimensions: { width: img.naturalWidth, height: img.naturalHeight },
      name: file.name,
      type: file.type,
      size: file.size,
    });
    
    // 设置默认格式为当前图片格式
    setTargetFormat(file.type as ImageFormat);
    setOutputSize(formatBytes(file.size));
    setActiveTool(ToolType.NONE);
    setAiResult(null);
  };

  const onGlobalUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleResize = async (width: number, height: number) => {
    if (!imageState?.currentUrl) return;
    setProcessing(true);
    try {
      const newUrl = await resizeImage(imageState.currentUrl, width, height, imageState.type);
      updateImageState(newUrl);
      setActiveTool(ToolType.NONE);
    } catch (e) {
      console.error(e);
      alert('调整尺寸失败');
    } finally {
      setProcessing(false);
    }
  };

  const handleCropApply = async () => {
    if (!imageState?.currentUrl || !cropArea) return;
    
    const imgEl = document.querySelector('img[alt="Workplace"]') as HTMLImageElement;
    if(!imgEl) return;

    const scaleX = imgEl.naturalWidth / imgEl.width;
    const scaleY = imgEl.naturalHeight / imgEl.height;

    const actualCrop = {
        x: cropArea.x * scaleX,
        y: cropArea.y * scaleY,
        width: cropArea.width * scaleX,
        height: cropArea.height * scaleY
    };
    
    if(actualCrop.width < 5 || actualCrop.height < 5) {
        alert("裁剪区域太小");
        return;
    }

    setProcessing(true);
    try {
      const newUrl = await cropImage(imageState.currentUrl, actualCrop, imageState.type);
      updateImageState(newUrl);
      setActiveTool(ToolType.NONE);
      setCropArea(null);
    } catch (e) {
      console.error(e);
      alert('裁剪失败');
    } finally {
      setProcessing(false);
    }
  };

  const updateImageState = async (newUrl: string) => {
    const img = await loadImage(newUrl);
    const head = 'data:' + imageState?.type + ';base64,';
    const size = Math.round((newUrl.length - head.length) * 3 / 4);

    setImageState(prev => prev ? ({
      ...prev,
      currentUrl: newUrl,
      history: [...prev.history, newUrl],
      dimensions: { width: img.naturalWidth, height: img.naturalHeight },
      size: size
    }) : null);
    setOutputSize(formatBytes(size));
  };

  const handleDownload = async () => {
    if (!imageState?.currentUrl) return;
    setProcessing(true);
    try {
        const { url, blob } = await compressAndConvertImage(
            imageState.currentUrl, 
            compressionQuality, 
            targetFormat
        );
        
        const a = document.createElement('a');
        a.href = url;
        
        let name = imageState.name.substring(0, imageState.name.lastIndexOf('.'));
        const ext = targetFormat.split('/')[1].replace('svg+xml', 'svg');
        a.download = `${name}_tidy.${ext}`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error(e);
        alert("导出处理失败");
    } finally {
        setProcessing(false);
    }
  };

  const handleReset = () => {
      if(!imageState?.originalUrl) return;
      const original = imageState.originalUrl;
      loadImage(original).then(img => {
          setImageState(prev => prev ? ({
            ...prev,
            currentUrl: original,
            history: [original],
            dimensions: { width: img.naturalWidth, height: img.naturalHeight },
            size: prev.originalFile?.size || 0
          }) : null);
          setCropArea(null);
          setAiResult(null);
          setOutputSize(formatBytes(imageState.originalFile?.size || 0));
      });
  };

  const handleNewUploadClick = () => {
    uploadInputRef.current?.click();
  };

  const handleAIAnalyze = async () => {
    if (!imageState?.currentUrl) return;
    setAiLoading(true);
    try {
      const response = await fetch(imageState.currentUrl);
      const blob = await response.blob();
      
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const result = await analyzeImage(base64Data, imageState.type);
      setAiResult(result);
    } catch (error) {
      console.error('AI analysis failed:', error);
      alert('AI 分析失败，请检查网络或 API 配置。');
    } finally {
      setAiLoading(false);
    }
  };

  const Logo = ({ size = 40, className = "" }: { size?: number, className?: string }) => (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="url(#tidy_grad_main)" />
        <path d="M12 14V26M12 14H22C23.6569 14 25 15.3431 25 17C25 18.6569 23.6569 20 22 20H12M28 26L22 20" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="28" cy="14" r="3" fill="white" />
        <defs>
          <linearGradient id="tidy_grad_main" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366F1"/>
            <stop offset="1" stopColor="#A855F7"/>
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 -z-10 animate-pulse"></div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden font-sans">
      <input 
        type="file" 
        ref={uploadInputRef} 
        className="hidden" 
        onChange={onGlobalUploadChange}
        accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif"
      />

      {!imageState ? (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#020617]">
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-dots"></div>
          <div className="absolute top-1/4 -left-20 w-[40rem] h-[40rem] bg-indigo-600/10 blur-[180px] rounded-full"></div>
          <div className="absolute bottom-1/4 -right-20 w-[40rem] h-[40rem] bg-purple-600/10 blur-[180px] rounded-full"></div>
          
          <div className="text-center mb-12 relative z-10">
              <div className="flex justify-center mb-6">
                  <Logo size={64} className="hover:scale-110 transition-transform duration-500 cursor-pointer" />
              </div>
              <h1 className="text-7xl md:text-8xl tracking-tighter mb-6 select-none flex justify-center items-baseline">
                  <span className="font-extrabold text-white">Tidy</span>
                  <span className="font-light text-slate-500">Img</span>
              </h1>
              <p className="text-slate-400 text-lg md:text-xl max-w-xl mx-auto leading-relaxed font-light tracking-tight px-4">
                  <span className="text-white font-medium border-b border-indigo-500/30">极致、私密、现代</span> 的图像工作站。<br/>
                  在浏览器本地安全地完成裁剪、缩放与压缩。
              </p>
          </div>
          
          <div className="w-full max-w-3xl transform hover:translate-y-[-4px] transition-transform duration-500">
            <DropZone onFileSelect={handleFileSelect} />
          </div>

          <div className="mt-16 flex items-center space-x-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
             <div className="flex items-center space-x-2"><div className="w-2 h-2 rounded-full bg-green-500"></div><span className="text-[10px] font-bold tracking-widest uppercase">本地加密</span></div>
             <div className="flex items-center space-x-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[10px] font-bold tracking-widest uppercase">AI 增强</span></div>
             <div className="flex items-center space-x-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div><span className="text-[10px] font-bold tracking-widest uppercase">无损处理</span></div>
          </div>
        </div>
      ) : (
        <>
          <header className="h-16 border-b border-white/5 bg-slate-950/60 backdrop-blur-2xl flex items-center justify-between px-8 z-30 shadow-2xl shadow-black/50">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setImageState(null)}>
                 <Logo size={32} />
                 <div className="flex items-baseline tracking-tighter">
                   <span className="font-extrabold text-xl text-white group-hover:text-indigo-400 transition-all duration-300">Tidy</span>
                   <span className="font-light text-xl text-slate-400 transition-all duration-300">Img</span>
                 </div>
              </div>
              <div className="h-4 w-px bg-slate-800 hidden lg:block"></div>
              <button 
                onClick={handleNewUploadClick}
                className="hidden sm:flex items-center space-x-2.5 text-slate-400 hover:text-white text-xs font-bold transition-all py-1.5 px-3 rounded-lg hover:bg-white/5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="uppercase tracking-widest">更换图片</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-6">
                <div className="hidden md:flex flex-col items-end">
                    <span className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-black">预估大小</span>
                    <span className="font-mono text-indigo-400 text-sm font-bold">{outputSize}</span>
                </div>
                <button 
                    onClick={handleReset}
                    className="text-slate-500 hover:text-white text-xs font-bold px-4 py-2 transition-all"
                >
                    重置
                </button>
                <button 
                    onClick={handleDownload}
                    disabled={processing}
                    className="bg-white text-black px-6 py-2 rounded-lg font-extrabold text-xs transition-all hover:bg-indigo-500 hover:text-white active:scale-95 disabled:opacity-50 tracking-widest uppercase shadow-xl shadow-indigo-500/20"
                >
                    {processing ? '正在导出...' : '导出图片'}
                </button>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
            <main className="flex-1 relative bg-[#020617] bg-dots overflow-hidden">
               <Workspace 
                  imageUrl={imageState.currentUrl || ''} 
                  activeTool={activeTool}
                  cropArea={cropArea}
                  setCropArea={setCropArea}
               />
               
               {/* Image Meta Badge */}
               <div className="absolute bottom-6 left-6 bg-slate-900/40 backdrop-blur-xl text-[10px] font-bold text-slate-300 px-4 py-2.5 rounded-xl border border-white/5 flex items-center space-x-4 shadow-2xl">
                   <div className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      <span className="tracking-widest">{imageState.dimensions.width} &times; {imageState.dimensions.height} PX</span>
                   </div>
                   <span className="text-white/10">|</span>
                   <span className="uppercase tracking-[0.2em] text-indigo-400">{imageState.type.split('/')[1].replace('svg+xml', 'svg')}</span>
               </div>
            </main>

            <aside className="w-80 bg-slate-950 border-l border-white/5 flex flex-col z-20">
                <div className="p-3 grid grid-cols-5 gap-1.5 border-b border-white/5 bg-slate-950/40 backdrop-blur-md">
                    {[
                        { id: ToolType.RESIZE, icon: 'M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4', label: '尺寸' },
                        { id: ToolType.CROP, isCrop: true, label: '裁剪' },
                        { id: ToolType.COMPRESS, icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', label: '压缩' },
                        { id: ToolType.CONVERT, icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', label: '格式' },
                        { id: ToolType.AI, icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'AI', isAI: true },
                    ].map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => {
                                if (tool.id === ToolType.CROP) setCropArea({x: 0, y: 0, width: 0, height: 0});
                                setActiveTool(tool.id as ToolType);
                            }}
                            className={`
                                h-14 w-full rounded-xl flex flex-col items-center justify-center transition-all relative group
                                ${activeTool === tool.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 
                                  tool.isAI ? 'text-indigo-400 hover:bg-indigo-500/10' : 'text-slate-500 hover:bg-white/5 hover:text-white'}
                            `}
                        >
                             {tool.isCrop ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 002.25 2.25z" />
                                </svg>
                             ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={tool.icon} />
                                </svg>
                             )}
                             <span className="text-[8px] mt-1.5 font-bold uppercase tracking-widest">{tool.label}</span>
                             {tool.isAI && (
                                 <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full border border-slate-950 animate-ping"></div>
                             )}
                        </button>
                    ))}
                </div>

                <div className="flex-1 p-8 overflow-y-auto">
                    <ToolPanel
                        activeTool={activeTool}
                        dimensions={imageState.dimensions}
                        currentType={imageState.type}
                        onResizeChange={handleResize}
                        onApplyCrop={handleCropApply}
                        onCancelCrop={() => { setActiveTool(ToolType.NONE); setCropArea(null); }}
                        compressionQuality={compressionQuality}
                        setCompressionQuality={setCompressionQuality}
                        targetFormat={targetFormat}
                        setTargetFormat={setTargetFormat}
                        aiLoading={aiLoading}
                        aiResult={aiResult}
                        onAnalyze={handleAIAnalyze}
                    />
                </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
};

export default App;