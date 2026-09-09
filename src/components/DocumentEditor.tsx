import React, { useState } from 'react';
import {
  FileText,
  Download,
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  Edit3,
  Copy,
  Check,
  Sigma,
  Table as TableIcon,
  Shapes,
  GraduationCap,
  Sparkles,
  Heading1,
  Heading2,
  AlignLeft,
  Quote,
  Maximize2,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  Lightbulb,
  Sliders,
  CheckCircle2,
  X,
  ShieldCheck,
} from 'lucide-react';
import { ConvertedDocument, DocumentSection, SectionType, WordExportSettings } from '../types';
import { MathRenderer } from '../utils/mathRenderer';
import { exportToWordDocx, downloadDocxBlob } from '../utils/docxExport';

interface DocumentEditorProps {
  document: ConvertedDocument;
  onUpdateDocument: (updated: ConvertedDocument) => void;
  onOpenMathSolver: () => void;
  onSaveToOffline: (doc: ConvertedDocument) => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  document,
  onUpdateDocument,
  onOpenMathSolver,
  onSaveToOffline,
}) => {
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  const [isExporting, setIsExporting] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeEditingSectionId, setActiveEditingSectionId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Cấu hình xuất file Word với công thức $...$
  const [exportSettings, setExportSettings] = useState<WordExportSettings>({
    mathDelimiter: 'single_dollar', // Mặc định '$...$' theo yêu cầu
    mathFont: 'Cambria Math',
    includeGeometryImages: true,
    autoWrapLatexKeywords: true,
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // LaTeX helper palette
  const latexShortcuts = [
    { label: 'Phân số \\frac{a}{b}', code: '\\frac{a}{b}' },
    { label: 'Tích phân \\int_{a}^{b}', code: '\\int_{a}^{b} f(x)dx' },
    { label: 'Tổng \\sum_{i=1}^{n}', code: '\\sum_{i=1}^{n} x_i' },
    { label: 'Căn \\sqrt{x}', code: '\\sqrt{x}' },
    { label: 'Giới hạn \\lim', code: '\\lim_{x \\to 0} \\frac{\\sin x}{x}' },
    { label: 'Vectơ \\vec{v}', code: '\\vec{u} \\cdot \\vec{v}' },
    { label: 'Góc \\widehat{ABC}', code: '\\widehat{ABC} = 90^\\circ' },
    { label: 'Tam giác \\triangle', code: '\\triangle ABC' },
    { label: 'Vuông góc \\perp', code: 'SA \\perp (ABCD)' },
    { label: 'Song song \\parallel', code: 'AB \\parallel CD' },
  ];

  const handleTitleChange = (newTitle: string) => {
    onUpdateDocument({
      ...document,
      title: newTitle,
      updatedAt: Date.now(),
    });
  };

  const handleExportDocx = async (customSettings?: WordExportSettings) => {
    try {
      setIsExporting(true);
      const settingsToUse = customSettings || exportSettings;
      const blob = await exportToWordDocx(document, settingsToUse);
      downloadDocxBlob(blob, `${document.title}.docx`);
      const delimiterLabel =
        settingsToUse.mathDelimiter === 'single_dollar'
          ? '$...$'
          : settingsToUse.mathDelimiter === 'double_dollar'
          ? '$$...$$'
          : 'thuần';
      setExportSuccessMessage(
        `Đã xuất file Word (.docx) thành công! Tất cả công thức toán học được đặt giữa cặp dấu ${delimiterLabel}, tương thích 100% với Word Equation và MathType.`
      );
      setTimeout(() => setExportSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Lỗi khi xuất Word docx:', err);
      alert('Không thể xuất tệp Word. Vui lòng kiểm tra lại nội dung.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyLatexAndMarkdown = () => {
    let md = `# ${document.title}\n\n`;
    if (document.summary) md += `*${document.summary}*\n\n`;

    for (const sec of document.sections) {
      if (sec.type === 'heading_1') md += `\n# ${sec.content}\n\n`;
      else if (sec.type === 'heading_2') md += `\n## ${sec.content}\n\n`;
      else if (sec.type === 'heading_3') md += `\n### ${sec.content}\n\n`;
      else if (sec.type === 'paragraph') md += `${sec.content}\n\n`;
      else if (sec.type === 'math_block') md += `$$\n${sec.latex || sec.content}\n$$\n\n`;
      else if (sec.type === 'callout') md += `> ${sec.content}\n\n`;
      else if (sec.type === 'exercise_solution' && sec.exercise) {
        md += `### ${sec.exercise.problemNumber || 'Bài toán'}: ${sec.exercise.problemStatement}\n\n`;
        md += `**Lời giải chi tiết:**\n`;
        sec.exercise.steps.forEach((s) => {
          md += `- Bước ${s.stepNumber} (${s.title}): ${s.explanation} ${s.formulaLatex ? `$$${s.formulaLatex}$$` : ''}\n`;
        });
        if (sec.exercise.pedagogicalCommentary) {
          md += `\n**Lời bình sư phạm:** ${sec.exercise.pedagogicalCommentary}\n`;
        }
        if (sec.exercise.finalAnswer) {
          md += `\n**Đáp số:** $$${sec.exercise.finalAnswer}$$\n\n`;
        }
      }
    }

    navigator.clipboard.writeText(md);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleManualSave = () => {
    onSaveToOffline(document);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Section manipulation
  const updateSection = (id: string, partial: Partial<DocumentSection>) => {
    const updatedSections = document.sections.map((sec) =>
      sec.id === id ? { ...sec, ...partial } : sec
    );
    onUpdateDocument({
      ...document,
      sections: updatedSections,
      updatedAt: Date.now(),
    });
  };

  const deleteSection = (id: string) => {
    const updatedSections = document.sections.filter((sec) => sec.id !== id);
    onUpdateDocument({
      ...document,
      sections: updatedSections,
      updatedAt: Date.now(),
    });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= document.sections.length) return;

    const newSections = [...document.sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    onUpdateDocument({
      ...document,
      sections: newSections,
      updatedAt: Date.now(),
    });
  };

  const addSection = (type: SectionType) => {
    const newId = `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    let newSec: DocumentSection;

    switch (type) {
      case 'heading_1':
        newSec = { id: newId, type, content: 'Tiêu đề phần mới' };
        break;
      case 'heading_2':
        newSec = { id: newId, type, content: 'Tiêu đề mục con' };
        break;
      case 'paragraph':
        newSec = { id: newId, type, content: 'Nhập nội dung văn bản mới...' };
        break;
      case 'math_block':
        newSec = { id: newId, type, latex: '\\int_{0}^{1} x^2 \\, dx = \\frac{1}{3}' };
        break;
      case 'table':
        newSec = {
          id: newId,
          type,
          tableData: {
            caption: 'Bảng số liệu mới',
            headers: ['Đại lượng', 'Ký hiệu', 'Giá trị'],
            rows: [
              ['Vận tốc', '$v$', '30 m/s'],
              ['Gia tốc', '$a$', '9.8 m/s²'],
            ],
          },
        };
        break;
      case 'callout':
        newSec = { id: newId, type, content: '📌 **Lưu ý quan trọng**: Ghi nhớ tính chất then chốt...' };
        break;
      default:
        newSec = { id: newId, type, content: 'Nội dung khối...' };
    }

    onUpdateDocument({
      ...document,
      sections: [...document.sections, newSec],
      updatedAt: Date.now(),
    });
    setActiveEditingSectionId(newId);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-100">
      {/* Top Document Header Bar */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Document Title (Editable) */}
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <FileText className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={document.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="font-bold text-sm sm:text-base text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white px-2 py-1 rounded-lg border border-transparent hover:border-slate-200 focus:border-blue-500 focus:outline-none w-full transition"
              title="Nhấp để đổi tên tài liệu"
            />
          </div>

          {/* Controls: Mode switch, Zoom, Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'preview'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Trang in Word</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'edit'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Chỉnh sửa khối</span>
              </button>
            </div>

            {/* AI Math Solver Shortcut */}
            <button
              type="button"
              onClick={onOpenMathSolver}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition active:scale-95"
              title="Mở Trợ lý Sư phạm giải toán"
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Giải bài tập & Lời bình</span>
            </button>

            {/* Copy LaTeX/Markdown */}
            <button
              type="button"
              onClick={handleCopyLatexAndMarkdown}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
              title="Sao chép toàn bộ văn bản và công thức LaTeX"
            >
              {hasCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Save to Offline */}
            <button
              type="button"
              onClick={handleManualSave}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition active:scale-95"
              title="Lưu vào bộ nhớ IndexedDB ngoại tuyến"
            >
              <Save className={`w-3.5 h-3.5 ${saveSuccess ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span>{saveSuccess ? 'Đã lưu!' : 'Lưu'}</span>
            </button>

            {/* Export Word DOCX Button with Settings Dropdown */}
            <div className="relative inline-flex items-center rounded-lg shadow-sm">
              <button
                type="button"
                id="btn-export-docx"
                onClick={() => handleExportDocx()}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-l-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition active:scale-95 disabled:opacity-50 border-r border-blue-500"
                title="Tải file Word (.docx) với công thức toán nằm giữa cặp dấu $...$"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Đang tạo Word...' : 'Tải file Word (.docx)'}</span>
              </button>
              <button
                type="button"
                id="btn-export-options"
                onClick={() => setShowExportModal(true)}
                className="p-1.5 rounded-r-lg text-white bg-blue-600 hover:bg-blue-700 transition active:scale-95"
                title="Tùy chọn xuất công thức toán ($...$, $$...$$, phông chữ)"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Document Workspace */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Export Success Toast */}
        {exportSuccessMessage && (
          <div className="mb-4 max-w-4xl mx-auto p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-emerald-800 text-xs sm:text-sm shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{exportSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setExportSuccessMessage(null)}
              className="text-emerald-600 hover:text-emerald-900 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* A4 Paper Container Preview */}
        <div
          className={`bg-white shadow-xl rounded-2xl border border-slate-200 transition-all duration-200 ${
            viewMode === 'preview'
              ? 'p-8 sm:p-14 max-w-4xl mx-auto min-h-[1050px]'
              : 'p-6 max-w-5xl mx-auto'
          }`}
          style={{
            fontFamily: viewMode === 'preview' ? '"Times New Roman", Times, serif' : 'system-ui, sans-serif',
          }}
        >
          {/* Document Header in Preview */}
          <div className="text-center pb-6 border-b border-slate-200 mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
              {document.title}
            </h1>
            {document.summary && (
              <p className="mt-2 text-sm text-slate-600 italic max-w-2xl mx-auto leading-relaxed">
                {document.summary}
              </p>
            )}
            <div className="flex items-center justify-center gap-2.5 mt-3 text-xs text-slate-500 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bảo toàn 100% nguyên văn ({document.sections.length} mục)</span>
              </span>
              <span>•</span>
              <span>Định dạng xuất: Microsoft Word (.docx)</span>
              <span>•</span>
              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold border border-blue-200 transition cursor-pointer"
                title="Nhấp để thay đổi tùy chọn định dạng công thức toán"
              >
                <Sigma className="w-3.5 h-3.5 text-blue-600" />
                <span>Toán học: <strong className="font-mono text-blue-900">{exportSettings.mathDelimiter === 'single_dollar' ? '$...$' : exportSettings.mathDelimiter === 'double_dollar' ? '$$...$$' : 'LaTeX thuần'}</strong></span>
                <Sliders className="w-3 h-3 text-blue-500 ml-0.5" />
              </button>
              <span>•</span>
              <span>Ngôn ngữ: {document.detectedLanguage?.toUpperCase() || 'VI'}</span>
            </div>
          </div>

          {/* Sections Renderer */}
          <div className="space-y-6">
            {document.sections.map((section, index) => {
              const isEditing = activeEditingSectionId === section.id && viewMode === 'edit';

              return (
                <div
                  key={section.id}
                  className={`group relative rounded-xl transition ${
                    viewMode === 'edit'
                      ? 'p-3.5 border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-400 hover:shadow-sm'
                      : ''
                  }`}
                >
                  {/* Edit Controls Toolbar in 'edit' mode */}
                  {viewMode === 'edit' && (
                    <div className="flex items-center justify-between mb-2 text-[11px] text-slate-500 border-b border-slate-100 pb-1.5">
                      <span className="font-semibold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                        #{index + 1} {section.type.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveSection(index, 'up')}
                          disabled={index === 0}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                          title="Di chuyển lên"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(index, 'down')}
                          disabled={index === document.sections.length - 1}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                          title="Di chuyển xuống"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSection(section.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 ml-1"
                          title="Xóa khối này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Section Content by Type */}
                  {/* 1. Headings */}
                  {section.type === 'heading_1' && (
                    <div>
                      {viewMode === 'edit' ? (
                        <input
                          type="text"
                          value={section.content || ''}
                          onChange={(e) => updateSection(section.id, { content: e.target.value })}
                          className="w-full font-bold text-lg text-slate-900 border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      ) : (
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-6 mb-3 tracking-tight border-b border-slate-100 pb-1">
                          <MathRenderer content={section.content || ''} />
                        </h2>
                      )}
                    </div>
                  )}

                  {section.type === 'heading_2' && (
                    <div>
                      {viewMode === 'edit' ? (
                        <input
                          type="text"
                          value={section.content || ''}
                          onChange={(e) => updateSection(section.id, { content: e.target.value })}
                          className="w-full font-bold text-base text-slate-900 border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      ) : (
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800 mt-5 mb-2">
                          <MathRenderer content={section.content || ''} />
                        </h3>
                      )}
                    </div>
                  )}

                  {section.type === 'heading_3' && (
                    <div>
                      {viewMode === 'edit' ? (
                        <input
                          type="text"
                          value={section.content || ''}
                          onChange={(e) => updateSection(section.id, { content: e.target.value })}
                          className="w-full font-bold text-sm text-slate-900 border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      ) : (
                        <h4 className="text-base font-bold text-slate-800 mt-4 mb-2">
                          <MathRenderer content={section.content || ''} />
                        </h4>
                      )}
                    </div>
                  )}

                  {/* 2. Paragraph & Lists */}
                  {(section.type === 'paragraph' || section.type === 'bullet_list' || section.type === 'numbered_list') && (
                    <div>
                      {viewMode === 'edit' ? (
                        <textarea
                          value={section.content || ''}
                          onChange={(e) => updateSection(section.id, { content: e.target.value })}
                          rows={3}
                          className="w-full text-sm text-slate-800 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white leading-relaxed"
                          placeholder="Nhập văn bản (hỗ trợ $công_thức$ và **đậm**)..."
                        />
                      ) : (
                        <p className="text-base text-slate-800 leading-relaxed tracking-normal my-2">
                          <MathRenderer content={section.content || ''} />
                        </p>
                      )}
                    </div>
                  )}

                  {/* 3. Math Block */}
                  {section.type === 'math_block' && (
                    <div>
                      {viewMode === 'edit' ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="font-medium">Mã LaTeX công thức:</span>
                            <span className="text-[11px] text-blue-600">Xem trước trực tiếp bên dưới</span>
                          </div>
                          <textarea
                            value={section.latex || section.content || ''}
                            onChange={(e) => updateSection(section.id, { latex: e.target.value })}
                            rows={2}
                            className="w-full font-mono text-xs text-blue-900 border border-blue-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/40"
                            placeholder="Nhập chuỗi LaTeX, ví dụ: \int_{0}^{1} x^2 dx"
                          />
                          {/* Quick Palette */}
                          <div className="flex flex-wrap gap-1 pt-1">
                            {latexShortcuts.map((s, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  const current = section.latex || '';
                                  updateSection(section.id, { latex: current ? `${current} ${s.code}` : s.code });
                                }}
                                className="px-2 py-0.5 rounded text-[10px] bg-slate-200 hover:bg-blue-100 text-slate-700 hover:text-blue-800 font-mono transition"
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Displayed Math formula box */}
                      <div className="my-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200 border-l-4 border-l-blue-600 text-center overflow-x-auto shadow-sm">
                        <MathRenderer content={section.latex || section.content || ''} block />
                      </div>
                    </div>
                  )}

                  {/* 4. Table */}
                  {section.type === 'table' && section.tableData && (
                    <div className="my-4">
                      {section.tableData.caption && (
                        <p className="text-center text-xs font-bold text-slate-700 mb-2 italic">
                          Bảng: {section.tableData.caption}
                        </p>
                      )}

                      <div className="overflow-x-auto rounded-xl border border-slate-300 shadow-sm">
                        <table className="w-full text-left border-collapse text-xs sm:text-sm">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-300">
                              {section.tableData.headers.map((header, hIdx) => (
                                <th
                                  key={hIdx}
                                  className="p-3 font-bold text-slate-800 border-r border-slate-300 last:border-r-0"
                                >
                                  {viewMode === 'edit' ? (
                                    <input
                                      type="text"
                                      value={header}
                                      onChange={(e) => {
                                        const newHeaders = [...section.tableData!.headers];
                                        newHeaders[hIdx] = e.target.value;
                                        updateSection(section.id, {
                                          tableData: { ...section.tableData!, headers: newHeaders },
                                        });
                                      }}
                                      className="w-full font-bold bg-transparent border-b border-slate-300 focus:outline-none focus:border-blue-500"
                                    />
                                  ) : (
                                    <MathRenderer content={header} />
                                  )}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {section.tableData.rows.map((row, rIdx) => (
                              <tr
                                key={rIdx}
                                className={`border-b border-slate-200 last:border-b-0 ${
                                  rIdx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'
                                }`}
                              >
                                {row.map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className="p-3 text-slate-700 border-r border-slate-200 last:border-r-0"
                                  >
                                    {viewMode === 'edit' ? (
                                      <input
                                        type="text"
                                        value={cell}
                                        onChange={(e) => {
                                          const newRows = section.tableData!.rows.map((r, ri) =>
                                            ri === rIdx
                                              ? r.map((c, ci) => (ci === cIdx ? e.target.value : c))
                                              : r
                                          );
                                          updateSection(section.id, {
                                            tableData: { ...section.tableData!, rows: newRows },
                                          });
                                        }}
                                        className="w-full bg-transparent focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 p-0.5 rounded"
                                      />
                                    ) : (
                                      <MathRenderer content={cell} />
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {viewMode === 'edit' && (
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              const newRows = [
                                ...section.tableData!.rows,
                                new Array(section.tableData!.headers.length).fill('Ô mới'),
                              ];
                              updateSection(section.id, {
                                tableData: { ...section.tableData!, rows: newRows },
                              });
                            }}
                            className="px-2 py-1 text-[11px] font-semibold bg-slate-200 hover:bg-slate-300 rounded text-slate-700 transition"
                          >
                            + Thêm dòng
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 5. Geometric Diagram */}
                  {section.type === 'geometry_diagram' && section.geometry && (
                    <div className="my-6 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                          <Shapes className="w-4 h-4 text-blue-600" />
                          {section.geometry.title || 'Mô hình hình học vector'}
                        </span>
                        <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                          Đồ họa vector SVG sắc nét
                        </span>
                      </div>

                      {/* SVG Canvas */}
                      <div className="flex justify-center p-2 bg-slate-50/50 rounded-xl overflow-hidden">
                        <div
                          className="w-full max-w-lg transition-transform duration-200"
                          dangerouslySetInnerHTML={{ __html: section.geometry.svgCode }}
                        />
                      </div>

                      {section.geometry.description && (
                        <p className="text-center text-xs text-slate-500 italic mt-3">
                          {section.geometry.description}
                        </p>
                      )}

                      {viewMode === 'edit' && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <label className="text-[11px] font-medium text-slate-600 block mb-1">
                            Mã nguồn SVG (Vector Code):
                          </label>
                          <textarea
                            value={section.geometry.svgCode}
                            onChange={(e) =>
                              updateSection(section.id, {
                                geometry: { ...section.geometry!, svgCode: e.target.value },
                              })
                            }
                            rows={3}
                            className="w-full font-mono text-[11px] text-slate-700 border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* 6. Exercise & Pedagogical Solution */}
                  {section.type === 'exercise_solution' && section.exercise && (
                    <div className="my-6 rounded-2xl bg-emerald-50/40 border border-emerald-200 p-5 space-y-4 shadow-sm">
                      {/* Problem Header */}
                      <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
                        <span className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4 text-emerald-600" />
                          {section.exercise.problemNumber || 'Bài toán'}: {section.exercise.category || 'Toán học'}
                        </span>
                        <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                          Lời giải sư phạm chi tiết
                        </span>
                      </div>

                      {/* Problem Statement */}
                      <div className="bg-white rounded-xl p-3.5 border border-emerald-100 shadow-xs">
                        <p className="text-xs font-bold text-slate-900 mb-1">Đề bài:</p>
                        <div className="text-sm text-slate-800 leading-relaxed">
                          <MathRenderer content={section.exercise.problemStatement} />
                        </div>
                      </div>

                      {/* Steps */}
                      <div className="space-y-2.5">
                        <p className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                          Lời giải tuần tự từng bước:
                        </p>
                        {section.exercise.steps.map((step) => (
                          <div key={step.stepNumber} className="bg-white rounded-xl p-3 border border-slate-200">
                            <p className="text-xs font-bold text-slate-900 mb-1">
                              Bước {step.stepNumber}: {step.title}
                            </p>
                            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                              <MathRenderer content={step.explanation} />
                            </div>
                            {step.formulaLatex && (
                              <div className="pt-2 text-center">
                                <MathRenderer content={step.formulaLatex} block />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Pedagogical Commentary */}
                      {section.exercise.pedagogicalCommentary && (
                        <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-200/80 space-y-1">
                          <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <Lightbulb className="w-4 h-4 text-amber-600" />
                            Lời bình sư phạm & Định hướng tư duy:
                          </p>
                          <div className="text-xs sm:text-sm text-amber-950 leading-relaxed">
                            <MathRenderer content={section.exercise.pedagogicalCommentary} />
                          </div>
                        </div>
                      )}

                      {/* Common Mistakes */}
                      {section.exercise.commonMistakes && (
                        <div className="bg-rose-50 rounded-xl p-3.5 border border-rose-200/80 space-y-1">
                          <p className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                            <HelpCircle className="w-4 h-4 text-rose-600" />
                            Lưu ý & Sai lầm thường gặp:
                          </p>
                          <div className="text-xs sm:text-sm text-rose-950 leading-relaxed whitespace-pre-line">
                            <MathRenderer content={section.exercise.commonMistakes} />
                          </div>
                        </div>
                      )}

                      {/* Final Answer */}
                      {section.exercise.finalAnswer && (
                        <div className="bg-emerald-100/70 rounded-xl p-3.5 border border-emerald-300 flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold text-emerald-950">Đáp số cuối cùng:</span>
                          <span className="text-sm font-bold text-emerald-950">
                            <MathRenderer content={section.exercise.finalAnswer} />
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 7. Callout Box */}
                  {section.type === 'callout' && (
                    <div className="my-4 p-4 rounded-xl bg-amber-50 border-l-4 border-l-amber-500 border border-amber-200 shadow-xs">
                      {viewMode === 'edit' ? (
                        <textarea
                          value={section.content || ''}
                          onChange={(e) => updateSection(section.id, { content: e.target.value })}
                          rows={2}
                          className="w-full text-xs text-amber-950 border border-amber-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                        />
                      ) : (
                        <div className="text-xs sm:text-sm text-amber-950 leading-relaxed font-medium">
                          <MathRenderer content={section.content || ''} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Section Quick Bar in Edit Mode */}
          {viewMode === 'edit' && (
            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                Thêm khối nội dung mới vào tài liệu:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                <button
                  type="button"
                  onClick={() => addSection('heading_1')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 transition group"
                >
                  <Heading1 className="w-4 h-4 text-slate-600 group-hover:text-blue-600 mb-1" />
                  <span className="text-[11px] font-semibold text-slate-700">Tiêu đề lớn</span>
                </button>

                <button
                  type="button"
                  onClick={() => addSection('paragraph')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 transition group"
                >
                  <AlignLeft className="w-4 h-4 text-slate-600 group-hover:text-blue-600 mb-1" />
                  <span className="text-[11px] font-semibold text-slate-700">Đoạn văn</span>
                </button>

                <button
                  type="button"
                  onClick={() => addSection('math_block')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 transition group"
                >
                  <Sigma className="w-4 h-4 text-slate-600 group-hover:text-blue-600 mb-1" />
                  <span className="text-[11px] font-semibold text-slate-700">Công thức LaTeX</span>
                </button>

                <button
                  type="button"
                  onClick={() => addSection('table')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 transition group"
                >
                  <TableIcon className="w-4 h-4 text-slate-600 group-hover:text-blue-600 mb-1" />
                  <span className="text-[11px] font-semibold text-slate-700">Bảng biểu</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenMathSolver}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-emerald-200 hover:border-emerald-400 bg-emerald-50/50 hover:bg-emerald-100/50 transition group"
                >
                  <GraduationCap className="w-4 h-4 text-emerald-600 mb-1" />
                  <span className="text-[11px] font-semibold text-emerald-800">Giải toán sư phạm</span>
                </button>

                <button
                  type="button"
                  onClick={() => addSection('callout')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 transition group"
                >
                  <Quote className="w-4 h-4 text-slate-600 group-hover:text-blue-600 mb-1" />
                  <span className="text-[11px] font-semibold text-slate-700">Hộp ghi chú</span>
                </button>
              </div>
            </div>
          )}

          {/* Document Footer Preview */}
          <div className="mt-12 pt-6 border-t border-slate-200 text-right text-xs text-slate-400">
            Trang 1 / 1 • Tài liệu Word (.docx) • PDF to Word & Math Studio
          </div>
        </div>
      </main>

      {/* Modal Tùy chọn Xuất File Word (.docx) */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Tùy chọn xuất Microsoft Word (.docx)</h3>
                  <p className="text-xs text-slate-500">Thiết lập định dạng công thức toán học và bố cục xuất bản</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
              {/* Math Delimiter Choice */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                  1. Định dạng bao bọc công thức toán học (Toán học trong Word)
                </label>
                <div className="space-y-2.5">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                      exportSettings.mathDelimiter === 'single_dollar'
                        ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="mathDelimiter"
                      value="single_dollar"
                      checked={exportSettings.mathDelimiter === 'single_dollar'}
                      onChange={() =>
                        setExportSettings((prev) => ({ ...prev, mathDelimiter: 'single_dollar' }))
                      }
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">Đặt giữa cặp dấu $...$</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          Khuyên dùng
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Mọi công thức toán nội dòng và độc lập đều được đặt giữa cặp dấu <strong className="font-mono text-blue-700 font-bold">$...$</strong>.
                        Tương thích hoàn hảo để bấm <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[11px] font-mono">Alt</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[11px] font-mono">=</kbd> trong Word chuyển đổi sang Word Equation, MathType (Toggle TeX), và ngân hàng đề thi (mcMix, YoungMix).
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                      exportSettings.mathDelimiter === 'double_dollar'
                        ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="mathDelimiter"
                      value="double_dollar"
                      checked={exportSettings.mathDelimiter === 'double_dollar'}
                      onChange={() =>
                        setExportSettings((prev) => ({ ...prev, mathDelimiter: 'double_dollar' }))
                      }
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-slate-900">Đặt giữa cặp dấu $$...$$</span>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Công thức được bao bọc giữa cặp dấu <strong className="font-mono text-blue-700 font-bold">$$...$$</strong> (chuẩn LaTeX Display Math).
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                      exportSettings.mathDelimiter === 'none'
                        ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="mathDelimiter"
                      value="none"
                      checked={exportSettings.mathDelimiter === 'none'}
                      onChange={() =>
                        setExportSettings((prev) => ({ ...prev, mathDelimiter: 'none' }))
                      }
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-slate-900">Mã LaTeX thuần (Không có dấu $)</span>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Giữ nguyên mã lệnh LaTeX nguyên bản không bọc dấu đô la.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Math Font Choice */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  2. Phông chữ công thức toán trong Word
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExportSettings((p) => ({ ...p, mathFont: 'Cambria Math' }))}
                    className={`p-3 rounded-xl border text-left transition ${
                      exportSettings.mathFont === 'Cambria Math'
                        ? 'border-blue-500 bg-blue-50 text-blue-900 font-semibold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-sm">Cambria Math</div>
                    <div className="text-xs text-slate-500 mt-0.5">Phông toán chuẩn Microsoft Word</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportSettings((p) => ({ ...p, mathFont: 'Times New Roman' }))}
                    className={`p-3 rounded-xl border text-left transition ${
                      exportSettings.mathFont === 'Times New Roman'
                        ? 'border-blue-500 bg-blue-50 text-blue-900 font-semibold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-sm">Times New Roman</div>
                    <div className="text-xs text-slate-500 mt-0.5">Đồng bộ phông chữ văn bản</div>
                  </button>
                </div>
              </div>

              {/* Vector geometry option */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportSettings.includeGeometryImages}
                    onChange={(e) =>
                      setExportSettings((p) => ({ ...p, includeGeometryImages: e.target.checked }))
                    }
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-xs font-medium text-slate-800">
                    Nhúng mô hình hình học vector SVG sắc nét vào tài liệu Word
                  </span>
                </label>
              </div>

              {/* Live Preview Box */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>Minh họa định dạng công thức khi mở trong Microsoft Word:</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs text-blue-800 break-all select-all">
                  {exportSettings.mathDelimiter === 'single_dollar'
                    ? '$V = \\frac{1}{3} S_{ABCD} \\cdot SO = \\frac{a^3\\sqrt{6}}{6}$'
                    : exportSettings.mathDelimiter === 'double_dollar'
                    ? '$$V = \\frac{1}{3} S_{ABCD} \\cdot SO = \\frac{a^3\\sqrt{6}}{6}$$'
                    : 'V = \\frac{1}{3} S_{ABCD} \\cdot SO = \\frac{a^3\\sqrt{6}}{6}'}
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  Tip: Trong Microsoft Word 2016 / 2019 / 2021 / Office 365, bôi đen chuỗi công thức trên rồi nhấn tổ hợp phím <strong>Alt + =</strong> để chuyển đổi trực tiếp thành biểu thức toán Equation tương tác!
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/80">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200/70 transition"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExportModal(false);
                  handleExportDocx();
                }}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Đang xuất Word...' : 'Tải file Word (.docx) ngay'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
