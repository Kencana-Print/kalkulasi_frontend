import api from "@/api/axios";

export interface Pekerjaan {
  kode: string;
  nama: string;
  warna: number; // 1 = 1 Warna, 2 = 2 Warna
  laba: number;
}

export interface PekerjaanDetailRow {
  jeniskain: string;
  lengan: string;
  gramasi: string;
  babaran: number;
  babaranLengan: number;
}

export interface PekerjaanDetail extends Pekerjaan {
  detail: PekerjaanDetailRow[];
}

export interface PekerjaanOptions {
  jenisKain: string[];
  lengan: string[];
  gramasi: string[];
}

export interface PekerjaanPayload {
  kode?: string;
  nama: string;
  warna: number;
  laba: number;
  detail: PekerjaanDetailRow[];
}

const BASE = "/master/pekerjaan";

export const pekerjaanApi = {
  getAll: async (): Promise<Pekerjaan[]> => {
    const { data } = await api.get(BASE);
    return data.data;
  },
  getDetail: async (kode: string): Promise<PekerjaanDetail> => {
    const { data } = await api.get(`${BASE}/${encodeURIComponent(kode)}`);
    return data.data;
  },
  getOptions: async (): Promise<PekerjaanOptions> => {
    const { data } = await api.get(`${BASE}/options`);
    return data.data;
  },
  create: async (payload: PekerjaanPayload) => {
    const { data } = await api.post(`${BASE}/save`, payload);
    return data;
  },
  update: async (kode: string, payload: PekerjaanPayload) => {
    const { data } = await api.put(`${BASE}/${encodeURIComponent(kode)}`, payload);
    return data;
  },
  remove: async (kode: string) => {
    const { data } = await api.delete(`${BASE}/${encodeURIComponent(kode)}`);
    return data;
  },
};

export const warnaLabel = (w: number) =>
  Number(w) === 2 ? "2 Warna" : "1 Warna";
