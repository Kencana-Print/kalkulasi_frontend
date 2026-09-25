import api from "@/api/axios";

// Service layer modul Kalkulasi Harga — pola disamakan persis dengan
// spkFormService.ts: base path "/transaksi/kalkulasi/form", GET pakai
// query param (bukan path param), save() pakai POST (create) / PUT (edit)
// tergantung payload.isEdit. Tiap method mengembalikan promise axios apa
// adanya (caller akses res.data.data).
const BASE = "/transaksi/kalkulasi/form";

export const kalkulasiFormApi = {
  getDetail: (nomor: string) => api.get(`${BASE}/detail`, { params: { nomor } }),

  getMintaHarga: (nomor: string) =>
    api.get(`${BASE}/minta-harga`, { params: { nomor } }),

  getNego: (nomor: string) => api.get(`${BASE}/nego`, { params: { nomor } }),

  save: (payload: any) =>
    payload.isEdit
      ? api.put(`${BASE}/save`, payload)
      : api.post(`${BASE}/save`, payload),

  getPpnDefault: () => api.get(`${BASE}/ppn-default`),

  // ── Model Kerja ──
  searchModelKerja: (q: string) =>
    api.get(`${BASE}/model-kerja/cari`, { params: { q } }),
  getModelKerja: (khKode: string) =>
    api.get(`${BASE}/model-kerja`, { params: { khKode } }),

  // ── Gramasi & Harga Kain ──
  getGramasi: (params: {
    khKode: string;
    jenisKain: string;
    lengan: string;
    bagian: "body" | "lengan";
  }) => api.get(`${BASE}/gramasi`, { params }),

  getHargaKain: (params: { jenisKain: string; warna: string; pabrik: boolean }) =>
    api.get(`${BASE}/harga-kain`, { params }),

  getRibBabaran: (params: { leher: boolean; lengan: boolean }) =>
    api.get(`${BASE}/rib-babaran`, { params }),

  getKrahManset: () => api.get(`${BASE}/krah-manset`),

  getKomponenOptions: () => api.get(`${BASE}/komponen-master`),

  // ── Biaya Pengerjaan ──
  getBiayaTunggal: (params: { jenis: string; ket?: string }) =>
    api.get(`${BASE}/biaya-pengerjaan`, { params }),

  getBiayaMin: (jenis: string) =>
    api.get(`${BASE}/biaya-pengerjaan/min`, { params: { jenis } }),

  listBiayaPengerjaan: (params: { jenis: string; grade: "medium" | "premium" }) =>
    api.get(`${BASE}/biaya-pengerjaan/list`, { params }),

  getKetSublim: () => api.get(`${BASE}/sublim-ket`),

  getHargaSublim: (params: { ket: string; grade: "medium" | "premium" }) =>
    api.get(`${BASE}/sublim-harga`, { params }),

  // ── Margin & Minimum Cetak ──
  getMargin: (params: { qtyOrder: number; grade: "medium" | "premium" }) =>
    api.get(`${BASE}/margin`, { params }),

  getMinCetak: (params: { qtyOrder: number; grade: "medium" | "premium" }) =>
    api.get(`${BASE}/min-cetak`, { params }),

  // ── Browse Kalkulasi (UBrowsekalkulasi) ──
  getBrowse: (params: { startDate: string; endDate: string; jenis?: string }) =>
    api.get(`${BASE}/browse`, { params }),

  deleteKalkulasi: (nomor: string) =>
    api.delete(`${BASE}/${encodeURIComponent(nomor)}`),
};
