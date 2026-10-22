import type { Question } from "@/types";
import { QUESTION_LIMITS } from "./validation";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"].slice(0, QUESTION_LIMITS.maxOptions);

/** Characters Windows does not allow in file names. */
const safeFileName = (name: string) => name.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim() || "sorular";

/**
 * Downloads the questions as .xlsx in the import template's layout
 * (Soru, A–F, Doğru Cevap, Açıklama), so the file can be imported again as is.
 */
export async function downloadQuestionsXlsx(poolName: string, questions: Question[]) {
  // Loaded on demand: only the admin panel needs the Excel writer.
  const { default: writeXlsxFile } = await import("write-excel-file/browser");

  // As many option columns as the longest question needs, but at least the default 4.
  const optionCount = Math.max(QUESTION_LIMITS.defaultOptionCount, ...questions.map((q) => q.options.length));
  const letters = OPTION_LETTERS.slice(0, optionCount);
  const header = ["Soru", ...letters, "Doğru Cevap", "Açıklama"].map((value) => ({
    value,
    fontWeight: "bold" as const,
    backgroundColor: "#F5B83D",
  }));
  const rows = questions.map((q) => [
    { value: q.text, wrap: true },
    ...letters.map((_, i) => ({ value: q.options[i] ?? "", wrap: true })),
    { value: OPTION_LETTERS[q.correctIndex], align: "center" as const },
    { value: q.explanation ?? "", wrap: true },
  ]);

  await writeXlsxFile([header, ...rows], {
    sheet: "Sorular",
    stickyRowsCount: 1,
    columns: [{ width: 60 }, ...letters.map(() => ({ width: 24 })), { width: 13 }, { width: 50 }],
  }).toFile(`${safeFileName(poolName)}.xlsx`);
}
