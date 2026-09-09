import React from 'react';
import { FileText, FolderSync, PlusCircle, Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  onOpenUpload: () => void;
  onOpenLibrary: () => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenUpload,
  onOpenLibrary,
  savedCount,
}) => {
  const isOnline = useOnlineStatus();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-100">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                PDF to Word & Math Studio
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                OCR • LaTeX • Sư phạm
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-500 font-medium">
              Chuyển đổi chuẩn xác cao, giữ nguyên bảng biểu, hình học vector và lời giải bài tập
            </p>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Connectivity Badge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
            title={isOnline ? 'Đang kết nối internet' : 'Đang làm việc ở chế độ ngoại tuyến'}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>Trực tuyến</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span>Ngoại tuyến</span>
              </>
            )}
          </div>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Library Button */}
          <button
            id="btn-nav-library"
            onClick={onOpenLibrary}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition active:scale-95"
          >
            <FolderSync className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden xs:inline">Tài liệu đã lưu</span>
            {savedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                {savedCount}
              </span>
            )}
          </button>

          {/* Upload New Document Button */}
          <button
            id="btn-nav-upload"
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-600/25 transition active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Chuyển đổi PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
};
