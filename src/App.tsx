import React, { useState, useEffect, useCallback } from 'react';
import { ConvertedDocument, ExerciseSolution, DocumentSection } from './types';
import { SAMPLE_DOCUMENTS } from './data/sampleDocuments';
import {
  getAllSavedDocuments,
  saveDocumentOffline,
  deleteDocumentOffline,
} from './utils/offlineStorage';
import { Navbar } from './components/Navbar';
import { DocumentEditor } from './components/DocumentEditor';
import { FileUploadModal } from './components/FileUploadModal';
import { OfflineLibrary } from './components/OfflineLibrary';
import { MathSolverModal } from './components/MathSolverModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [documents, setDocuments] = useState<ConvertedDocument[]>([]);
  const [currentDoc, setCurrentDoc] = useState<ConvertedDocument | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [isMathSolverOpen, setIsMathSolverOpen] = useState<boolean>(false);

  // Load from IndexedDB on startup
  useEffect(() => {
    async function initStorage() {
      try {
        const stored = await getAllSavedDocuments();
        if (stored && stored.length > 0) {
          setDocuments(stored);
          setCurrentDoc(stored[0]);
        } else {
          // Preload sample documents so the user has immediate rich data
          for (const sample of SAMPLE_DOCUMENTS) {
            await saveDocumentOffline(sample);
          }
          setDocuments(SAMPLE_DOCUMENTS);
          setCurrentDoc(SAMPLE_DOCUMENTS[0]);
        }
      } catch (err) {
        console.warn('Could not initialize IndexedDB, falling back to samples:', err);
        setDocuments(SAMPLE_DOCUMENTS);
        setCurrentDoc(SAMPLE_DOCUMENTS[0]);
      } finally {
        setIsLoading(false);
      }
    }

    initStorage();
  }, []);

  // Update current document and persist
  const handleUpdateDocument = useCallback(async (updated: ConvertedDocument) => {
    setCurrentDoc(updated);
    setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    try {
      await saveDocumentOffline(updated);
    } catch (e) {
      console.warn('Lỗi lưu tài liệu tự động:', e);
    }
  }, []);

  // When a newly converted or sample document is ready
  const handleDocumentReady = useCallback(async (newDoc: ConvertedDocument) => {
    setCurrentDoc(newDoc);
    setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)]);
    try {
      await saveDocumentOffline(newDoc);
    } catch (e) {
      console.warn('Lỗi lưu tài liệu mới:', e);
    }
  }, []);

  // Delete document
  const handleDeleteDocument = useCallback(async (id: string) => {
    try {
      await deleteDocumentOffline(id);
      setDocuments((prev) => {
        const filtered = prev.filter((d) => d.id !== id);
        if (currentDoc?.id === id) {
          setCurrentDoc(filtered.length > 0 ? filtered[0] : null);
        }
        return filtered;
      });
    } catch (e) {
      console.error('Lỗi khi xóa tài liệu:', e);
    }
  }, [currentDoc]);

  // Insert AI Math Solution into active document
  const handleInsertMathSolution = useCallback(
    (solution: ExerciseSolution, svgIllustration?: string) => {
      if (!currentDoc) return;

      const newSections: DocumentSection[] = [...currentDoc.sections];

      // If there is an SVG illustration generated, add it before or with the solution
      if (svgIllustration) {
        newSections.push({
          id: `sec-geo-${Date.now()}`,
          type: 'geometry_diagram',
          geometry: {
            title: `Hình vẽ minh họa: ${solution.problemNumber || 'Bài toán'}`,
            description: 'Đồ họa vector SVG trực quan phục vụ lời giải',
            svgCode: svgIllustration,
          },
        });
      }

      // Add exercise solution section
      newSections.push({
        id: `sec-sol-${Date.now()}`,
        type: 'exercise_solution',
        exercise: solution,
      });

      const updatedDoc: ConvertedDocument = {
        ...currentDoc,
        metadata: {
          ...currentDoc.metadata,
          hasExercises: true,
          hasGeometry: currentDoc.metadata?.hasGeometry || !!svgIllustration,
        },
        sections: newSections,
        updatedAt: Date.now(),
      };

      handleUpdateDocument(updatedDoc);
    },
    [currentDoc, handleUpdateDocument]
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 selection:bg-blue-200 selection:text-blue-900">
      {/* Top Navbar */}
      <Navbar
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        savedCount={documents.length}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold">Đang tải môi trường ngoại tuyến...</p>
            </div>
          </div>
        ) : currentDoc ? (
          <DocumentEditor
            document={currentDoc}
            onUpdateDocument={handleUpdateDocument}
            onOpenMathSolver={() => setIsMathSolverOpen(true)}
            onSaveToOffline={handleUpdateDocument}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-lg">
              <h2 className="text-lg font-bold text-slate-900">Chưa có tài liệu nào được mở</h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Tải lên tệp PDF mới để chuyển đổi sang Word, hoặc chọn từ các bài tập mẫu có sẵn để khám phá tính năng nhận diện OCR, công thức LaTeX và hình học vector.
              </p>
              <div className="flex justify-center gap-3 mt-6">
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-md shadow-blue-600/20 hover:bg-blue-700 transition"
                >
                  Chuyển đổi tệp PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Offline Status Float Indicator */}
      <OfflineIndicator />

      {/* Modals */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDocumentReady={handleDocumentReady}
      />

      <OfflineLibrary
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        documents={documents}
        onSelectDocument={(doc) => setCurrentDoc(doc)}
        onDeleteDocument={handleDeleteDocument}
      />

      <MathSolverModal
        isOpen={isMathSolverOpen}
        onClose={() => setIsMathSolverOpen(false)}
        onInsertSolution={handleInsertMathSolution}
      />
    </div>
  );
}
