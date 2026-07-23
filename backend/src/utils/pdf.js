const escapePdfText = (value) =>
  String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const chunkLines = (lines, size) => {
  const pages = [];

  for (let index = 0; index < lines.length; index += size) {
    pages.push(lines.slice(index, index + size));
  }

  return pages.length ? pages : [[]];
};

const padCell = (value, width) => {
  const text = String(value ?? "");

  if (text.length >= width) {
    return `${text.slice(0, Math.max(0, width - 3))}...`;
  }

  return text.padEnd(width, " ");
};

export const buildTableLines = (rows, columns) => {
  const widths = columns.map((column) => column.width || 16);
  const header = columns
    .map((column, index) => padCell(column.label, widths[index]))
    .join(" | ");
  const separator = widths.map((width) => "-".repeat(width)).join("-+-");
  const body = rows.map((row) =>
    columns
      .map((column, index) => padCell(column.value(row), widths[index]))
      .join(" | ")
  );

  return [header, separator, ...body];
};

export const buildPdf = (title, rows, columns) => {
  const tableLines = buildTableLines(rows, columns);
  const lines = [title, "", ...tableLines];
  const pageWidth = 612;
  const pageHeight = 792;
  const fontSize = 10;
  const lineHeight = 14;
  const topMargin = 760;
  const leftMargin = 36;
  const maxLinesPerPage = 48;
  const pages = chunkLines(lines, maxLinesPerPage);
  const objects = [];

  const addObject = (content) => {
    objects.push(content);
    return objects.length;
  };

  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>");

  const pageIds = [];

  pages.forEach((pageLines) => {
    const contentStream = [
      "BT",
      `/F1 ${fontSize} Tf`,
      `${leftMargin} ${topMargin} Td`
    ];

    pageLines.forEach((line, index) => {
      if (index > 0) {
        contentStream.push(`0 -${lineHeight} Td`);
      }

      contentStream.push(`(${escapePdfText(line)}) Tj`);
    });

    contentStream.push("ET");

    const streamBody = contentStream.join("\n");
    const contentId = addObject(
      `<< /Length ${Buffer.byteLength(streamBody, "utf8")} >>\nstream\n${streamBody}\nendstream`
    );

    pageIds.push(
      addObject(
        `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>`
      )
    );
  });

  const pagesId = addObject(
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`
  );

  pageIds.forEach((pageId) => {
    objects[pageId - 1] = objects[pageId - 1].replace("/Parent 0 0 R", `/Parent ${pagesId} 0 R`);
  });

  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets[index + 1] = Buffer.byteLength(pdf, "utf8");
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
};

export const sendPdf = (res, filename, pdfBuffer) => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.status(200).send(pdfBuffer);
};
