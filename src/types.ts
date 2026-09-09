export type SectionType =
  | 'heading_1'
  | 'heading_2'
  | 'heading_3'
  | 'paragraph'
  | 'bullet_list'
  | 'numbered_list'
  | 'table'
  | 'math_block'
  | 'geometry_diagram'
  | 'exercise_solution'
  | 'callout';

export interface TableData {
  caption?: string;
  headers: string[];
  rows: string[][];
}

export interface GeometryData {
  title?: string;
  description?: string;
  svgCode: string;
}

export interface ExerciseStep {
  stepNumber: number;
  title: string;
  explanation: string;
  formulaLatex?: string;
}

export interface ExerciseSolution {
  problemNumber?: string;
  category?: string;
  problemStatement: string;
  steps: ExerciseStep[];
  pedagogicalCommentary: string; // Lời bình sư phạm & định hướng tư duy
  commonMistakes?: string;       // Sai lầm học sinh dễ mắc phải & lưu ý
  finalAnswer: string;           // Đáp số / kết luận
}

export interface DocumentSection {
  id: string;
  type: SectionType;
  content?: string;             // Text, bullet points, callout text
  latex?: string;               // For math_block
  tableData?: TableData;        // For table
  geometry?: GeometryData;      // For geometry_diagram
  exercise?: ExerciseSolution;  // For exercise_solution
}

export interface ConvertedDocument {
  id: string;
  title: string;
  fileName: string;
  fileSize?: number;
  createdAt: number;
  updatedAt: number;
  detectedLanguage?: string;
  summary?: string;
  isOfflineCached?: boolean;
  metadata?: {
    pageCountEstimate?: number;
    hasMath?: boolean;
    hasTables?: boolean;
    hasGeometry?: boolean;
    hasExercises?: boolean;
    isVerbatimFullExtraction?: boolean;
  };
  sections: DocumentSection[];
}

export interface ConversionOptions {
  language: string;
  includeMathSolutions: boolean;
  preserveFormatting: boolean;
  vectorGeometry: boolean;
  ocrEngine: 'ai_deep' | 'high_precision';
  fullContentPreservation: boolean; // Bảo toàn nguyên văn 100%, không bỏ sót nội dung
}

export interface WordExportSettings {
  mathDelimiter: 'single_dollar' | 'double_dollar' | 'none'; // Mặc định '$...$' (chuẩn Word Equation & MathType)
  mathFont: 'Cambria Math' | 'Times New Roman';
  includeGeometryImages: boolean;
  autoWrapLatexKeywords?: boolean;
}
