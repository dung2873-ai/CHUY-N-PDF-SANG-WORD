import { ConvertedDocument } from '../types';

export const SAMPLE_DOCUMENTS: ConvertedDocument[] = [
  {
    id: 'doc-sample-math-exam',
    title: 'Chuyên đề Hình học không gian & Giải tích 12 (Kèm Lời bình sư phạm)',
    fileName: 'De_Toan_HinhHoc_GiaiTich_12.pdf',
    fileSize: 1845200,
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 2,
    detectedLanguage: 'vi',
    summary: 'Tài liệu ôn tập chuyên sâu gồm lý thuyết tích phân, bảng biến thiên, mô hình hình chóp không gian vector hóa sắc nét và bài tập mẫu có lời giải sư phạm chi tiết.',
    isOfflineCached: true,
    metadata: {
      pageCountEstimate: 4,
      hasMath: true,
      hasTables: true,
      hasGeometry: true,
      hasExercises: true,
    },
    sections: [
      {
        id: 'sec-1',
        type: 'heading_1',
        content: 'I. KHẢO SÁT HÀM SỐ & TÍCH PHÂN TỪNG PHẦN',
      },
      {
        id: 'sec-2',
        type: 'paragraph',
        content: 'Cho hàm số $f(x)$ liên tục và khả vi trên đoạn $[a; b]$. Để tính tích phân các hàm hỗn hợp giữa đa thức và lượng giác hoặc hàm mũ, ta áp dụng công thức tích phân từng phần kinh điển: $$\\int u \\, dv = uv - \\int v \\, du$$ với thứ tự ưu tiên đặt biến $u$: **"Nhất log, nhì đa, tam lượng, tứ mũ"**.',
      },
      {
        id: 'sec-3',
        type: 'table',
        tableData: {
          caption: 'Bảng nguyên hàm cơ bản và công thức mở rộng thường gặp trong kỳ thi',
          headers: ['Hàm số $f(x)$', 'Nguyên hàm cơ bản $\\int f(x)dx$', 'Mở rộng $f(ax + b)$ ($a \\neq 0$)', 'Tập xác định'],
          rows: [
            ['$x^n \\, (n \\neq -1)$', '$\\frac{x^{n+1}}{n+1} + C$', '$\\frac{1}{a} \\frac{(ax+b)^{n+1}}{n+1} + C$', '$x \\in \\mathbb{R}$'],
            ['$\\frac{1}{x}$', '$\\ln|x| + C$', '$\\frac{1}{a} \\ln|ax+b| + C$', '$x \\neq 0$'],
            ['$e^x$', '$e^x + C$', '$\\frac{1}{a} e^{ax+b} + C$', '$x \\in \\mathbb{R}$'],
            ['$\\sin x$', '$-\\cos x + C$', '$-\\frac{1}{a} \\cos(ax+b) + C$', '$x \\in \\mathbb{R}$'],
            ['$\\cos x$', '$\\sin x + C$', '$\\frac{1}{a} \\sin(ax+b) + C$', '$x \\in \\mathbb{R}$'],
            ['$\\frac{1}{\\cos^2 x}$', '$\\tan x + C$', '$\\frac{1}{a} \\tan(ax+b) + C$', '$x \\neq \\frac{\\pi}{2} + k\\pi$'],
          ],
        },
      },
      {
        id: 'sec-4',
        type: 'heading_2',
        content: 'II. MÔ HÌNH HÌNH HỌC KHÔNG GIAN: HÌNH CHÓP S.ABCD',
      },
      {
        id: 'sec-5',
        type: 'paragraph',
        content: 'Xét hình chóp tứ giác đều $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh $a$, tâm $O$. Cạnh bên $SA = SB = SC = SD = a\\sqrt{2}$. Đường cao của hình chóp chính là đoạn thẳng nối đỉnh $S$ và tâm đáy $O$, tức là $SO \\perp (ABCD)$.',
      },
      {
        id: 'sec-6',
        type: 'geometry_diagram',
        geometry: {
          title: 'Hình chóp tứ giác đều S.ABCD và chiều cao SO',
          description: 'Hình biểu diễn không gian 3 chiều với các nét đứt khuất (AC, BD, SO) và nét liền bao quanh, đánh dấu các đỉnh S, A, B, C, D, O.',
          svgCode: `<svg viewBox="0 0 540 400" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto max-h-[380px]">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#f1f5f9"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.1"/>
    </filter>
  </defs>
  <!-- Background panel -->
  <rect width="540" height="400" rx="16" fill="url(#bgGrad)" stroke="#cbd5e1" stroke-width="1.5"/>
  
  <!-- Base ABCD -->
  <!-- Back edges (Dashed): AB, AD -->
  <line x1="80" y1="270" x2="220" y2="210" stroke="#2563eb" stroke-width="2.5" stroke-dasharray="6,6"/>
  <line x1="220" y1="210" x2="440" y2="210" stroke="#2563eb" stroke-width="2.5" stroke-dasharray="6,6"/>
  
  <!-- Front edges (Solid): BC, CD -->
  <line x1="80" y1="270" x2="300" y2="330" stroke="#1e40af" stroke-width="2.5"/>
  <line x1="300" y1="330" x2="440" y2="210" stroke="#1e40af" stroke-width="2.5"/>
  
  <!-- Diagonals AC, BD (Dashed) -->
  <line x1="80" y1="270" x2="440" y2="210" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>
  <line x1="220" y1="210" x2="300" y2="330" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>
  
  <!-- Center O intersection at (260, 270) -->
  <circle cx="260" cy="270" r="4.5" fill="#0284c7"/>
  <text x="272" y="285" fill="#0284c7" font-family="Times New Roman, serif" font-size="20" font-weight="bold">O</text>
  
  <!-- Height SO (Dashed from S(260, 70) to O(260, 270)) -->
  <line x1="260" y1="70" x2="260" y2="270" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="6,6"/>
  
  <!-- Right angle mark at O -->
  <polyline points="260,256 274,256 274,270" fill="none" stroke="#dc2626" stroke-width="1.5"/>
  
  <!-- Lateral edges from S(260, 70) -->
  <!-- SA (Solid) -->
  <line x1="260" y1="70" x2="80" y2="270" stroke="#1e3a8a" stroke-width="3"/>
  <!-- SB (Solid) -->
  <line x1="260" y1="70" x2="300" y2="330" stroke="#1e3a8a" stroke-width="3"/>
  <!-- SC (Solid) -->
  <line x1="260" y1="70" x2="440" y2="210" stroke="#1e3a8a" stroke-width="3"/>
  <!-- SD (Dashed - hidden back edge) -->
  <line x1="260" y1="70" x2="220" y2="210" stroke="#2563eb" stroke-width="2.5" stroke-dasharray="6,6"/>
  
  <!-- Vertices labels with serif elegance -->
  <text x="255" y="52" fill="#1e3a8a" font-family="Times New Roman, serif" font-size="24" font-weight="bold">S</text>
  <text x="56" y="282" fill="#1e3a8a" font-family="Times New Roman, serif" font-size="22" font-weight="bold">A</text>
  <text x="296" y="360" fill="#1e3a8a" font-family="Times New Roman, serif" font-size="22" font-weight="bold">B</text>
  <text x="452" y="216" fill="#1e3a8a" font-family="Times New Roman, serif" font-size="22" font-weight="bold">C</text>
  <text x="210" y="198" fill="#1e3a8a" font-family="Times New Roman, serif" font-size="22" font-weight="bold">D</text>

  <!-- Title Badge inside SVG -->
  <rect x="18" y="16" width="160" height="32" rx="6" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1"/>
  <text x="30" y="38" fill="#1d4ed8" font-family="system-ui, sans-serif" font-size="13" font-weight="600">Hình chóp đều S.ABCD</text>
</svg>`,
        },
      },
      {
        id: 'sec-7',
        type: 'heading_2',
        content: 'III. BÀI TẬP VẬN DỤNG & LỜI GIẢI SƯ PHẠM CHI TIẾT',
      },
      {
        id: 'sec-8',
        type: 'exercise_solution',
        exercise: {
          problemNumber: 'Bài toán 1',
          category: 'Hình học không gian - Khoảng cách & Thể tích',
          problemStatement: 'Cho hình chóp tứ giác đều $S.ABCD$ có cạnh đáy bằng $a$, cạnh bên bằng $a\\sqrt{2}$. Hãy tính thể tích khối chóp $S.ABCD$ và khoảng cách từ tâm đáy $O$ đến mặt phẳng bên $(SCD)$.',
          steps: [
            {
              stepNumber: 1,
              title: 'Tính diện tích đáy hình vuông ABCD',
              explanation: 'Đáy $ABCD$ là hình vuông cạnh $a$, do đó diện tích đáy là: $$S_{ABCD} = a^2$$ Đường chéo đáy $AC = BD = a\\sqrt{2}$. Tâm $O$ là giao điểm hai đường chéo, suy ra: $$OC = \\frac{AC}{2} = \\frac{a\\sqrt{2}}{2}$$',
              formulaLatex: 'S_{ABCD} = a^2, \\quad OC = \\frac{a\\sqrt{2}}{2}',
            },
            {
              stepNumber: 2,
              title: 'Xác định chiều cao SO của hình chóp',
              explanation: 'Do $S.ABCD$ là hình chóp đều nên hình chiếu vuông góc của đỉnh $S$ xuống đáy trùng với tâm $O$, tức là $SO \\perp (ABCD)$. Tam giác $SOC$ vuông tại $O$, áp dụng định lý Pythagore: $$SO = \\sqrt{SC^2 - OC^2} = \\sqrt{(a\\sqrt{2})^2 - \\left(\\frac{a\\sqrt{2}}{2}\\right)^2} = \\sqrt{2a^2 - \\frac{a^2}{2}} = \\sqrt{\\frac{3a^2}{2}} = \\frac{a\\sqrt{6}}{2}$$',
              formulaLatex: 'SO = \\sqrt{SC^2 - OC^2} = \\frac{a\\sqrt{6}}{2}',
            },
            {
              stepNumber: 3,
              title: 'Tính thể tích khối chóp S.ABCD',
              explanation: 'Thể tích khối chóp $S.ABCD$ được tính theo công thức: $$V = \\frac{1}{3} \\cdot S_{ABCD} \\cdot SO = \\frac{1}{3} \\cdot a^2 \\cdot \\frac{a\\sqrt{6}}{2} = \\frac{a^3\\sqrt{6}}{6}$$',
              formulaLatex: 'V = \\frac{1}{3} S_{ABCD} \\cdot h = \\frac{a^3\\sqrt{6}}{6}',
            },
            {
              stepNumber: 4,
              title: 'Xác định khoảng cách d(O, (SCD))',
              explanation: 'Gọi $M$ là trung điểm cạnh $CD$. Vì $O$ là tâm hình vuông nên $OM \\perp CD$ và $OM = \\frac{a}{2}$. Trong mặt phẳng $(SOM)$, kẻ $OH \\perp SM$ tại $H$. Ta chứng minh được $OH \\perp (SCD)$, do đó khoảng cách $d(O, (SCD)) = OH$. Trong tam giác vuông $SOM$ tại $O$, đường cao $OH$: $$\\frac{1}{OH^2} = \\frac{1}{SO^2} + \\frac{1}{OM^2} = \\frac{1}{\\frac{6a^2}{4}} + \\frac{1}{\\frac{a^2}{4}} = \\frac{2}{3a^2} + \\frac{4}{a^2} = \\frac{14}{3a^2} \\implies OH = \\frac{a\\sqrt{42}}{14}$$',
              formulaLatex: 'OH = \\frac{SO \\cdot OM}{\\sqrt{SO^2 + OM^2}} = \\frac{a\\sqrt{42}}{14}',
            },
          ],
          pedagogicalCommentary: 'Định hướng tư duy sư phạm: Học sinh cần nắm vững 2 nguyên lý then chốt của bài toán hình học không gian này: (1) Nhận diện tính đối xứng của hình chóp đều: hình chiếu của đỉnh luôn rơi vào tâm đa giác đáy, giúp giải phóng hoàn toàn việc phỏng đoán chân đường cao. (2) Kỹ thuật dựng khoảng cách từ điểm chân đường vuông góc (điểm O): luôn tuân theo quy tắc "2 bước kẻ" (từ O kẻ vuông góc đến cạnh đáy CD tại M, nối SM rồi từ O kẻ OH vuông góc SM). Đây là mẫu khoảng cách chuẩn tắc giúp giải quyết 95% bài toán khoảng cách trong đề thi tốt nghiệp THPT.',
          commonMistakes: '1. Nhầm lẫn giữa cạnh bên ($SA = a\\sqrt{2}$) và cạnh đáy ($a$), dẫn tới áp dụng sai độ dài khi tính Pythagore.\n2. Quên chia 2 khi tính bán kính đáy $OC = AC/2$.\n3. Không chứng minh $OH \\perp (SCD)$ mà tự ý kết luận $d(O, (SCD)) = OM$ hoặc $SO$, dẫn đến mất điểm phần tự luận.',
          finalAnswer: 'V = \\frac{a^3\\sqrt{6}}{6} \\quad \\text{và} \\quad d(O, (SCD)) = \\frac{a\\sqrt{42}}{14}',
        },
      },
      {
        id: 'sec-9',
        type: 'callout',
        content: '📌 **Ghi nhớ của Thầy/Cô**: Khi gặp câu hỏi khoảng cách từ một điểm bất kỳ $A$ đến mặt bên, hãy luôn quy đổi khoảng cách từ $A$ về khoảng cách từ chân đường cao $O$ qua tỉ số khoảng cách: $\\frac{d(A, (P))}{d(O, (P))} = \\frac{IA}{IO}$ với $I = AO \\cap (P)$.',
      },
    ],
  },
  {
    id: 'doc-sample-scientific-report',
    title: 'Nghiên cứu Tối ưu hóa Thuật toán OCR & Nhận diện Công thức Toán học (LaTeX)',
    fileName: 'NghienCuu_OCR_Latex_Table_2026.pdf',
    fileSize: 2410800,
    createdAt: Date.now() - 3600000 * 48,
    updatedAt: Date.now() - 3600000 * 12,
    detectedLanguage: 'vi',
    summary: 'Báo cáo kỹ thuật đa ngôn ngữ đánh giá độ chính xác của mô hình OCR nhận diện văn bản quét tiếng Việt, bảng biểu phức tạp và công thức LaTeX với độ tin cậy > 99.4%.',
    isOfflineCached: true,
    metadata: {
      pageCountEstimate: 3,
      hasMath: true,
      hasTables: true,
      hasGeometry: false,
      hasExercises: true,
    },
    sections: [
      {
        id: 'sec-201',
        type: 'heading_1',
        content: '1. TỔNG QUAN HỆ THỐNG OCR & XỬ LÝ ĐA NGÔN NGỮ',
      },
      {
        id: 'sec-202',
        type: 'paragraph',
        content: 'Quá trình trích xuất văn bản từ tài liệu quét (scanned document) đòi hỏi khả năng bóc tách đa tầng: phân đoạn vùng ký tự, phục hồi các dấu thanh tiếng Việt (huyền, sắc, hỏi, ngã, nặng), giải mã ký hiệu toán học đặc biệt và bảo toàn cấu trúc bảng biểu phân cấp.',
      },
      {
        id: 'sec-203',
        type: 'table',
        tableData: {
          caption: 'So sánh hiệu năng nhận diện OCR giữa các bộ dữ liệu đa ngôn ngữ',
          headers: ['Ngôn ngữ & Dạng tài liệu', 'Số trang thử nghiệm', 'Độ chính xác ký tự (CER)', 'Độ chính xác bảng (TEDS)', 'Thời gian xử lý TB/trang'],
          rows: [
            ['Tiếng Việt có dấu (Sách giáo khoa)', '500', '99.42%', '98.15%', '1.2s'],
            ['Tài liệu quét mờ / Nghiêng 15°', '250', '98.70%', '96.30%', '1.8s'],
            ['Toán học & Công thức LaTeX', '320', '99.10%', '97.80%', '2.1s'],
            ['Tiếng Anh & Pháp hỗn hợp', '400', '99.85%', '99.10%', '0.9s'],
            ['Bảng biểu lồng ghép phức tạp', '180', '98.90%', '97.45%', '1.6s'],
          ],
        },
      },
      {
        id: 'sec-204',
        type: 'heading_2',
        content: '2. CÔNG THỨC TOÁN HỌC & ĐÁNH GIÁ ĐỘ LỆCH',
      },
      {
        id: 'sec-205',
        type: 'math_block',
        latex: '\\text{Loss}_{\\text{Total}} = \\alpha \\mathcal{L}_{\\text{text}} + \\beta \\sum_{i=1}^{K} \\left( \\int_{-\\infty}^{+\\infty} \\left| \\hat{y}_i(t) - y_i(t) \\right|^2 dt \\right)^{1/2} + \\gamma \\mathcal{L}_{\\text{LaTeX}}',
      },
      {
        id: 'sec-206',
        type: 'exercise_solution',
        exercise: {
          problemNumber: 'Bài tập thực nghiệm',
          category: 'Xác suất thống kê & Tối ưu hóa hàm số',
          problemStatement: 'Tìm giá trị cực tiểu của hàm mất mát $J(\\theta) = \\frac{1}{2m} \\sum_{i=1}^{m} (h_\\theta(x^{(i)}) - y^{(i)})^2 + \\frac{\\lambda}{2m} \\sum_{j=1}^{n} \\theta_j^2$ trong trường hợp hồi quy tuyến tính.',
          steps: [
            {
              stepNumber: 1,
              title: 'Tính đạo hàm riêng theo từng tham số theta',
              explanation: 'Áp dụng quy tắc đạo hàm hàm hợp đối với hàm mục tiêu $J(\\theta)$: $$\\frac{\\partial J}{\\partial \\theta_0} = \\frac{1}{m} \\sum_{i=1}^{m} (h_\\theta(x^{(i)}) - y^{(i)}) x_0^{(i)}$$ và với $j \\ge 1$: $$\\frac{\\partial J}{\\partial \\theta_j} = \\frac{1}{m} \\sum_{i=1}^{m} (h_\\theta(x^{(i)}) - y^{(i)}) x_j^{(i)} + \\frac{\\lambda}{m} \\theta_j$$',
              formulaLatex: '\\nabla_\\theta J(\\theta) = \\frac{1}{m} X^T(X\\theta - y) + \\frac{\\lambda}{m} \\begin{bmatrix} 0 \\\\ \\theta_{1..n} \\end{bmatrix}',
            },
            {
              stepNumber: 2,
              title: 'Giải phương trình đạo hàm bằng 0',
              explanation: 'Đặt đạo hàm ma trận bằng 0 và suy ra công thức nghiệm giải tích dạng đóng (Normal Equation): $$\\theta = \\left( X^T X + \\lambda L \\right)^{-1} X^T y$$ trong đó $L$ là ma trận đơn vị có phần tử đầu tiên $L_{0,0} = 0$.',
              formulaLatex: '\\theta = (X^T X + \\lambda L)^{-1} X^T y',
            },
          ],
          pedagogicalCommentary: 'Lời bình sư phạm: Cần giải thích cho người học tại sao lại cộng thêm thành phần $\\frac{\\lambda}{2m}\\theta_j^2$ (Regularization L2 / Ridge). Thành phần này ngăn ngừa hiện tượng Overfitting (quá khớp) và đảm bảo ma trận $(X^T X + \\lambda L)$ luôn khả nghịch (invertible) ngay cả khi số lượng đặc trưng $n$ lớn hơn số mẫu $m$.',
          commonMistakes: 'Sai lầm thường gặp là áp dụng hệ số phạt $\\lambda$ cho cả hệ số chặn $\\theta_0$ (bias term). Theo nguyên lý chuẩn mực, $\\theta_0$ không bị phạt độ lớn.',
          finalAnswer: '\\theta = (X^T X + \\lambda L)^{-1} X^T y',
        },
      },
    ],
  },
];
