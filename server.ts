import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limits for PDF / image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy get Google GenAI client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Danh sách các mô hình ứng cử viên theo thứ tự ưu tiên
// gemini-3.8-flash là mô hình chính theo chuẩn; gemini-3.1-flash-lite là dự phòng tốc độ cao và cực kỳ ổn định
const FALLBACK_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
];

/**
 * Kiểm tra xem lỗi có phải do mô hình đang quá tải (503 Service Unavailable / High Demand)
 */
function isHighDemandError(error: any): boolean {
  if (!error) return false;
  const str = (
    (typeof error === "string" ? error : "") +
    (error.message || "") +
    (error.status || "") +
    (error.code || "") +
    (error?.error?.message || "") +
    (error?.error?.status || "") +
    JSON.stringify(error)
  ).toLowerCase();

  return (
    str.includes("503") ||
    str.includes("unavailable") ||
    str.includes("high demand") ||
    str.includes("spikes in demand") ||
    str.includes("overloaded")
  );
}

/**
 * Kiểm tra xem lỗi có phải lỗi mạng tạm thời (connection reset, timeout, rate limit 429)
 */
function isTransientError(error: any): boolean {
  if (!error) return false;
  if (isHighDemandError(error)) return true;
  const str = (
    (typeof error === "string" ? error : "") +
    (error.message || "") +
    (error.status || "") +
    (error.code || "") +
    (error?.error?.message || "") +
    (error?.error?.status || "") +
    JSON.stringify(error)
  ).toLowerCase();

  return (
    str.includes("429") ||
    str.includes("resource_exhausted") ||
    str.includes("rate limit") ||
    str.includes("quota") ||
    str.includes("temporarily") ||
    str.includes("econnreset") ||
    str.includes("etimedout")
  );
}

/**
 * Chuẩn hóa thông báo lỗi thân thiện với người dùng
 */
function formatErrorMessage(error: any): string {
  if (!error) return "Đã xảy ra lỗi không xác định.";
  let msg = error.message || (typeof error === "string" ? error : JSON.stringify(error));

  try {
    const trimmed = msg.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const parsed = JSON.parse(trimmed);
      if (parsed.error?.message) {
        msg = parsed.error.message;
      }
    }
  } catch {
    // ignore json parse error
  }

  if (
    msg.includes("503") ||
    msg.includes("high demand") ||
    msg.includes("spikes in demand") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("overloaded")
  ) {
    return "Mô hình AI đang có lượng truy cập cao đột xuất (503 High Demand). Vui lòng thử lại sau vài giây.";
  }

  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
    return "Đã đạt giới hạn tần suất yêu cầu AI (429 Rate Limit). Vui lòng đợi vài giây rồi bấm 'Thử lại'.";
  }

  return msg;
}

/**
 * Gọi AI với cơ chế Exponential Backoff Retry và tự động chuyển đổi mô hình dự phòng khi gặp lỗi 503 / quá tải
 */
async function generateContentWithFallback(
  ai: GoogleGenAI,
  requestParams: {
    contents: any;
    config?: any;
  },
  models: string[] = FALLBACK_MODELS
) {
  let lastError: any = null;

  for (let mIdx = 0; mIdx < models.length; mIdx++) {
    const currentModel = models[mIdx];
    const isLastModel = mIdx === models.length - 1;
    // Nếu là lỗi 503 high demand và còn model dự phòng khác, không cần retry lặp lại trên model đang quá tải
    const maxRetries = 1;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Gemini] Gửi yêu cầu tới mô hình "${currentModel}" (lần thử ${attempt + 1})...`);
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: requestParams.contents,
          config: requestParams.config,
        });

        console.log(`[Gemini] Hoàn tất thành công với mô hình "${currentModel}"!`);
        return { response, modelUsed: currentModel };
      } catch (err: any) {
        lastError = err;
        const isHighDemand = isHighDemandError(err);
        const transient = isTransientError(err);

        // Nếu mô hình hiện tại báo 503 High Demand và còn mô hình dự phòng kế tiếp:
        // Chuyển ngay lập tức sang mô hình dự phòng mà không mất thời gian thử lại trên mô hình đang nghẽn
        if (isHighDemand && !isLastModel) {
          const nextModel = models[mIdx + 1];
          console.log(`[Gemini] Mô hình "${currentModel}" đang có lượng truy cập cao (503). Tự động chuyển tiếp sang mô hình dự phòng "${nextModel}"...`);
          break; // Thoát vòng lặp attempt để chuyển model kế tiếp ngay lập tức
        }

        // Nếu là lỗi mạng tạm thời khác và chưa hết lượt thử: chờ một chút rồi thử lại
        if (transient && attempt < maxRetries) {
          const delay = 800 + Math.floor(Math.random() * 300);
          console.log(`[Gemini] Đợi ${delay}ms trước khi thử lại...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        // Nếu còn mô hình dự phòng tiếp theo
        if (transient && !isLastModel) {
          const nextModel = models[mIdx + 1];
          console.log(`[Gemini] Chuyển tiếp sang mô hình dự phòng "${nextModel}"...`);
          break;
        }

        // Nếu lỗi không phải tạm thời
        if (!transient) {
          throw err;
        }
      }
    }
  }

  throw lastError;
}

