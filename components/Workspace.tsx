import React, { useRef, useEffect, useState } from 'react';
import { ToolType, CropArea } from '../types';

interface WorkspaceProps {
  imageUrl: string;
  activeTool: ToolType;
  cropArea: CropArea | null;
  setCropArea: (area: CropArea) => void;
}

const Workspace: React.FC<WorkspaceProps> = ({ imageUrl, activeTool, cropArea, setCropArea }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  // Reset crop when tool changes away from CROP
  useEffect(() => {
    if (activeTool !== ToolType.CROP) {
      // We don't nullify cropArea here to allow persistence if they switch back, 
      // but in this simple version, we can just leave it.
    }
  }, [activeTool]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== ToolType.CROP || !imgRef.current) return;
    
    const rect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStartPos({ x, y });
    setCropArea({ x, y, width: 0, height: 0 });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || activeTool !== ToolType.CROP || !imgRef.current) return;
    
    const rect = imgRef.current.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const currentY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    
    const width = Math.abs(currentX - startPos.x);
    const height = Math.abs(currentY - startPos.y);
    const x = Math.min(currentX, startPos.x);
    const y = Math.min(currentY, startPos.y);
    
    setCropArea({ x, y, width, height });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Convert screen coordinates to actual image coordinates for the logic layer
  const getNaturalDimensions = () => {
    if(!imgRef.current) return { x: 0, y: 0, w: 0, h: 0 };
    const rect = imgRef.current.getBoundingClientRect();
    const scaleX = imgRef.current.naturalWidth / rect.width;
    const scaleY = imgRef.current.naturalHeight / rect.height;
    return { scaleX, scaleY };
  };

  // Use an effect to communicate 'actual' crop coordinates upstream if needed, 
  // currently we just visualize in pixels relative to display.
  // The logic in App.tsx will need to convert display-crop to natural-crop before processing.

  return (
    <div 
      className="relative flex items-center justify-center w-full h-full p-8 overflow-hidden select-none bg-dots"
      ref={containerRef}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
        {/* Background Pattern for Transparency */}
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

      <div className="relative z-10 shadow-2xl">
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Workplace"
          className="max-w-full max-h-[70vh] object-contain border border-slate-700 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIAAR7JBMw0UYKCdUcMwhkJ6NHIyCQA5WSfvklCdcAAAAABJRU5ErkJggg==')] bg-repeat"
          draggable={false}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        />
        
        {/* Crop Overlay */}
        {activeTool === ToolType.CROP && cropArea && (
            <>
            {/* Darken areas outside crop */}
             <div className="absolute top-0 left-0 right-0 h-full bg-black/50 pointer-events-none" style={{
                 clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${cropArea.x}px ${cropArea.y}px, ${cropArea.x}px ${cropArea.y + cropArea.height}px, ${cropArea.x + cropArea.width}px ${cropArea.y + cropArea.height}px, ${cropArea.x + cropArea.width}px ${cropArea.y}px, ${cropArea.x}px ${cropArea.y}px)`
             }}></div>
             
             {/* The Selection Box */}
              <div
                className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none"
                style={{
                  left: cropArea.x,
                  top: cropArea.y,
                  width: cropArea.width,
                  height: cropArea.height,
                }}
              >
                  {/* Grid of thirds */}
                  <div className="absolute top-0 left-1/3 bottom-0 w-px bg-white/30"></div>
                  <div className="absolute top-0 right-1/3 bottom-0 w-px bg-white/30"></div>
                  <div className="absolute left-0 top-1/3 right-0 h-px bg-white/30"></div>
                  <div className="absolute left-0 bottom-1/3 right-0 h-px bg-white/30"></div>
              </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Workspace;