/**
 * Parse CSV text into array of objects (first row = headers).
 * Handles quoted fields with commas.
 */
export function parseCsv(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((h, j) => {
      obj[h] = values[j] ?? '';
    });
    rows.push(obj);
  }
  return rows;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let end = i + 1;
      while (end < line.length) {
        if (line[end] === '"') {
          if (line[end + 1] === '"') {
            end += 2;
            continue;
          }
          break;
        }
        end++;
      }
      result.push(line.slice(i + 1, end).replace(/""/g, '"').trim());
      i = end + 1;
      if (line[i] === ',') i++;
    } else {
      let end = line.indexOf(',', i);
      if (end === -1) end = line.length;
      result.push(line.slice(i, end).trim());
      i = end + 1;
    }
  }
  return result;
}