/**
 * Trích xuất chuỗi JSON sạch từ kết quả phản hồi của mô hình
 */
function extractJsonFromResponse(rawText: string): any {
  if (!rawText || !rawText.trim()) {
    throw new Error("Mô hình không trả về dữ liệu nội dung.");
  }

  const trimmed = rawText.trim();
  // 1. Thử parse trực tiếp
  try {
    return JSON.parse(trimmed);
  } catch {
    // 2. Thử tách khối code markdown ```json ... ``` hoặc ``` ... ```
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch {
        // Tiếp tục thử xử lý sâu hơn bên dưới
      }
    }

    // 3. Thử tìm cặp ngoặc { ... } lớn nhất
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = trimmed.substring(firstBrace, lastBrace + 1);
      return JSON.parse(candidate);
    }

    throw new Error("Không thể phân tích dữ liệu JSON trả về từ mô hình AI.");
  }
}

// 1. Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// 2. Main PDF / Document conversion endpoint
app.post("/api/convert", async (req, res) => {
  try {
    const {
      fileBase64,
      mimeType = "application/pdf",
      fileName = "Document.pdf",
      language = "auto",
      includeMathSolutions = true,
      preserveFormatting = true,
      vectorGeometry = true,
      fullContentPreservation = true,
    } = req.body;

    if (!fileBase64) {
      return res.status(400).json({ error: "Dữ liệu tệp không hợp lệ (fileBase64 is required)." });
    }

    // Strip prefix if user passed full data URI e.g. "data:application/pdf;base64,..."
    const cleanBase64 = fileBase64.includes(",")
      ? fileBase64.split(",")[1]
      : fileBase64;

    const ai = getGenAI();

    const prompt = `
Bạn là chuyên gia chuyển đổi văn bản và số hóa tài liệu học thuật hàng đầu thế giới (OCR, LaTeX, Math & Geometry Document Conversion Engine).
Tệp đính kèm: "${fileName}" (Định dạng: ${mimeType}).
Ngôn ngữ: ${language === "auto" ? "Tự động phát hiện và giữ nguyên ngôn ngữ gốc (ưu tiên tiếng Việt có dấu đầy đủ 100%)" : language}.

======================================================================
*** NGUYÊN TẮC CỐT LÕI BẮT BUỘC - BẢO TOÀN NGUYÊN VĂN & ĐẦY ĐỦ 100% ***
======================================================================
1. GIỮ NGUYÊN NỘI DUNG VĂN BẢN (100% VERBATIM EXTRACTION):
   - Tuyệt đối KHÔNG ĐƯỢC TỰ Ý TÓM TẮT, KHÔNG CẮT XÉN, KHÔNG BIÊN TẬP LẠI LỜI VĂN, KHÔNG RÚT GỌN VĂN BẢN.
   - Giữ nguyên toàn bộ từ ngữ, cách hành văn, câu cú, dấu câu, trích dẫn, các điều khoản, định nghĩa, chú thích chân trang.
   - Tuyệt đối KHÔNG ĐƯỢC DÙNG dấu chấm lửng "..." hoặc các câu như "(tiếp tục tương tự...)" để lược bớt nội dung. Mọi đoạn văn trong tệp gốc đều phải được chuyển đổi đầy đủ.

2. CHUYỂN ĐẦY ĐỦ NỘI DUNG KHÔNG BỎ SÓT BẤT KỲ MỤC NÀO (ZERO-OMISSION POLICY):
   - Chuyển đổi toàn bộ tài liệu từ đầu trang 1 đến trang cuối cùng theo đúng trình tự đọc tự nhiên.
   - Toàn bộ tiêu đề lớn/nhỏ (Heading 1, Heading 2, Heading 3), các phần mở đầu, lời nói đầu, mục lục, nội dung chính, phần kết luận.
   - Toàn bộ danh sách: mọi mục gạch đầu dòng (bullet_list), mọi mục đánh số (numbered_list).
   - Toàn bộ bảng biểu (table): trích xuất 100% tiêu đề cột (headers) và TẤT CẢ các dòng dữ liệu (rows), mọi ô, số liệu, văn bản hoặc công thức trong ô. Không được bỏ qua hàng nào.
   - Với đề kiểm tra / đề thi / bài tập:
     + Trích xuất ĐẦY ĐỦ 100% TẤT CẢ CÁC BÀI TẬP, CÂU HỎI (Câu 1, Câu 2, ..., Câu n) không bỏ sót câu nào.
     + Với câu hỏi trắc nghiệm: BẮT BUỘC giữ nguyên câu hỏi và TOÀN BỘ 4 ĐÁP ÁN A, B, C, D (kể cả bảng đáp án nếu có).
     + Với câu hỏi tự luận: Giữ nguyên câu hỏi chính và mọi ý con (a, b, c, d,...).
     ${includeMathSolutions ? `+ Kèm theo: cung cấp lời giải chi tiết cho từng bài tập, phân tích từng bước, lời bình tư duy sư phạm và các bẫy thường gặp.` : ""}

3. CÔNG THỨC TOÁN HỌC & LATEX CHUẨN XÁC:
   - Mọi công thức toán, ký hiệu, biểu thức trong văn bản phải được chuyển thành LaTeX chuẩn xác 100%:
     * Công thức nội dòng kẹp giữa $...$, ví dụ $f(x) = ax^2 + bx + c$, $\\vec{u} \\cdot \\vec{v}$, $\\triangle ABC$.
     * Công thức hiển thị độc lập nằm trong type 'math_block' hoặc kẹp giữa $$...$$, ví dụ $$\\int_{0}^{1} x e^x dx$$.
   - Giữ nguyên vẹn các chỉ số trên, chỉ số dưới, ký hiệu hình học, căn thức, ma trận, hệ phương trình.

4. HÌNH HỌC VECTOR (SVG):
   ${vectorGeometry ? `- Với mọi hình vẽ hình học (hình chóp, lăng trụ, tam giác, đường tròn, đồ thị hàm số, hệ trục tọa độ):
     + Mô tả chính xác và tạo mã SVG vector hoàn chỉnh sắc nét (viewBox, stroke, fill, text các điểm A, B, C, đường nét đứt, góc, số đo).` : `- Giữ lại phần mô tả chi tiết của hình học.`}

5. ĐỊNH DẠNG VĂN BẢN VÀ DẤU TIẾNG VIỆT:
   - Bảo toàn 100% dấu tiếng Việt, không lỗi font, không mất ký tự.
   - Giữ nguyên các định dạng in đậm (**...**), in nghiêng (*...*).

CẤU TRÚC JSON TRẢ VỀ DUY NHẤT (không thêm chữ nào ngoài JSON hợp lệ):
{
  "title": "Tiêu đề đầy đủ của tài liệu",
  "detectedLanguage": "vi",
  "summary": "Tóm tắt tổng quan về tài liệu",
  "metadata": {
    "pageCountEstimate": 1,
    "hasMath": true,
    "hasTables": true,
    "hasGeometry": true,
    "hasExercises": true,
    "isVerbatimFullExtraction": true
  },
  "sections": [
    {
      "id": "sec-1",
      "type": "heading_1 | heading_2 | heading_3 | paragraph | bullet_list | numbered_list | table | math_block | geometry_diagram | exercise_solution | callout",
      "content": "Nội dung đầy đủ nguyên văn (giữ nguyên từng chữ, hỗ trợ **in đậm**, *in nghiêng*, $công thức latex$)",
      "latex": "Chuỗi LaTeX đầy đủ nếu là math_block",
      "tableData": {
        "caption": "Tiêu đề bảng (nếu có)",
        "headers": ["Cột 1", "Cột 2", "..."],
        "rows": [
          ["Dòng 1 Ô 1", "Dòng 1 Ô 2", "..."],
          ["Dòng 2 Ô 1", "Dòng 2 Ô 2", "..."]
        ]
      },
      "geometry": {
        "title": "Tên hình học",
        "description": "Mô tả hình học toán học",
        "svgCode": "<svg viewBox='0 0 400 300' xmlns='http://www.w3.org/2000/svg'>...</svg>"
      },
      "exercise": {
        "problemNumber": "Bài 1",
        "category": "Hình học không gian / Đại số / Giải tích",
        "problemStatement": "Toàn bộ đề bài nguyên văn không bỏ sót chữ nào (gồm các ý a, b, c và các lựa chọn A, B, C, D nếu là trắc nghiệm)...",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Tên bước giải",
            "explanation": "Chi tiết bước giải...",
            "formulaLatex": "\\vec{a} \\cdot \\vec{b} = 0"
          }
        ],
        "pedagogicalCommentary": "Lời bình sư phạm, phân tích phương pháp tư duy...",
        "commonMistakes": "Các lỗi sai học sinh thường mắc phải...",
        "finalAnswer": "Kết luận hoặc đáp số cuối cùng"
      }
    }
  ]
}
`;

    const { response, modelUsed } = await generateContentWithFallback(ai, {
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 65536,
      },
    });

    const rawText = response.text || "{}";
    const parsedData = extractJsonFromResponse(rawText);

    // Đảm bảo gắn cờ bảo toàn nguyên văn vào metadata nếu chưa có
    if (parsedData && parsedData.metadata) {
      parsedData.metadata.isVerbatimFullExtraction = true;
    }

    res.json({
      success: true,
      data: parsedData,
      modelUsed,
    });
  } catch (error: any) {
    console.error("Lỗi khi chuyển đổi PDF:", error);
    const friendlyError = formatErrorMessage(error);
    res.status(500).json({
      success: false,
      error: friendlyError,
    });
  }
});

