import api from "../lib/api.js";

export const downloadCsv = async (endpoint, ids, filename, extraParams = {}) => {
  const response = await api.get(endpoint, {
    params: {
      ...extraParams,
      ...(ids?.length ? { ids: ids.join(",") } : {})
    },
    responseType: "blob"
  });

  const blob = new Blob([response.data], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadPdf = async (endpoint, payload, filename) => {
  const response = await api.post(endpoint, payload, {
    responseType: "blob"
  });

  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
