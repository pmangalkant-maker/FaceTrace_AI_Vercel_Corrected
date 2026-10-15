import React, { useState } from 'react';
import type { ImageAnalysisResult } from '../types';
import { api } from '../services/api';
import { ImageAnalysisViewer } from '../components/analysis/ImageAnalysisViewer';
import {
  Camera,
  Upload,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  FileCheck2,
  RefreshCw,
} from 'lucide-react';

interface ImageAnalysisPageProps {
  onNavigate: (tab: string, caseId?: string) => void;
}

export const ImageAnalysisPage: React.FC<ImageAnalysisPageProps> = ({ onNavigate }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>(
    '/src/assets/images/demo_person_alex_1792074144997.jpg'
  );
  const [analysis, setAnalysis] = useState<ImageAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Automatically analyze the initial image on mount
  React.useEffect(() => {
    analyzeUrl(imageUrl);
  }, []);

  const analyzeUrl = async (url: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.analyzeImageUrl(url);
      setImageUrl(url);
      setAnalysis(res.analysis);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to analyze reference photo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.uploadAndAnalyzeImage(file);
      setImageUrl(res.url);
      setAnalysis(res.analysis);
    } catch (err: any) {
      setErrorMessage(err.message || 'Image analysis failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Photographic Quality & Haar-Cascade Inspector
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Technical inspection utility verifying reference image suitability for community bulletins. Evaluates Laplacian focal sharpness (&nabla;&sup2; variance), luminance distributions, and detects candidate facial bounds without automated 1:N biometric identification.
        </p>
      </div>

      {/* Control bar: Upload or load demo sample */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label
              htmlFor="photo-inspector-input"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold cursor-pointer flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Custom Photo</span>
            </label>
            <input
              id="photo-inspector-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            {selectedFile && (
              <span className="text-xs font-mono text-slate-600 truncate max-w-[200px]">
                {selectedFile.name}
              </span>
            )}
          </div>

          {/* Quick Demo Previews */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Test with Demo Portraits:</span>
            <button
              onClick={() => analyzeUrl('/src/assets/images/demo_person_alex_1792074144997.jpg')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium transition-colors"
            >
              Demo Subject Alex
            </button>
            <button
              onClick={() => analyzeUrl('/src/assets/images/demo_person_maya_1792074144416.jpg')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium transition-colors"
            >
              Demo Subject Maya
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="p-12 bg-white border border-slate-200 rounded-lg text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-600 font-medium">
            Computing discrete Laplacian variance kernel and Haar cascade bounds...
          </p>
        </div>
      )}

      {/* Canvas and Diagnostic Metrics */}
      {!isLoading && analysis && (
        <ImageAnalysisViewer imageUrl={imageUrl} analysis={analysis} />
      )}
    </div>
  );
};