// 3. Dedicated endpoint: Solve or explain a specific math exercise with commentary
app.post("/api/solve-math", async (req, res) => {
  try {
    const { problemText, category = "Toán học tổng quát", language = "vi" } = req.body;

    if (!problemText || !problemText.trim()) {
      return res.status(400).json({ error: "Nội dung bài toán không được để trống." });
    }

    const ai = getGenAI();

    const prompt = `
Bạn là một giảng viên sư phạm Toán xuất sắc. Hãy giải bài toán sau đây với phong cách sư phạm đỉnh cao:
Đề bài: "${problemText}"
Lĩnh vực: ${category}
Ngôn ngữ: ${language}

Yêu cầu chi tiết:
1. Trình bày lời giải rõ ràng từng bước (step-by-step), giải thích tường tận căn cứ lý thuyết, công thức sử dụng (dưới dạng LaTeX chuẩn $...$ và $$...$$).
2. "Lời bình sư phạm & Định hướng tư duy" (Pedagogical Commentary):
   - Vì sao lại chọn hướng đi này thay vì các cách khác?
   - Nhận diện chìa khóa/dấu hiệu nhận biết của dạng bài.
   - Bản chất toán học sâu xa.
3. "Lưu ý & Sai lầm thường gặp" (Common Pitfalls):
   - Điểm học sinh hay nhầm lẫn (điều kiện xác định, dấu bằng xảy ra, nghiệm ngoại lai, chia cho 0,...).
4. Nếu bài toán có yếu tố hình học hoặc đồ thị, hãy tạo kèm mã SVG minh họa trực quan sắc nét.
5. Đáp số cuối cùng ngắn gọn, chuẩn xác.

Trả về DUY NHẤT một chuỗi JSON theo cấu trúc:
{
  "problemStatement": "${problemText.replace(/"/g, '\\"')}",
  "category": "${category}",
  "steps": [
    {
      "stepNumber": 1,
      "title": "Tiêu đề bước",
      "explanation": "Giải thích chi tiết...",
      "formulaLatex": "công thức LaTeX nếu có"
    }
  ],
  "pedagogicalCommentary": "Lời bình sư phạm và phân tích phương pháp...",
  "commonMistakes": "Các sai lầm cần tránh...",
  "finalAnswer": "Kết quả cuối cùng",
  "svgIllustration": "<svg ...>...</svg> (nếu bài toán có hình học/đồ thị, hoặc null)"
}
`;

    const { response, modelUsed } = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 16384,
      },
    });

    const rawText = response.text || "{}";
    const solutionData = extractJsonFromResponse(rawText);

    // Đảm bảo bảo toàn nguyên vẹn 100% đề bài ban đầu của người dùng
    if (solutionData && (!solutionData.problemStatement || solutionData.problemStatement.trim().length === 0)) {
      solutionData.problemStatement = problemText;
    }

    res.json({
      success: true,
      data: solutionData,
      modelUsed,
    });
  } catch (error: any) {
    console.error("Lỗi khi giải bài tập toán:", error);
    const friendlyError = formatErrorMessage(error);
    res.status(500).json({
      success: false,
      error: friendlyError,
    });
  }
});

// 4. Vite middleware configuration for development & static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
