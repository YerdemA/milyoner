import type { QuestionInput } from "@/types";
import { QUESTION_LIMITS, normalizeQuestionInput, validateQuestionInput } from "./validation";

// Column headers of the import template (public/sablon/soru-sablonu.xlsx).
// Matching is case-insensitive and ignores spaces, so "Doğru cevap" or "DOGRU CEVAP" also work.
const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"].slice(0, QUESTION_LIMITS.maxOptions);
const HEADER_ALIASES: Record<string, string[]> = {
  text: ["soru", "sorumetni"],
  // Uppercase ASCII headers lowercase to dotless "ı" in Turkish ("ACIKLAMA" -> "acıklama").
  correct: ["doğrucevap", "dogrucevap", "cevap", "doğruşık", "dogrusik", "dogrusık"],
  explanation: ["açıklama", "aciklama", "acıklama", "bilginotu"],
};

export const MAX_IMPORT_ROWS = 1000;
export const TEMPLATE_URL = "/sablon/soru-sablonu.xlsx";

type Cell = string | number | boolean | Date | object | null | undefined;

export type ImportRowError = { row: number; messages: string[] };
export type ImportDuplicate = { row: number; text: string };
export type ImportPreview = {
  /** Questions ready to save (poolId is filled in by the caller). */
  valid: (Omit<QuestionInput, "poolId"> & { row: number })[];
  errors: ImportRowError[];
  duplicates: ImportDuplicate[];
};

const normalizeHeader = (value: Cell) => cellToText(value).toLocaleLowerCase("tr").replace(/\s+/g, "");

/** Used to detect questions that already exist: case- and whitespace-insensitive. */
export const questionKey = (text: string) =>
  text.toLocaleLowerCase("tr").replace(/\s+/g, " ").trim();

function cellToText(value: Cell): string {
  if (value === null || value === undefined) return "";
  // Turkish Excel turns a typed "Doğru"/"Yanlış" into a boolean cell.
  if (typeof value === "boolean") return value ? "Doğru" : "Yanlış";
  if (value instanceof Date) return value.toLocaleDateString("tr-TR");
  return String(value).trim();
}

/** "B", "b", "B)", "b." or 2 -> 1. Returns null when it can't be understood. */
function parseCorrectAnswer(value: Cell): number | null {
  const text = cellToText(value).toLocaleUpperCase("tr");
  if (!text) return null;
  const letterIndex = OPTION_LETTERS.indexOf(text.replace(/[).:\s]+$/, ""));
  if (letterIndex >= 0) return letterIndex;
  const number = Number(text);
  if (Number.isInteger(number) && number >= 1 && number <= OPTION_LETTERS.length) return number - 1;
  return null;
}

/** Maps each field to its column index using the header row. Throws a Turkish message if unusable. */
function findColumns(header: Cell[]) {
  const names = header.map(normalizeHeader);
  const find = (aliases: string[]) => names.findIndex((n) => aliases.includes(n));

  const columns = {
    text: find(HEADER_ALIASES.text),
    correct: find(HEADER_ALIASES.correct),
    explanation: find(HEADER_ALIASES.explanation),
    options: OPTION_LETTERS.map((letter) => names.indexOf(letter.toLocaleLowerCase("tr"))),
  };

  const missing = [
    columns.text < 0 && "Soru",
    columns.options[0] < 0 && "A",
    columns.options[1] < 0 && "B",
    columns.correct < 0 && "Doğru Cevap",
  ].filter(Boolean);
  if (missing.length > 0) {
    throw new Error(
      `Dosyanın ilk satırında şu başlıklar bulunamadı: ${missing.join(", ")}. ` +
        "Lütfen örnek şablonu kullanın ve başlık satırını değiştirmeyin.",
    );
  }
  return columns;
}

/**
 * Validates spreadsheet rows (first row = headers) against the same rules as the admin form.
 * `existingTexts` are the question texts already in the pool, used to skip duplicates.
 */
export function parseQuestionRows(rows: Cell[][], existingTexts: string[]): ImportPreview {
  if (rows.length === 0) throw new Error("Dosya boş görünüyor.");
  const columns = findColumns(rows[0]);
  const dataRows = rows.slice(1);
  if (dataRows.length > MAX_IMPORT_ROWS) {
    throw new Error(`Tek seferde en fazla ${MAX_IMPORT_ROWS} soru yüklenebilir. Dosyayı bölün.`);
  }

  const seen = new Set(existingTexts.map(questionKey));
  const preview: ImportPreview = { valid: [], errors: [], duplicates: [] };

  dataRows.forEach((cells, i) => {
    const row = i + 2; // spreadsheet row number (1-based, after the header)
    const get = (col: number) => (col >= 0 ? cellToText(cells[col]) : "");

    const text = get(columns.text);
    const options = columns.options.map(get);
    while (options.length > 0 && !options[options.length - 1]) options.pop(); // drop trailing empty options
    const explanation = get(columns.explanation);
    const correctCell = columns.correct >= 0 ? cells[columns.correct] : null;

    if (!text && options.length === 0 && !cellToText(correctCell) && !explanation) return; // empty row

    const correctIndex = parseCorrectAnswer(correctCell);
    const input = normalizeQuestionInput({
      poolId: "import", // placeholder so validation passes; replaced on save
      text,
      options,
      correctIndex: correctIndex ?? -1,
      explanation,
      imageUrl: null,
    });

    const messages = validateQuestionInput(input);
    if (correctIndex === null) {
      // Replace the generic message with a more helpful one for spreadsheets.
      const i = messages.indexOf("Doğru cevap olarak bir şık seçilmeli.");
      if (i >= 0) messages.splice(i, 1);
      messages.push(
        cellToText(correctCell)
          ? `"Doğru Cevap" anlaşılamadı ("${cellToText(correctCell)}"). A, B, C, D, E veya F yazın.`
          : '"Doğru Cevap" boş. Doğru şıkkın harfini yazın.',
      );
    } else if (correctIndex >= options.length) {
      const i = messages.indexOf("Doğru cevap olarak bir şık seçilmeli.");
      if (i >= 0) messages.splice(i, 1);
      messages.push(`Doğru cevap ${OPTION_LETTERS[correctIndex]} olarak yazılmış ama o şık boş.`);
    }

    if (messages.length > 0) {
      preview.errors.push({ row, messages });
      return;
    }

    const key = questionKey(input.text);
    if (seen.has(key)) {
      preview.duplicates.push({ row, text: input.text });
      return;
    }
    seen.add(key);

    preview.valid.push({
      row,
      text: input.text,
      options: input.options,
      correctIndex: input.correctIndex,
      explanation: input.explanation,
      imageUrl: null,
    });
  });

  return preview;
}

/** Reads the first sheet of an .xlsx file. The parser is loaded only when needed. */
export async function readQuestionFile(file: File, existingTexts: string[]): Promise<ImportPreview> {
  if (!/\.xlsx$/i.test(file.name)) {
    throw new Error("Lütfen .xlsx uzantılı bir Excel dosyası seçin. (Eski .xls dosyalarını Excel'de .xlsx olarak kaydedin.)");
  }
  const { readSheet } = await import("read-excel-file/universal");
  let rows: Cell[][];
  try {
    rows = (await readSheet(file)) as Cell[][];
  } catch {
    throw new Error("Dosya okunamadı. Dosyanın bozuk olmadığından ve .xlsx formatında olduğundan emin olun.");
  }
  return parseQuestionRows(rows, existingTexts);
}
