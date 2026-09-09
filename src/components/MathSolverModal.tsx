import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { ExerciseSolution } from '../types';
import { MathRenderer } from '../utils/mathRenderer';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface MathSolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSolution: (solution: ExerciseSolution, svgIllustration?: string) => void;
}

export const MathSolverModal: React.FC<MathSolverModalProps> = ({
  isOpen,
  onClose,
  onInsertSolution,
}) => {
  const isOnline = useOnlineStatus();
  const [problemText, setProblemText] = useState('');
  const [category, setCategory] = useState('Hình học không gian & Giải tích');
  const [isSolving, setIsSolving] = useState(false);
  const [error, setError] = useState('');
  const [resultSolution, setResultSolution] = useState<ExerciseSolution | null>(null);
  const [svgIllustration, setSvgIllustration] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSolve = async () => {
    if (!problemText.trim()) {
      setError('Vui lòng nhập nội dung bài toán cần giải.');
      return;
    }

    if (!isOnline) {
      setError('Cần có kết nối internet để tạo lời giải sư phạm từ trợ lý AI.');
      return;
    }

    setIsSolving(true);
    setError('');
    setResultSolution(null);
    setSvgIllustration(null);

    try {
      const response = await fetch('/api/solve-math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemText: problemText.trim(),
          category,
          language: 'vi',
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Lỗi máy chủ (${response.status})`);
      }

      const jsonRes = await response.json();
      if (!jsonRes.success || !jsonRes.data) {
        throw new Error(jsonRes.error || 'Dữ liệu lời giải không hợp lệ.');
      }

      const data = jsonRes.data;
      const solution: ExerciseSolution = {
        problemNumber: 'Bài toán',
        category: data.category || category,
        problemStatement: data.problemStatement || problemText,
        steps: data.steps || [],
        pedagogicalCommentary: data.pedagogicalCommentary || '',
        commonMistakes: data.commonMistakes || '',
        finalAnswer: data.finalAnswer || '',
      };

      setResultSolution(solution);
      if (data.svgIllustration) {
        setSvgIllustration(data.svgIllustration);
      }
    } catch (err: any) {
      console.error('Lỗi giải toán:', err);
      setError(err.message || 'Không thể tạo lời giải bài tập.');
    } finally {
      setIsSolving(false);
    }
  };

  const handleApply = () => {
    if (resultSolution) {
      onInsertSolution(resultSolution, svgIllustration || undefined);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 via-white to-blue-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white shadow-sm">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Trợ lý Sư phạm: Giải chi tiết bài tập & Lời bình
              </h2>
              <p className="text-xs text-slate-500">
                Tự động tạo các bước giải chuẩn tắc, định hướng tư duy sư phạm và cảnh báo bẫy sai lầm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Input Form */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Đề bài tập toán</label>
                <span className="text-[11px] text-slate-400">Hỗ trợ công thức LaTeX $...$ hoặc tiếng Việt tự nhiên</span>
              </div>
              <textarea
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                placeholder="Ví dụ: Cho hình chóp S.ABCD đáy hình vuông cạnh a, cạnh bên SA vuông góc với đáy và SA = a căn 2. Tính thể tích khối chóp và khoảng cách từ A đến mặt phẳng (SBC)..."
                rows={3}
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/40 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Phân loại dạng toán</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Hình học không gian & Thể tích">Hình học không gian & Thể tích</option>
                  <option value="Khảo sát hàm số & Giải tích 12">Khảo sát hàm số & Giải tích 12</option>
                  <option value="Nguyên hàm - Tích phân & Ứng dụng">Nguyên hàm - Tích phân & Ứng dụng</option>
                  <option value="Hình học giải tích Oxy / Oxyz">Hình học giải tích Oxy / Oxyz</option>
                  <option value="Bất đẳng thức & Cực trị đại số">Bất đẳng thức & Cực trị đại số</option>
                  <option value="Xác suất thống kê & Tổ hợp">Xác suất thống kê & Tổ hợp</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleSolve}
                  disabled={isSolving || !problemText.trim()}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition active:scale-95"
                >
                  {isSolving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang phân tích sư phạm...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Tạo lời giải & Lời bình</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
                <div>
                  <p className="font-semibold text-rose-900">Không thể tạo lời giải</p>
                  <p className="leading-relaxed text-rose-700 mt-0.5">{error}</p>
                </div>
              </div>
              {!isSolving && problemText.trim() && (
                <button
                  type="button"
                  onClick={handleSolve}
                  className="shrink-0 self-end sm:self-center px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm transition flex items-center gap-1.5 active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Thử lại</span>
                </button>
              )}
            </div>
          )}

          {/* Result View */}
          {resultSolution && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Kết quả lời giải sư phạm đã sẵn sàng
                </span>
                <span className="text-[11px] font-medium bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {resultSolution.category}
                </span>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Các bước giải tuần tự:
                </h4>
                {resultSolution.steps.map((step) => (
                  <div key={step.stepNumber} className="bg-white rounded-lg p-3 border border-slate-200 space-y-1">
                    <p className="text-xs font-bold text-slate-900">
                      Bước {step.stepNumber}: {step.title}
                    </p>
                    <div className="text-xs text-slate-700 leading-relaxed">
                      <MathRenderer content={step.explanation} />
                    </div>
                    {step.formulaLatex && (
                      <div className="pt-1.5">
                        <MathRenderer content={step.formulaLatex} block />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pedagogical Commentary */}
              {resultSolution.pedagogicalCommentary && (
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 space-y-1">
                  <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    Lời bình sư phạm & Định hướng tư duy:
                  </h4>
                  <div className="text-xs text-amber-950 leading-relaxed">
                    <MathRenderer content={resultSolution.pedagogicalCommentary} />
                  </div>
                </div>
              )}

              {/* Common Mistakes */}
              {resultSolution.commonMistakes && (
                <div className="bg-rose-50 rounded-lg p-3 border border-rose-200 space-y-1">
                  <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
                    Lưu ý & Sai lầm học sinh dễ mắc phải:
                  </h4>
                  <div className="text-xs text-rose-950 leading-relaxed whitespace-pre-line">
                    <MathRenderer content={resultSolution.commonMistakes} />
                  </div>
                </div>
              )}

              {/* Final Answer */}
              {resultSolution.finalAnswer && (
                <div className="bg-emerald-100/60 rounded-lg p-3 border border-emerald-300 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">Đáp số / Kết luận:</span>
                  <span className="text-xs font-bold text-emerald-950">
                    <MathRenderer content={resultSolution.finalAnswer} />
                  </span>
                </div>
              )}

              {/* SVG Graphic if generated */}
              {svgIllustration && (
                <div className="bg-white rounded-lg p-3 border border-slate-200 text-center">
                  <p className="text-[11px] font-semibold text-slate-500 mb-2">Hình vẽ minh họa trực quan:</p>
                  <div
                    className="max-h-60 overflow-hidden flex justify-center"
                    dangerouslySetInnerHTML={{ __html: svgIllustration }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition"
          >
            Đóng
          </button>

          {resultSolution && (
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Chèn lời giải vào tài liệu Word</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
