import api from "@/api/axios";

export interface Harga {
  kode: string;
  jenisKain: string;
  warna: string;
  hargaPabrik: number;
  hargaToko: number;
}

export interface HargaPayload {
  isEdit: boolean;
  kode: string;
  jenisKain: string;
  warna: string;
  hargaPabrik: number;
  hargaToko: number;
}

export interface HargaOptions {
  warna: string[];
  jenisKain: string[];
}

export const hargaApi = {
  getAll: async (): Promise<Harga[]> => {
    const res = await api.get("/master/harga");
    return res.data.data;
  },

  getById: async (kode: string): Promise<Harga> => {
    const res = await api.get(`/master/harga/${kode}`);
    return res.data.data;
  },

  getOptions: async (): Promise<HargaOptions> => {
    const res = await api.get("/master/harga/options");
    return res.data.data;
  },

  save: async (payload: HargaPayload) => {
    const res = await api.post("/master/harga/save", payload);
    return res.data;
  },

  delete: async (kode: string) => {
    const res = await api.delete(`/master/harga/${kode}`);
    return res.data;
  },
};