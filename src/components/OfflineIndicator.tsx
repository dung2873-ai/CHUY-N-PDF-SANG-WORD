import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, Database } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      id="banner-offline-status"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600/95 text-white px-4 py-2 text-xs font-medium shadow-xl border border-amber-500 backdrop-blur-md animate-bounce-subtle"
    >
      <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-700/80">
        <WifiOff className="w-3.5 h-3.5" />
      </div>
      <div>
        <p className="font-semibold">Chế độ ngoại tuyến (Offline Mode)</p>
        <p className="text-[11px] text-amber-100 flex items-center gap-1 mt-0.5">
          <Database className="w-3 h-3 inline" /> Toàn bộ tài liệu được lưu trong IndexedDB máy bạn.
        </p>
      </div>
    </div>
  );
};
