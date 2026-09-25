import api from "@/api/axios";

export interface DivisiOption {
  kode: string;
  divisi: string;
}

export interface MintaHargaRow {
  Nomor: string;
  Divisi: string;
  Tanggal: string;
  Approved: string;
  Customer: string;
  Sales: string;
  NamaPekerjaan: string;
  RencanaOrder: number;
  HargaLama: number;
  OrderTerakhir: string;
  Kain: string;
  Panjang: number;
  Lebar: number;
  Ukuran: string;
  Gramasi: string;
  Finishing: string;
  Sublim: string;
  Created: string;
  HargaMAP: number;
  HargaKalkulasi: number;
  TglKalkulasi: string;
  NomorKalkulasi: string;
  UsrKalkulasi: string;
  Satuan: string;
  HargaBahan: number;
  Babaran: string;
  HargaPenawaran1: number;
  HargaPenawaran2: number;
  NoPenawaran1: string;
  NoPenawaran2: string;
  Status: string;
  KetKalkulasi: string;
  KetBeli: string;
}

export const mintahargaApi = {
  getDivisi: async (): Promise<DivisiOption[]> => {
    const res = await api.get("/transaksi/minta-harga/divisi");
    return res.data.data;
  },

  getBrowse: async (
    startDate: string,
    endDate: string,
    divisi?: string,
    status?: string
  ): Promise<MintaHargaRow[]> => {
    const res = await api.get("/transaksi/minta-harga", {
      params: { startDate, endDate, divisi, status: status || undefined },
    });
    return res.data.data;
  },

  deleteKalkulasi: async (nomor: string, nomorKalkulasi: string): Promise<void> => {
    await api.post(`/transaksi/minta-harga/delete-kalkulasi/${encodeURIComponent(nomor)}`, {
      nomorKalkulasi,
    });
  },

  deletePenawaran1: async (nomor: string): Promise<void> => {
    await api.post(`/transaksi/minta-harga/delete-penawaran1/${encodeURIComponent(nomor)}`);
  },

  deletePenawaran2: async (nomor: string): Promise<void> => {
    await api.post(`/transaksi/minta-harga/delete-penawaran2/${encodeURIComponent(nomor)}`);
  },
};