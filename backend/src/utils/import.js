export const parseCsv = (content) => {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }

      row.push(current);
      current = "";

      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    current += char;
  }

  row.push(current);

  if (row.some((value) => value.trim() !== "")) {
    rows.push(row);
  }

  return rows;
};

export const parseCsvObjects = (content) => {
  const [headerRow = [], ...dataRows] = parseCsv(content);
  const headers = headerRow.map((cell) => cell.trim());

  return dataRows.map((row) =>
    headers.reduce((record, header, index) => {
      record[header] = row[index]?.trim() ?? "";
      return record;
    }, {})
  );
};
