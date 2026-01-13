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
      alert('Please upload a valid image file (JPEG, PNG, WEBP, SVG, GIF)');
    }
  };

  const triggerInput = (e: React.MouseEvent) => {
    // Prevent double triggering if clicked directly on input (though it's hidden)
    if (e.target !== inputRef.current) {
        inputRef.current?.click();
    }
  };

  return (
    <div 
      className={`
        w-full max-w-2xl mx-auto h-96 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer group relative overflow-hidden
        ${isDragging ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]' : 'border-slate-700 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800/60 shadow-xl shadow-black/20'}
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
      
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="p-8 bg-slate-700/50 group-hover:bg-indigo-500/20 rounded-full mb-6 transition-colors border border-slate-600 group-hover:border-indigo-400/50 group-hover:scale-110 duration-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-400 group-hover:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      
      <div className="text-center relative z-10">
        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-indigo-200 transition-colors">Select or drop image</h3>
        <p className="text-slate-400 font-medium">Supports JPG, PNG, WEBP, SVG</p>
      </div>
      
      <div className="mt-8 px-4 py-1.5 bg-slate-900/50 rounded-full border border-slate-700/50 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
         Private & Local
      </div>
    </div>
  );
};

export default DropZone;