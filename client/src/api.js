import axios from "axios";

// Backend Express jalan sebagai local server di dalam Electron / saat dev.
const api = axios.create({
  baseURL: "http://localhost:4000/api",
});

export default api;

// Helper untuk download file .docx (struk / bukti cicilan) dari endpoint backend
export async function downloadFile(url, filename) {
  const res = await api.get(url, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
