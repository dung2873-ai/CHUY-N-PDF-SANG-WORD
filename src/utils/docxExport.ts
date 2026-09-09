import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  Footer,
  PageNumber,
  ImageRun,
} from 'docx';
import { ConvertedDocument, DocumentSection, WordExportSettings } from '../types';

/**
 * Utility to convert SVG string to a PNG Uint8Array for embedding into Word document
 */
async function svgToPngBuffer(svgString: string, width = 600, height = 400): Promise<Uint8Array | null> {
  if (typeof window === 'undefined') return null;
  return new Promise((resolve) => {
    try {
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(null);
          return;
        }

        // Clean white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);

        canvas.toBlob((pngBlob) => {
          if (!pngBlob) {
            resolve(null);
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result instanceof ArrayBuffer) {
              resolve(new Uint8Array(reader.result));
            } else {
              resolve(null);
            }
          };
          reader.readAsArrayBuffer(pngBlob);
        }, 'image/png');
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Đảm bảo công thức toán học luôn nằm giữa cặp dấu $...$ (hoặc $$...$$ theo tùy chọn).
 * Giúp người dùng khi mở file trong Microsoft Word có thể chuyển đổi trực tiếp
 * sang Word Equation (Alt + =) hoặc sử dụng MathType (Toggle TeX) cực kỳ thuận tiện.
 */
export function ensureDollarWrapped(
  latex: any,
  delimiter: 'single_dollar' | 'double_dollar' | 'none' = 'single_dollar'
): string {
  if (latex === null || latex === undefined) return '';
  const str = typeof latex === 'string' ? latex : String(latex);
  const trimmed = str.trim();
  if (!trimmed) return '';

  // Bóc tách phần ruột công thức, loại bỏ cặp $ hoặc $$ bên ngoài nếu đã có
  let core = trimmed;
  if (core.startsWith('$$') && core.endsWith('$$') && core.length >= 4) {
    core = core.slice(2, -2).trim();
  } else if (core.startsWith('$') && core.endsWith('$') && core.length >= 2) {
    core = core.slice(1, -1).trim();
  }

  if (delimiter === 'none') {
    return core;
  }
  if (delimiter === 'double_dollar') {
    return `$$${core}$$`;
  }
  // Mặc định và chuẩn yêu cầu người dùng: nằm giữa cặp dấu $...$
  return `$${core}$`;
}

/**
 * Parses markdown inline bold (**text**), italic (*text*), and math ($...$, $$...$$) into TextRuns.
 * Giữ nguyên cặp dấu $...$ cho công thức toán để tương thích tốt nhất với Word & MathType.
 */
export function parseInlineFormatting(
  text: any,
  settings?: Partial<WordExportSettings>
): TextRun[] {
  if (text === null || text === undefined) return [new TextRun('')];
  const safeText = typeof text === 'string' ? text : String(text);
  if (!safeText) return [new TextRun('')];

  const delimiter = settings?.mathDelimiter || 'single_dollar';
  const mathFont = settings?.mathFont || 'Cambria Math';
  const runs: TextRun[] = [];

  // Match $$display math$$, $inline math$, **bold**, *italic*
  const regex = /(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$|\*\*[^*]+?\*\*|\*[^*]+?\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(safeText)) !== null) {
    // Leading plain text
    if (match.index > lastIndex) {
      runs.push(
        new TextRun({
          text: safeText.substring(lastIndex, match.index),
          font: 'Times New Roman',
          size: 24, // 12pt in half-points
        })
      );
    }

    const token = match[0];
    if (token.startsWith('$$') && token.endsWith('$$')) {
      const core = token.slice(2, -2).trim();
      const formattedMath = ensureDollarWrapped(core, delimiter);
      runs.push(
        new TextRun({
          text: ` ${formattedMath} `,
          font: mathFont,
          italics: true,
          color: '1E3A8A',
          size: 24,
        })
      );
    } else if (token.startsWith('$') && token.endsWith('$')) {
      const core = token.slice(1, -1).trim();
      const formattedMath = ensureDollarWrapped(core, delimiter);
      runs.push(
        new TextRun({
          text: ` ${formattedMath} `,
          font: mathFont,
          italics: true,
          color: '1E3A8A',
          size: 24,
        })
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      runs.push(
        new TextRun({
          text: token.slice(2, -2),
          bold: true,
          font: 'Times New Roman',
          size: 24,
        })
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      runs.push(
        new TextRun({
          text: token.slice(1, -1),
          italics: true,
          font: 'Times New Roman',
          size: 24,
        })
      );
    }

    lastIndex = regex.lastIndex;
  }

  // Trailing text
  if (lastIndex < text.length) {
    runs.push(
      new TextRun({
        text: text.substring(lastIndex),
        font: 'Times New Roman',
        size: 24,
      })
    );
  }

  return runs.length > 0 ? runs : [new TextRun(text)];
}

export async function exportToWordDocx(
  docData: ConvertedDocument,
  options?: Partial<WordExportSettings>
): Promise<Blob> {
  const exportSettings: WordExportSettings = {
    mathDelimiter: options?.mathDelimiter || 'single_dollar',
    mathFont: options?.mathFont || 'Cambria Math',
    includeGeometryImages: options?.includeGeometryImages ?? true,
    autoWrapLatexKeywords: options?.autoWrapLatexKeywords ?? true,
  };

  const docElements: any[] = [];

  // 1. Document Title
  docElements.push(
    new Paragraph({
      text: docData.title || 'Tài liệu chuyển đổi PDF sang Word',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
    })
  );

  // Metadata & Summary if available
  if (docData.summary) {
    docElements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Tóm lược tài liệu: ',
            bold: true,
            italics: true,
            color: '475569',
            font: 'Times New Roman',
            size: 22,
          }),
          new TextRun({
            text: docData.summary,
            italics: true,
            color: '64748B',
            font: 'Times New Roman',
            size: 22,
          }),
        ],
        spacing: { after: 300 },
      })
    );
  }

  // 2. Iterate sections
  for (const section of docData.sections) {
    switch (section.type) {
      case 'heading_1':
        docElements.push(
          new Paragraph({
            children: parseInlineFormatting(section.content || '', exportSettings),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 120 },
          })
        );
        break;

      case 'heading_2':
        docElements.push(
          new Paragraph({
            children: parseInlineFormatting(section.content || '', exportSettings),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 100 },
          })
        );
        break;

      case 'heading_3':
        docElements.push(
          new Paragraph({
            children: parseInlineFormatting(section.content || '', exportSettings),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 180, after: 80 },
          })
        );
        break;

      case 'paragraph':
        docElements.push(
          new Paragraph({
            children: parseInlineFormatting(section.content || '', exportSettings),
            spacing: { after: 140, line: 360 }, // 1.5 line spacing
          })
        );
        break;

      case 'bullet_list':
        docElements.push(
          new Paragraph({
            children: parseInlineFormatting(section.content || '', exportSettings),
            bullet: { level: 0 },
            spacing: { after: 80 },
          })
        );
        break;

      case 'numbered_list':
        docElements.push(
          new Paragraph({
            children: parseInlineFormatting(section.content || '', exportSettings),
            spacing: { after: 80 },
          })
        );
        break;

      case 'math_block': {
        // Công thức toán học độc lập: bao bọc giữa cặp dấu $...$ (hoặc $$...$$)
        const rawFormula = section.latex || section.content || '';
        const formulaWithDollars = ensureDollarWrapped(rawFormula, exportSettings.mathDelimiter);

        docElements.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: formulaWithDollars,
                            font: exportSettings.mathFont,
                            italics: true,
                            size: 26, // 13pt
                            color: '1E3A8A',
                          }),
                        ],
                      }),
                    ],
                    shading: {
                      fill: 'F8FAFC',
                      type: ShadingType.CLEAR,
                    },
                    margins: { top: 160, bottom: 160, left: 200, right: 200 },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                      left: { style: BorderStyle.SINGLE, size: 4, color: '2563EB' },
                      right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                    },
                  }),
                ],
              }),
            ],
          })
        );
        docElements.push(new Paragraph({ spacing: { after: 120 } }));
        break;
      }

      case 'table':
        if (section.tableData && section.tableData.rows.length > 0) {
          const tableRows: TableRow[] = [];

          // Header Row
          if (section.tableData.headers && section.tableData.headers.length > 0) {
            tableRows.push(
              new TableRow({
                tableHeader: true,
                children: section.tableData.headers.map(
                  (headerText) =>
                    new TableCell({
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: parseInlineFormatting(headerText, exportSettings),
                        }),
                      ],
                      shading: {
                        fill: 'E2E8F0',
                        type: ShadingType.CLEAR,
                      },
                      margins: { top: 120, bottom: 120, left: 140, right: 140 },
                    })
                ),
              })
            );
          }

          // Data Rows
          section.tableData.rows.forEach((row, rowIndex) => {
            tableRows.push(
              new TableRow({
                children: row.map(
                  (cellText) =>
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: parseInlineFormatting(cellText, exportSettings),
                        }),
                      ],
                      shading: {
                        fill: rowIndex % 2 === 1 ? 'F8FAFC' : 'FFFFFF',
                        type: ShadingType.CLEAR,
                      },
                      margins: { top: 100, bottom: 100, left: 120, right: 120 },
                    })
                ),
              })
            );
          });

          // Caption if present
          if (section.tableData.caption) {
            docElements.push(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `Bảng: ${section.tableData.caption}`,
                    bold: true,
                    italics: true,
                    font: 'Times New Roman',
                    size: 22,
                  }),
                ],
                spacing: { before: 100, after: 60 },
              })
            );
          }

          docElements.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: tableRows,
            })
          );
          docElements.push(new Paragraph({ spacing: { after: 160 } }));
        }
        break;

      case 'geometry_diagram':
        if (exportSettings.includeGeometryImages && section.geometry?.svgCode) {
          const pngBuffer = await svgToPngBuffer(section.geometry.svgCode, 640, 420);

          docElements.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `Hình học: ${section.geometry.title || 'Mô hình hình học'}` ,
                  bold: true,
                  color: '1E40AF',
                  font: 'Times New Roman',
                  size: 24,
                }),
              ],
              spacing: { before: 180, after: 100 },
            })
          );

          if (pngBuffer) {
            docElements.push(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new ImageRun({
                    data: pngBuffer,
                    transformation: {
                      width: 480,
                      height: 315,
                    },
                    type: 'png',
                  }),
                ],
                spacing: { after: 100 },
              })
            );
          }

          if (section.geometry.description) {
            docElements.push(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: section.geometry.description,
                    italics: true,
                    font: 'Times New Roman',
                    size: 20,
                    color: '64748B',
                  }),
                ],
                spacing: { after: 180 },
              })
            );
          }
        }
        break;

      case 'exercise_solution':
        if (section.exercise) {
          const ex = section.exercise;
          const exParagraphs: Paragraph[] = [];

          // Header
          exParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${ex.problemNumber || 'Bài toán'}: ${ex.category || 'Toán học'}`,
                  bold: true,
                  font: 'Times New Roman',
                  size: 26,
                  color: '1E3A8A',
                }),
              ],
              spacing: { after: 100 },
            })
          );

          // Problem Statement
          exParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Đề bài: ', bold: true, font: 'Times New Roman', size: 24 }),
                ...parseInlineFormatting(ex.problemStatement, exportSettings),
              ],
              spacing: { after: 140 },
            })
          );

          // Step by step
          exParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Lời giải chi tiết từng bước:', bold: true, font: 'Times New Roman', size: 24, color: '0F766E' }),
              ],
              spacing: { before: 80, after: 60 },
            })
          );

          for (const step of ex.steps) {
            exParagraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Bước ${step.stepNumber} - ${step.title}: `,
                    bold: true,
                    font: 'Times New Roman',
                    size: 22,
                  }),
                  ...parseInlineFormatting(step.explanation, exportSettings),
                ],
                bullet: { level: 0 },
                spacing: { after: 60 },
              })
            );

            if (step.formulaLatex) {
              const formattedFormula = ensureDollarWrapped(step.formulaLatex, exportSettings.mathDelimiter);
              exParagraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `   ${formattedFormula}`,
                      font: exportSettings.mathFont,
                      italics: true,
                      size: 22,
                      color: '2563EB',
                    }),
                  ],
                  spacing: { after: 80 },
                })
              );
            }
          }

          // Pedagogical Commentary
          if (ex.pedagogicalCommentary) {
            exParagraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Lời bình sư phạm & Định hướng tư duy: ',
                    bold: true,
                    font: 'Times New Roman',
                    size: 22,
                    color: 'B45309', // Amber
                  }),
                  ...parseInlineFormatting(ex.pedagogicalCommentary, exportSettings),
                ],
                spacing: { before: 100, after: 80 },
              })
            );
          }

          // Common mistakes
          if (ex.commonMistakes) {
            exParagraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Lưu ý & Sai lầm thường gặp: ',
                    bold: true,
                    font: 'Times New Roman',
                    size: 22,
                    color: 'BE123C', // Rose
                  }),
                  ...parseInlineFormatting(ex.commonMistakes, exportSettings),
                ],
                spacing: { after: 80 },
              })
            );
          }

          // Final Answer
          if (ex.finalAnswer) {
            const formattedAnswer = ensureDollarWrapped(ex.finalAnswer, exportSettings.mathDelimiter);
            exParagraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Đáp số / Kết luận: ',
                    bold: true,
                    font: 'Times New Roman',
                    size: 24,
                    color: '15803D', // Emerald
                  }),
                  new TextRun({
                    text: formattedAnswer,
                    bold: true,
                    font: exportSettings.mathFont,
                    size: 24,
                    color: '15803D',
                  }),
                ],
                spacing: { before: 80, after: 120 },
              })
            );
          }

          // Wrap into an elegant callout table
          docElements.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: exParagraphs,
                      shading: {
                        fill: 'F0FDF4', // Subtle emerald tint
                        type: ShadingType.CLEAR,
                      },
                      margins: { top: 160, bottom: 160, left: 200, right: 200 },
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1, color: 'BBF7D0' },
                        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'BBF7D0' },
                        left: { style: BorderStyle.SINGLE, size: 6, color: '10B981' },
                        right: { style: BorderStyle.SINGLE, size: 1, color: 'BBF7D0' },
                      },
                    }),
                  ],
                }),
              ],
            })
          );
          docElements.push(new Paragraph({ spacing: { after: 160 } }));
        }
        break;

      case 'callout':
        docElements.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: parseInlineFormatting(section.content || '', exportSettings),
                      }),
                    ],
                    shading: {
                      fill: 'FEF3C7', // Amber tint
                      type: ShadingType.CLEAR,
                    },
                    margins: { top: 120, bottom: 120, left: 160, right: 160 },
                    borders: {
                      left: { style: BorderStyle.SINGLE, size: 4, color: 'D97706' },
                      top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                      bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                      right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                    },
                  }),
                ],
              }),
            ],
          })
        );
        docElements.push(new Paragraph({ spacing: { after: 120 } }));
        break;
    }
  }

  // 3. Assemble document with styles and footer
  const doc = new Document({
    creator: 'PDF to Word Converter & Math Studio',
    title: docData.title,
    description: docData.summary,
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch = 1440 twips
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${docData.title} | Trang `,
                    font: 'Times New Roman',
                    size: 18,
                    color: '94A3B8',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: 'Times New Roman',
                    size: 18,
                    color: '94A3B8',
                  }),
                  new TextRun({
                    text: ' / ',
                    font: 'Times New Roman',
                    size: 18,
                    color: '94A3B8',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: 'Times New Roman',
                    size: 18,
                    color: '94A3B8',
                  }),
                ],
              }),
            ],
          }),
        },
        children: docElements,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Triggers browser download of the generated docx blob
 */
export function downloadDocxBlob(blob: Blob, fileName: string) {
  const cleanName = fileName.endsWith('.docx') ? fileName : `${fileName.replace(/\.[^/.]+$/, '')}.docx`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = cleanName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
