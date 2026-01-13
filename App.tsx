import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
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
  
  // 用于顶部“上传新图片”的隐藏 input 引用
  const uploadInputRef = useRef<HTMLInputElement>(null);
  
  // Tool States
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [compressionQuality, setCompressionQuality] = useState(0.8);
  const [targetFormat, setTargetFormat] = useState<ImageFormat>('image/jpeg');
  
  // AI States
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
    
    const defaultFormat: ImageFormat = file.type === 'image/jpeg' ? 'image/png' : 'image/jpeg';
    setTargetFormat(defaultFormat);
    setOutputSize(formatBytes(file.size));
    setActiveTool(ToolType.NONE);
    setAiResult(null);
  };

  const onGlobalUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
      // 重置 input 以允许再次选择相同文件
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
      alert('Error resizing image');
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
    
    if(actualCrop.width < 10 || actualCrop.height < 10) {
        alert("Crop selection too small");
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
      alert('Error cropping image');
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
        a.download = `${name}_vistia.${ext}`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error(e);
        alert("Failed to process download");
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

  // Logic to handle Gemini AI analysis
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

  const Logo = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="16" r="10" fill="url(#paint0_linear)" fillOpacity="0.8"/>
      <circle cx="20" cy="16" r="10" fill="url(#paint1_linear)" fillOpacity="0.8"/>
      <defs>
        <linearGradient id="paint0_linear" x1="2" y1="16" x2="22" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1"/>
          <stop offset="1" stopColor="#A855F7"/>
        </linearGradient>
        <linearGradient id="paint1_linear" x1="10" y1="16" x2="30" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EC4899"/>
          <stop offset="1" stopColor="#EAB308"/>
        </linearGradient>
      </defs>
    </svg>
  );

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white overflow-hidden font-sans">
      {/* 隐藏的全局上传 Input */}
      <input 
        type="file" 
        ref={uploadInputRef} 
        className="hidden" 
        onChange={onGlobalUploadChange}
        accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif"
      />

      {!imageState ? (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 blur-[120px] rounded-full"></div>
          
          <div className="text-center mb-12 relative z-10">
              <div className="flex justify-center mb-6 scale-125">
                  <Logo />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400 mb-6 tracking-tight">
                  Vistia
              </h1>
              <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed px-4">
                  <span className="text-white font-medium">免费、私密的在线图片编辑工具</span><br/>
                  轻松裁剪、调整尺寸、压缩及转换格式。所有操作均在本地运行，保护您的隐私安全。
              </p>
          </div>
          <DropZone onFileSelect={handleFileSelect} />
        </div>
      ) : (
        <>
          <header className="h-16 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-6 z-20">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setImageState(null)}>
                 <Logo />
                 <span className="font-bold text-xl tracking-tight text-white group-hover:text-indigo-400 transition-colors">Vistia</span>
              </div>
              <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>
              <button 
                onClick={handleNewUploadClick}
                className="hidden sm:flex items-center space-x-2 text-slate-400 hover:text-white text-sm font-medium transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>上传新图片</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
                <div className="hidden md:flex flex-col items-end mr-4">
                    <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">预计大小</span>
                    <span className="font-mono text-indigo-400 text-sm">{outputSize}</span>
                </div>
                <button 
                    onClick={handleReset}
                    className="text-slate-400 hover:text-white text-sm font-medium px-3 py-2 transition-colors"
                >
                    重置
                </button>
                <button 
                    onClick={handleDownload}
                    disabled={processing}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                >
                    {processing ? '处理中...' : '导出'}
                </button>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
            <main className="flex-1 relative bg-slate-900">
               <Workspace 
                  imageUrl={imageState.currentUrl || ''} 
                  activeTool={activeTool}
                  cropArea={cropArea}
                  setCropArea={setCropArea}
               />
               <div className="absolute bottom-4 left-4 bg-slate-950/90 backdrop-blur-sm text-[10px] font-bold text-slate-400 px-4 py-2 rounded-full border border-slate-800 flex items-center space-x-2">
                   <span className="text-white">{imageState.dimensions.width} &times; {imageState.dimensions.height}</span>
                   <span className="text-slate-600">|</span>
                   <span className="uppercase">{imageState.type.split('/')[1].replace('svg+xml', 'svg')}</span>
               </div>
               
               {/* Mobile-only Upload New Button */}
               <button 
                onClick={handleNewUploadClick}
                className="sm:hidden absolute top-4 right-4 bg-slate-950/80 p-2 rounded-full border border-slate-700 text-slate-400 hover:text-white"
               >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
               </button>
            </main>

            <aside className="w-80 bg-slate-950 border-l border-slate-800 flex flex-col z-20">
                <div className="p-3 grid grid-cols-5 gap-1.5 border-b border-slate-800">
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
                                h-12 w-full rounded-xl flex flex-col items-center justify-center transition-all relative group
                                ${activeTool === tool.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 
                                  tool.isAI ? 'text-indigo-400 hover:bg-slate-800/50' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}
                            `}
                        >
                             {tool.isCrop ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 002.25 2.25z" />
                                </svg>
                             ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tool.icon} />
                                </svg>
                             )}
                             <span className="text-[9px] mt-1 font-bold uppercase tracking-tighter opacity-70">{tool.label}</span>
                             {tool.isAI && (
                                 <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-indigo-500 rounded-full border border-slate-950"></div>
                             )}
                        </button>
                    ))}
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
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