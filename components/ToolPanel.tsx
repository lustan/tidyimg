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
            <h3 className="text-lg font-medium text-white mb-4">修改图片尺寸</h3>
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                id="aspect"
                checked={maintainAspect}
                onChange={(e) => setMaintainAspect(e.target.checked)}
                className="rounded text-indigo-500 focus:ring-indigo-500 bg-slate-700 border-slate-600"
              />
              <label htmlFor="aspect" className="text-sm text-slate-300 cursor-pointer">锁定宽高比</label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">宽度 (px)</label>
                <input
                  type="number"
                  value={resizeInput.width}
                  onChange={handleWidthChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">高度 (px)</label>
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
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              应用尺寸修改
            </button>
          </div>
        </div>
      );

    case ToolType.CROP:
      return (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-lg font-medium text-white mb-2">裁剪图片</h3>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">
            在预览图上拖拽鼠标以选择您想要保留的区域。
          </p>
          <div className="flex space-x-3">
             <button
              onClick={onCancelCrop}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl font-semibold transition-all"
            >
              取消
            </button>
            <button
              onClick={onApplyCrop}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              应用裁剪
            </button>
          </div>
        </div>
      );

    case ToolType.COMPRESS:
      return (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-lg font-medium text-white mb-4">图片压缩</h3>
          
          <div>
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>压缩质量</span>
              <span className="text-indigo-400 font-mono">{Math.round(compressionQuality * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={compressionQuality}
              onChange={(e) => setCompressionQuality(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">
              <span>高压缩 (低质)</span>
              <span>低压缩 (高质)</span>
            </div>
          </div>
          <div className="text-xs text-amber-400/80 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 leading-relaxed">
            <strong>小贴士：</strong> 压缩设置将在最终“导出”时应用。
          </div>
        </div>
      );

    case ToolType.CONVERT:
        const formats: ImageFormat[] = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-medium text-white mb-4">转换图片格式</h3>
            
            <div className="space-y-2">
                {formats.map((fmt) => {
                    const isCurrent = fmt === currentType;
                    return (
                        <label 
                            key={fmt}
                            className={`
                                flex items-center justify-between p-4 rounded-xl border transition-all duration-300
                                ${targetFormat === fmt ? 'border-indigo-500 bg-indigo-500/10 cursor-pointer' : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800 cursor-pointer'}
                            `}
                        >
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    name="format"
                                    className="hidden"
                                    checked={targetFormat === fmt}
                                    onChange={() => setTargetFormat(fmt)}
                                />
                                <span className={`text-sm font-semibold uppercase tracking-wider ${targetFormat === fmt ? 'text-white' : 'text-slate-400'}`}>
                                  {fmt.split('/')[1].replace('svg+xml', 'svg')}
                                </span>
                            </div>
                            {isCurrent && <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded">当前格式</span>}
                            {targetFormat === fmt && !isCurrent && <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>}
                        </label>
                    );
                })}
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              * 转换为相同格式同样可以应用压缩。SVG 输出目前封装为光栅容器。
            </p>
          </div>
        );

    case ToolType.AI:
      return (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-lg font-medium text-white mb-2">AI 智能分析</h3>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            利用 Gemini AI 自动生成图片的描述性 Alt 文本、分类标签和 SEO 优化文件名。
          </p>

          {!aiResult ? (
            <button
              onClick={onAnalyze}
              disabled={aiLoading}
              className="w-full flex items-center justify-center space-x-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 text-white py-3.5 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-600/30 active:scale-95"
            >
              {aiLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>分析中...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>生成分析结果</span>
                </>
              )}
            </button>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">替代文本 (Alt Text)</label>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-sm text-slate-200 italic leading-relaxed shadow-inner">
                  "{aiResult.altText}"
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">建议文件名</label>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-sm font-mono text-indigo-300 shadow-inner">
                  {aiResult.suggestedFilename}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">智能标签</label>
                <div className="flex flex-wrap gap-2">
                  {aiResult.tags.map(tag => (
                    <span key={tag} className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs rounded-lg font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={onAnalyze}
                disabled={aiLoading}
                className="w-full py-3 text-[10px] font-bold text-slate-500 hover:text-indigo-400 uppercase tracking-[0.2em] transition-colors border-t border-slate-800 mt-4"
              >
                {aiLoading ? '正在刷新...' : '重新进行分析'}
              </button>
            </div>
          )}
        </div>
      );

    default:
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-600 px-6 text-center">
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
             </svg>
          </div>
          <p className="text-sm font-medium">在上方选择一个工具<br/>开始编辑您的图片</p>
        </div>
      );
  }
};

export default ToolPanel;