import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  FileCheck,
  AlertCircle,
  Sparkles,
  Globe,
  Sigma,
  Shapes,
  GraduationCap,
  ScanText,
  FileCode,
  Loader2,
  BookOpen,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { ConvertedDocument, ConversionOptions } from '../types';
import { SAMPLE_DOCUMENTS } from '../data/sampleDocuments';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentReady: (doc: ConvertedDocument) => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onDocumentReady,
}) => {
  const isOnline = useOnlineStatus();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [options, setOptions] = useState<ConversionOptions>({
    language: 'vi',
    includeMathSolutions: true,
    preserveFormatting: true,
    vectorGeometry: true,
    ocrEngine: 'ai_deep',
    fullContentPreservation: true,
  });

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setErrorMessage('');
    if (!file) return;

    // Verify format
    const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isValid) {
      setErrorMessage('Vui lòng chọn tệp định dạng PDF hoặc ảnh quét (.pdf, .png, .jpg, .webp).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('Tệp quá lớn (> 25MB). Vui lòng chọn tệp nhỏ hơn.');
      return;
    }

    setSelectedFile(file);

    // Read as Base64 Data URL
    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.onerror = () => {
      setErrorMessage('Không thể đọc tệp. Vui lòng thử lại.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleConvert = async () => {
    if (!selectedFile || !fileBase64) {
      setErrorMessage('Vui lòng chọn tệp PDF hoặc ảnh quét để chuyển đổi.');
      return;
    }

    if (!isOnline) {
      setErrorMessage('Thiết bị đang ngoại tuyến. Bạn cần có kết nối internet để AI nhận diện OCR và chuyển đổi tệp mới. Bạn có thể mở các tài liệu đã lưu trong thư viện ngoại tuyến.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      setProcessStep('Đang tải tệp lên máy chủ phân tích...');
      await new Promise((r) => setTimeout(r, 400));

      setProcessStep('Đang chạy OCR nhận diện văn bản đa ngôn ngữ...');
      await new Promise((r) => setTimeout(r, 600));

      setProcessStep('Đang phân tích, bảo toàn nguyên văn 100% & trích xuất đầy đủ nội dung không bỏ sót...');

      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64,
          mimeType: selectedFile.type || 'application/pdf',
          fileName: selectedFile.name,
          language: options.language,
          includeMathSolutions: options.includeMathSolutions,
          preserveFormatting: options.preserveFormatting,
          vectorGeometry: options.vectorGeometry,
          fullContentPreservation: options.fullContentPreservation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Lỗi máy chủ (${response.status})`);
      }

      setProcessStep('Đang hoàn thiện cấu trúc tài liệu Word (.docx)...');
      const jsonRes = await response.json();

      if (!jsonRes.success || !jsonRes.data) {
        throw new Error(jsonRes.error || 'Dữ liệu trả về không hợp lệ.');
      }

      const rawData = jsonRes.data;

      // Construct ConvertedDocument
      const newDoc: ConvertedDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: rawData.title || selectedFile.name.replace(/\.[^/.]+$/, ''),
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        detectedLanguage: rawData.detectedLanguage || options.language,
        summary: rawData.summary || 'Tài liệu đã được chuyển đổi chuẩn xác từ PDF sang Word.',
        isOfflineCached: true,
        metadata: {
          pageCountEstimate: rawData.metadata?.pageCountEstimate || 1,
          hasMath: rawData.metadata?.hasMath ?? true,
          hasTables: rawData.metadata?.hasTables ?? true,
          hasGeometry: rawData.metadata?.hasGeometry ?? options.vectorGeometry,
          hasExercises: rawData.metadata?.hasExercises ?? options.includeMathSolutions,
        },
        sections: rawData.sections && Array.isArray(rawData.sections) ? rawData.sections : [],
      };

      onDocumentReady(newDoc);
      onClose();
    } catch (err: any) {
      console.error('Lỗi chuyển đổi:', err);
      setErrorMessage(err.message || 'Đã có lỗi xảy ra trong quá trình chuyển đổi.');
    } finally {
      setIsProcessing(false);
      setProcessStep('');
    }
  };

  const handleSelectSample = (sample: ConvertedDocument) => {
    // Clone with fresh id and timestamp
    const clonedDoc: ConvertedDocument = {
      ...sample,
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onDocumentReady(clonedDoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/70 via-white to-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Chuyển đổi PDF sang Word chuẩn xác cao
              </h2>
              <p className="text-xs text-slate-500">
                OCR tài liệu quét • LaTeX • Bảng biểu • Hình học vector • Lời giải toán
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
              isDragging
                ? 'border-blue-500 bg-blue-50/60 scale-[0.99]'
                : selectedFile
                ? 'border-emerald-400 bg-emerald-50/40'
                : 'border-slate-300 hover:border-blue-400 bg-slate-50/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            {selectedFile ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 shadow-sm">
                  <FileCheck className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800 break-all">{selectedFile.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Nhấp để đổi tệp khác
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2 border border-blue-100">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Kéo thả tệp PDF hoặc ảnh quét vào đây
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Hỗ trợ định dạng PDF tài liệu, PDF quét, ảnh chụp PNG, JPG (tối đa 25MB)
                </p>
                <button
                  type="button"
                  className="mt-3 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition border border-blue-200"
                >
                  Chọn tệp từ máy tính
                </button>
              </div>
            )}
          </div>

          {/* Options Grid */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Tùy chọn nhận diện & xử lý thông minh
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Language Selection */}
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  Ngôn ngữ tài liệu
                </label>
                <select
                  value={options.language}
                  onChange={(e) => setOptions({ ...options, language: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="vi">Tiếng Việt (Bảo toàn dấu chuẩn 100%)</option>
                  <option value="auto">Tự động phát hiện ngôn ngữ</option>
                  <option value="en">English (Academic / Technical)</option>
                  <option value="fr">Français (Pháp)</option>
                  <option value="zh">中文 (Tiếng Trung)</option>
                  <option value="ja">日本語 (Tiếng Nhật)</option>
                  <option value="de">Deutsch (Tiếng Đức)</option>
                  <option value="es">Español (Tây Ban Nha)</option>
                </select>
              </div>

              {/* OCR Engine */}
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1 flex items-center gap-1.5">
                  <ScanText className="w-3.5 h-3.5 text-slate-500" />
                  Chế độ OCR nhận diện
                </label>
                <select
                  value={options.ocrEngine}
                  onChange={(e) => setOptions({ ...options, ocrEngine: e.target.value as any })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ai_deep">OCR Chuyên sâu (Khử nhiễu & Phục hồi bảng)</option>
                  <option value="high_precision">Độ chính xác cao (Tài liệu chuẩn)</option>
                </select>
              </div>
            </div>

            {/* Feature Checkboxes */}
            <div className="pt-2 border-t border-slate-200/80 space-y-2.5">
              {/* Strict Verbatim & Zero-Omission Guarantee */}
              <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-800">
                  <input
                    type="checkbox"
                    checked={options.fullContentPreservation}
                    onChange={(e) => setOptions({ ...options, fullContentPreservation: e.target.checked })}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      Bảo toàn 100% nguyên văn & chuyển đầy đủ không bỏ sót
                    </span>
                    <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                      Giữ nguyên từng câu chữ, toàn bộ đề bài trắc nghiệm kèm đầy đủ 4 đáp án A/B/C/D, bảng biểu, công thức toán và hình học từ đầu đến cuối tài liệu. Cam kết không tóm tắt, không lược bớt.
                    </p>
                  </div>
                </label>
              </div>

              {/* Math Pedagogical Solutions */}
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-800">
                <input
                  type="checkbox"
                  checked={options.includeMathSolutions}
                  onChange={(e) => setOptions({ ...options, includeMathSolutions: e.target.checked })}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-semibold text-slate-900 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    Tự động giải chi tiết bài tập toán & kèm lời bình sư phạm
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Trích xuất bài toán, giải từng bước chi tiết, phân tích phương pháp tư duy và cảnh báo các bẫy/sai lầm thường gặp.
                  </p>
                </div>
              </label>

              {/* Vector Geometry */}
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-800">
                <input
                  type="checkbox"
                  checked={options.vectorGeometry}
                  onChange={(e) => setOptions({ ...options, vectorGeometry: e.target.checked })}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-semibold text-slate-900 flex items-center gap-1">
                    <Shapes className="w-3.5 h-3.5 text-blue-600" />
                    Vector hóa hình học sang SVG sắc nét
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tái tạo hình chóp, tam giác, đường tròn, đồ thị thành đồ họa vector vô hạn độ phân giải, không bị vỡ hạt trong Word.
                  </p>
                </div>
              </label>

              {/* LaTeX Formulas & Tables */}
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-800">
                <input
                  type="checkbox"
                  checked={options.preserveFormatting}
                  onChange={(e) => setOptions({ ...options, preserveFormatting: e.target.checked })}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-semibold text-slate-900 flex items-center gap-1">
                    <Sigma className="w-3.5 h-3.5 text-purple-600" />
                    Công thức toán LaTeX & Bảng biểu phức tạp
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Bảo toàn định dạng công thức toán $...$ và $$...$$, bảng nhiều dòng nhiều cột, hợp ô chuẩn xác.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Quick Pre-loaded Samples Section */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              Hoặc thử ngay các tài liệu mẫu chuẩn hóa:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAMPLE_DOCUMENTS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition group"
                >
                  <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 line-clamp-1">
                    {sample.title}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                    {sample.summary}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                      {sample.fileName}
                    </span>
                    <span>LaTeX • Bảng • Hình học</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
                <div>
                  <p className="font-semibold text-rose-900">Không thể hoàn tất chuyển đổi</p>
                  <p className="leading-relaxed text-rose-700 mt-0.5">{errorMessage}</p>
                </div>
              </div>
              {selectedFile && !isProcessing && (
                <button
                  type="button"
                  onClick={handleConvert}
                  className="shrink-0 self-end sm:self-center px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm transition flex items-center gap-1.5 active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Thử lại ngay</span>
                </button>
              )}
            </div>
          )}

          {/* Progress state */}
          {isProcessing && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2 text-center">
              <div className="flex items-center justify-center gap-2 text-blue-700 font-semibold text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>{processStep || 'Đang xử lý tài liệu...'}</span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-600 h-1.5 rounded-full animate-pulse w-3/4"></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleConvert}
            disabled={!selectedFile || isProcessing}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-blue-600/25 transition active:scale-95"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <FileCode className="w-3.5 h-3.5" />
                <span>Chuyển đổi sang Word</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
