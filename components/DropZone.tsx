import React, { useRef, useState } from 'react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
}

const DropZone: React.FC<DropZoneProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndPassFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndPassFile(e.target.files[0]);
    }
  };

  const validateAndPassFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (validTypes.includes(file.type)) {
      onFileSelect(file);
    } else {
      alert('仅支持 JPEG, PNG, WEBP, SVG, GIF 图片');
    }
  };

  const triggerInput = () => {
    inputRef.current?.click();
  };

  return (
    <div 
      className={`
        w-full h-80 border rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-700 cursor-pointer group relative overflow-hidden
        ${isDragging ? 'border-indigo-400 bg-indigo-500/10 scale-[1.02] shadow-[0_0_80px_rgba(99,102,241,0.2)]' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 shadow-2xl'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={triggerInput}
    >
      <input 
        type="file" 
        ref={inputRef} 
        onChange={handleInputChange} 
        className="hidden" 
        accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif"
      />
      
      {/* Dynamic light effect */}
      <div className="absolute -inset-[100%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(99,102,241,0.05)_180deg,transparent_360deg)] animate-[spin_10s_linear_infinite] pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-8 p-6 rounded-3xl bg-white/5 border border-white/10 group-hover:scale-110 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/50 transition-all duration-500 shadow-xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight group-hover:text-glow">点此上传 或 拖拽图片</h3>
        <p className="text-slate-500 text-sm font-medium tracking-wide uppercase">支持常用高清图像格式</p>
      </div>
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-white/5 text-[9px] font-black tracking-[0.3em] text-slate-500 uppercase">
        本地加密处理 · 隐私无忧
      </div>
    </div>
  );
};

export default DropZone;