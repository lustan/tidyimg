
import React from 'react';
import { ToolType, ImageFormat, AIAnalysisResult } from '../types';

interface ToolPanelProps {
  activeTool: ToolType;
  dimensions: { width: number; height: number };
  currentType: string;
  onResizeChange: (width: number, height: number) => void;
  onApplyCrop: () => void;
  onCancelCrop: () => void;
  compressionQuality: number;
  setCompressionQuality: (val: number) => void;
  targetFormat: ImageFormat;
  setTargetFormat: (val: ImageFormat) => void;
  aiLoading: boolean;
  aiResult: AIAnalysisResult | null;
  onAnalyze: () => void;
}

const ToolPanel: React.FC<ToolPanelProps> = ({
  activeTool,
  dimensions,
  currentType,
  onResizeChange,
  onApplyCrop,
  onCancelCrop,
  compressionQuality,
  setCompressionQuality,
  targetFormat,
  setTargetFormat,
  aiLoading,
  aiResult,
  onAnalyze
}) => {
  const [maintainAspect, setMaintainAspect] = React.useState(true);
  const [resizeInput, setResizeInput] = React.useState(dimensions);

  React.useEffect(() => {
    setResizeInput(dimensions);
  }, [dimensions]);

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const w = parseInt(e.target.value) || 0;
    let h = resizeInput.height;
    if (maintainAspect && dimensions.width > 0) {
      const ratio = dimensions.height / dimensions.width;
      h = Math.round(w * ratio);
    }
    setResizeInput({ width: w, height: h });
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const h = parseInt(e.target.value) || 0;
    let w = resizeInput.width;
    if (maintainAspect && dimensions.height > 0) {
      const ratio = dimensions.width / dimensions.height;
      w = Math.round(h * ratio);
    }
    setResizeInput({ width: w, height: h });
  };

  const applyResize = () => {
    onResizeChange(resizeInput.width, resizeInput.height);
  };

  switch (activeTool) {
    case ToolType.RESIZE:
      return (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Resize Image</h3>
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                id="aspect"
                checked={maintainAspect}
                onChange={(e) => setMaintainAspect(e.target.checked)}
                className="rounded text-indigo-500 focus:ring-indigo-500 bg-slate-700 border-slate-600"
              />
              <label htmlFor="aspect" className="text-sm text-slate-300 cursor-pointer">Lock Aspect Ratio</label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Width (px)</label>
                <input
                  type="number"
                  value={resizeInput.width}
                  onChange={handleWidthChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Height (px)</label>
                <input
                  type="number"
                  value={resizeInput.height}
                  onChange={handleHeightChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            
            <button
              onClick={applyResize}
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium transition-colors"
            >
              Apply Resize
            </button>
          </div>
        </div>
      );

    case ToolType.CROP:
      return (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-lg font-medium text-white mb-2">Crop Image</h3>
          <p className="text-sm text-slate-400 mb-4">
            Drag on the image to select an area.
          </p>
          <div className="flex space-x-3">
             <button
              onClick={onCancelCrop}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onApplyCrop}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium transition-colors"
            >
              Apply Crop
            </button>
          </div>
        </div>
      );

    case ToolType.COMPRESS:
      return (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-lg font-medium text-white mb-4">Compress Image</h3>
          
          <div>
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>Quality</span>
              <span>{Math.round(compressionQuality * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={compressionQuality}
              onChange={(e) => setCompressionQuality(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>Low Quality</span>
              <span>High Quality</span>
            </div>
          </div>
          <p className="text-xs text-amber-400/80 bg-amber-900/20 p-3 rounded border border-amber-900/50">
            Note: Compression will apply when you download the file.
          </p>
        </div>
      );

    case ToolType.CONVERT:
        const formats: ImageFormat[] = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-medium text-white mb-4">Convert Format</h3>
            
            <div className="space-y-3">
                {formats.map((fmt) => {
                    const isCurrent = fmt === currentType;
                    return (
                        <label 
                            key={fmt}
                            className={`
                                flex items-center justify-between p-3 rounded-lg border transition-all
                                ${isCurrent ? 'opacity-40 cursor-not-allowed border-slate-800 bg-slate-900' : 
                                  targetFormat === fmt ? 'border-indigo-500 bg-indigo-500/10 cursor-pointer' : 'border-slate-700 bg-slate-800 hover:bg-slate-750 cursor-pointer'}
                            `}
                        >
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    name="format"
                                    disabled={isCurrent}
                                    className="text-indigo-600 focus:ring-indigo-500 bg-slate-700 border-slate-600 hidden"
                                    checked={targetFormat === fmt}
                                    onChange={() => setTargetFormat(fmt)}
                                />
                                <span className={`text-sm font-medium uppercase ml-2 ${isCurrent ? 'text-slate-500' : 'text-white'}`}>
                                  {fmt.split('/')[1].replace('svg+xml', 'svg')}
                                </span>
                            </div>
                            {isCurrent && <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">Current</span>}
                            {targetFormat === fmt && !isCurrent && <div className="w-2 h-2 rounded-full bg-indigo-500"></div>}
                        </label>
                    );
                })}
            </div>
            <p className="text-xs text-slate-500 italic">
              Note: SVG output is experimental and currently renders as a raster container.
            </p>
          </div>
        );

    case ToolType.AI:
      return (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-lg font-medium text-white mb-2">AI Insights</h3>
          <p className="text-sm text-slate-400 mb-6">
            Generate descriptive alt text, tags, and SEO-friendly filename using Gemini AI.
          </p>

          {!aiResult ? (
            <button
              onClick={onAnalyze}
              disabled={aiLoading}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              {aiLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Generate Insights</span>
                </>
              )}
            </button>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Alt Text</label>
                <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg text-sm text-slate-200 italic leading-relaxed">
                  "{aiResult.altText}"
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Suggested Filename</label>
                <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg text-sm font-mono text-indigo-300">
                  {aiResult.suggestedFilename}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {aiResult.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs rounded-md">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={onAnalyze}
                disabled={aiLoading}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-indigo-400 uppercase tracking-widest transition-colors"
              >
                {aiLoading ? 'Refreshing...' : 'Refresh Analysis'}
              </button>
            </div>
          )}
        </div>
      );

    default:
      return (
        <div className="flex items-center justify-center h-full text-slate-500">
          <p>Select a tool to begin editing</p>
        </div>
      );
  }
};

export default ToolPanel;
