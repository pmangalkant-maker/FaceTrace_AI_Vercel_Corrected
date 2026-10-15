import React, { useRef, useEffect, useState } from 'react';
import type { ImageAnalysisResult } from '../../types';
import { ShieldAlert, CheckCircle2, AlertCircle, Scan, Eye, Activity } from 'lucide-react';

interface ImageAnalysisViewerProps {
  imageUrl: string;
  analysis: ImageAnalysisResult;
}

export const ImageAnalysisViewer: React.FC<ImageAnalysisViewerProps> = ({
  imageUrl,
  analysis,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showOverlays, setShowOverlays] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.src = imageUrl;

    img.onload = () => {
      canvas.width = img.naturalWidth || 800;
      canvas.height = img.naturalHeight || 800;
      ctx.drawImage(img, 0, 0);

      if (showOverlays && analysis.faces && analysis.faces.length > 0) {
        analysis.faces.forEach((face, idx) => {
          // Bounding Box (Haar cascade localized face)
          ctx.strokeStyle = '#0284c7'; // crisp sky-600
          ctx.lineWidth = Math.max(2, Math.round(canvas.width / 350));
          ctx.strokeRect(face.x, face.y, face.width, face.height);

          // Corner reticles for high-precision technical feel
          const cornerLen = Math.min(24, face.width * 0.15);
          ctx.strokeStyle = '#0369a1';
          ctx.lineWidth = ctx.lineWidth * 1.5;

          // Top Left
          ctx.beginPath();
          ctx.moveTo(face.x, face.y + cornerLen);
          ctx.lineTo(face.x, face.y);
          ctx.lineTo(face.x + cornerLen, face.y);
          ctx.stroke();

          // Top Right
          ctx.beginPath();
          ctx.moveTo(face.x + face.width - cornerLen, face.y);
          ctx.lineTo(face.x + face.width, face.y);
          ctx.lineTo(face.x + face.width, face.y + cornerLen);
          ctx.stroke();

          // Bottom Left
          ctx.beginPath();
          ctx.moveTo(face.x, face.y + face.height - cornerLen);
          ctx.lineTo(face.x, face.y + face.height);
          ctx.lineTo(face.x + cornerLen, face.y + face.height);
          ctx.stroke();

          // Bottom Right
          ctx.beginPath();
          ctx.moveTo(face.x + face.width - cornerLen, face.y + face.height);
          ctx.lineTo(face.x + face.width, face.y + face.height);
          ctx.lineTo(face.x + face.width, face.y + face.height - cornerLen);
          ctx.stroke();

          // Text label above bounding box
          ctx.fillStyle = '#0f172a';
          const fontSize = Math.max(12, Math.round(canvas.width / 45));
          ctx.font = `600 ${fontSize}px 'JetBrains Mono', monospace`;
          const label = `FACE #${idx + 1} (${face.width}x${face.height}px)`;
          const textWidth = ctx.measureText(label).width;

          ctx.fillRect(face.x, Math.max(0, face.y - fontSize - 6), textWidth + 8, fontSize + 6);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(label, face.x + 4, Math.max(fontSize, face.y - 4));

          // Landmarks (eyes & mouth)
          if (showLandmarks && face.landmarks) {
            ctx.fillStyle = '#10b981';
            const radius = Math.max(3, Math.round(canvas.width / 180));

            // Left eye
            ctx.beginPath();
            ctx.arc(face.landmarks.left_eye.x, face.landmarks.left_eye.y, radius, 0, Math.PI * 2);
            ctx.fill();

            // Right eye
            ctx.beginPath();
            ctx.arc(face.landmarks.right_eye.x, face.landmarks.right_eye.y, radius, 0, Math.PI * 2);
            ctx.fill();

            // Mouth
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(face.landmarks.mouth.x, face.landmarks.mouth.y, radius * 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      setImageLoaded(true);
    };

    img.onerror = () => {
      setImageLoaded(false);
    };
  }, [imageUrl, analysis, showOverlays, showLandmarks]);

  const { quality } = analysis;

  return (
    <div className="space-y-6">
      {/* Canvas Viewport & Controls */}
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 mb-3 border-b border-slate-800 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Scan className="w-4 h-4 text-sky-400" />
            <span className="font-semibold text-slate-100">Technical Feature Localization</span>
            <span aria-hidden="true">&middot;</span>
            <span className="font-mono text-slate-400">
              {analysis.faces.length} candidate {analysis.faces.length === 1 ? 'region' : 'regions'} detected
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showOverlays}
                onChange={(e) => setShowOverlays(e.target.checked)}
                className="rounded border-slate-700 text-sky-600 focus:ring-0"
              />
              <span>Bounding Box</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showLandmarks}
                onChange={(e) => setShowLandmarks(e.target.checked)}
                className="rounded border-slate-700 text-emerald-600 focus:ring-0"
              />
              <span>Facial Landmarks</span>
            </label>
          </div>
        </div>

        {/* Viewport Canvas */}
        <div className="relative flex items-center justify-center bg-black/60 rounded overflow-hidden min-h-[360px] max-h-[580px]">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-[560px] object-contain"
          />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
              Rendering image metrics and Haar cascade bounds...
            </div>
          )}
        </div>

        {/* Canvas legend */}
        <div className="flex items-center gap-4 mt-3 pt-2 text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 border border-sky-400 inline-block"></span>
            <span>Haar Cascade Face Boundary</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>Ocular Landmarks</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
            <span>Oral Landmark</span>
          </span>
        </div>
      </div>

      {/* Forensic Quality Assessment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1: Resolution */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">
            Resolution
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
            {quality.resolution.width} &times; {quality.resolution.height}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-600 mt-2">
            {quality.resolution.is_sufficient ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            )}
            <span>
              {quality.resolution.is_sufficient ? 'Exceeds 300px intake standard' : 'Below recommended 300px'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            {quality.resolution.megapixels} Megapixels
          </div>
        </div>

        {/* Metric 2: Sharpness (Laplace Variance) */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">
            Sharpness & Blur Index
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
            {quality.sharpness.laplacian_variance}
            <span className="text-xs text-slate-500 font-normal ml-1">&nabla;&sup2;</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-600 mt-2">
            <Activity className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="capitalize">{quality.sharpness.assessment.replace(/_/g, ' ')}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Score: <strong className="font-semibold text-slate-700 tabular-nums">{quality.sharpness.score}/100</strong>
          </div>
        </div>

        {/* Metric 3: Luminance & Brightness */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">
            Luminance & Exposure
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
            {quality.brightness.mean_luminance}
            <span className="text-xs text-slate-500 font-normal ml-1">/ 255</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-600 mt-2">
            <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="capitalize">{quality.brightness.assessment} exposure</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Score: <strong className="font-semibold text-slate-700 tabular-nums">{quality.brightness.score}/100</strong>
          </div>
        </div>

        {/* Metric 4: Contrast & Artifacts */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">
            Contrast & Compression
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
            &plusmn;{quality.contrast.standard_deviation}
            <span className="text-xs text-slate-500 font-normal ml-1">&sigma;</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-600 mt-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="capitalize">{quality.compression.artifact_estimate} compression artifacting</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Score: <strong className="font-semibold text-slate-700 tabular-nums">{quality.contrast.score}/100</strong>
          </div>
        </div>
      </div>

      {/* Intake Standards Compliance Card */}
      <div className={`p-4 rounded-lg border ${quality.intake_compliance.meets_standard ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-amber-50/70 border-amber-200 text-amber-900'}`}>
        <div className="flex items-start gap-3">
          {quality.intake_compliance.meets_standard ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 text-xs">
            <h4 className="font-semibold text-sm">
              {quality.intake_compliance.meets_standard
                ? 'Passes Law Enforcement Reference Quality Intake Criteria'
                : 'Intake Warning: Reference Image Has Quality Limitations'}
            </h4>
            {quality.intake_compliance.issues.length > 0 && (
              <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                {quality.intake_compliance.issues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            )}
            {quality.intake_compliance.recommendations.length > 0 && (
              <p className="text-slate-600 pt-1">
                Recommendation: {quality.intake_compliance.recommendations.join(' ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mandatory Non-Biometric Legal Disclaimer */}
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 text-xs text-slate-600 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-slate-900 block mb-1">
            Non-Biometric & Privacy Disclosure
          </strong>
          <p className="leading-relaxed">
            {analysis.technical_disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
};
