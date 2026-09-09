import React, { useState } from 'react';
import {
  FolderSync,
  Search,
  FileText,
  Download,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  Sigma,
  Shapes,
  GraduationCap,
  X,
  FileCheck,
} from 'lucide-react';
import { ConvertedDocument } from '../types';
import { exportToWordDocx, downloadDocxBlob } from '../utils/docxExport';

interface OfflineLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  documents: ConvertedDocument[];
  onSelectDocument: (doc: ConvertedDocument) => void;
  onDeleteDocument: (id: string) => void;
}

export const OfflineLibrary: React.FC<OfflineLibraryProps> = ({
  isOpen,
  onClose,
  documents,
  onSelectDocument,
  onDeleteDocument,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'math' | 'geometry' | 'tables'>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.summary && doc.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'math') return doc.metadata?.hasMath || doc.metadata?.hasExercises;
    if (filterType === 'geometry') return doc.metadata?.hasGeometry;
    if (filterType === 'tables') return doc.metadata?.hasTables;

    return true;
  });

  const handleDownloadDocx = async (e: React.MouseEvent, doc: ConvertedDocument) => {
    e.stopPropagation();
    try {
      setDownloadingId(doc.id);
      const blob = await exportToWordDocx(doc);
      downloadDocxBlob(blob, `${doc.title}.docx`);
    } catch (err) {
      console.error('Lỗi khi xuất Word:', err);
      alert('Không thể xuất tệp Word. Vui lòng thử lại.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc chắn muốn xóa tài liệu này khỏi bộ nhớ ngoại tuyến?')) {
      onDeleteDocument(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white">
              <FolderSync className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Thư viện tài liệu ngoại tuyến (IndexedDB)
              </h2>
              <p className="text-xs text-slate-500">
                Toàn bộ tài liệu được lưu trữ an toàn trong trình duyệt, truy cập và xuất Word mọi lúc mọi nơi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm tài liệu theo tiêu đề, nội dung, tên tệp..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({documents.length})
            </button>
            <button
              onClick={() => setFilterType('math')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition ${
                filterType === 'math'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Sigma className="w-3 h-3" />
              Toán & Lời giải
            </button>
            <button
              onClick={() => setFilterType('geometry')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition ${
                filterType === 'geometry'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Shapes className="w-3 h-3" />
              Hình học vector
            </button>
            <button
              onClick={() => setFilterType('tables')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition ${
                filterType === 'tables'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3 h-3" />
              Bảng biểu
            </button>
          </div>
        </div>

        {/* Documents List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 bg-slate-50/40">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Không tìm thấy tài liệu phù hợp</p>
              <p className="text-xs text-slate-500 mt-1">
                Hãy tải lên một tệp PDF hoặc chọn các tài liệu mẫu trong mục Chuyển đổi.
              </p>
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => {
                  onSelectDocument(doc);
                  onClose();
                }}
                className="group relative bg-white rounded-xl p-4 border border-slate-200 hover:border-blue-500 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 border border-blue-100">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                        {doc.title}
                      </h3>
                      {doc.summary && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {doc.summary}
                        </p>
                      )}

                      {/* Badges & Meta */}
                      <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-600">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(doc.updatedAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>

                        <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                          <FileCheck className="w-3 h-3" />
                          {doc.sections.length} khối nội dung
                        </span>

                        {doc.metadata?.hasExercises && (
                          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                            <GraduationCap className="w-3 h-3" />
                            Lời giải sư phạm
                          </span>
                        )}

                        {doc.metadata?.hasGeometry && (
                          <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-medium border border-blue-200">
                            <Shapes className="w-3 h-3" />
                            Hình học SVG
                          </span>
                        )}

                        {doc.metadata?.hasMath && (
                          <span className="flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-medium border border-purple-200">
                            <Sigma className="w-3 h-3" />
                            LaTeX
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleDownloadDocx(e, doc)}
                      disabled={downloadingId === doc.id}
                      className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition active:scale-95"
                      title="Tải tệp Word (.docx)"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, doc.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition active:scale-95"
                      title="Xóa khỏi bộ nhớ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
          <span>{documents.length} tài liệu được lưu trong IndexedDB</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 font-semibold text-slate-700 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
