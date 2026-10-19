import { ref } from "vue";
import { kalkulasiFormApi } from "@/api/transaksi/kalkulasiFormApi";

// ── Informasi Pembayaran Customer (aging Lunas / Belum Lunas) ──
// Sumber: GET /transaksi/kalkulasi/form/info-pembayaran?customer=<kode>.
// Kode diambil dari Minta Harga yang terhubung (mh_cus_kode). Selalu tampil
// 6 baris kategori; sel kosong bila NULL (menyerupai tampilan Excel).
export interface InfoBayarRow {
  lama_hari: string;
  lunas: number | null;
  belumLunas: number | null;
  margin: number | null;
}
// Kolom Margin % sifatnya informasi saja — di-hardcode sesuai tabel referensi.
const INFO_MARGIN: Record<string, number> = {
  "0-30": 0,
  "31-45": 0.75,
  "46-60": 1.5,
  "61-75": 2.25,
  "76-90": 3,
  ">90": 5,
};
const withMargin = (rows: Array<Omit<InfoBayarRow, "margin"> & { margin?: number | null }>): InfoBayarRow[] =>
  rows.map((r) => ({ ...r, margin: INFO_MARGIN[r.lama_hari] ?? null }));
const INFO_BAYAR_DEFAULT: InfoBayarRow[] = withMargin([
  { lama_hari: "0-30", lunas: null, belumLunas: null },
  { lama_hari: "31-45", lunas: null, belumLunas: null },
  { lama_hari: "46-60", lunas: null, belumLunas: null },
  { lama_hari: "61-75", lunas: null, belumLunas: null },
  { lama_hari: "76-90", lunas: null, belumLunas: null },
  { lama_hari: ">90", lunas: null, belumLunas: null },
]);
export const fmtBayar = (v: number | null | undefined) =>
  v === null || v === undefined ? "" : Math.round(Number(v) || 0).toLocaleString("id-ID");
export const fmtMargin = (v: number | null | undefined) =>
  v === null || v === undefined ? "" : String(v);

export const useInfoPembayaran = () => {
  const infoBayarRows = ref<InfoBayarRow[]>([...INFO_BAYAR_DEFAULT]);
  const isLoadingInfoBayar = ref(false);

  const fetchInfoBayar = async (customer: string) => {
    const kode = String(customer || "").trim();
    if (!kode) {
      infoBayarRows.value = [...INFO_BAYAR_DEFAULT];
      return;
    }
    isLoadingInfoBayar.value = true;
    try {
      const res = await kalkulasiFormApi.getInfoPembayaran(kode);
      const rows = res.data?.data;
      infoBayarRows.value = Array.isArray(rows) && rows.length ? withMargin(rows) : [...INFO_BAYAR_DEFAULT];
    } catch {
      infoBayarRows.value = [...INFO_BAYAR_DEFAULT];
    } finally {
      isLoadingInfoBayar.value = false;
    }
  };

  return { infoBayarRows, isLoadingInfoBayar, fetchInfoBayar };
};
