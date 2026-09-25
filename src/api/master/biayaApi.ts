import api from "@/api/axios";

export interface BiayaPengerjaan {
  kode: string;
  jenis: string;
  keterangan: string;
  satuan: string;
  medium: number;
  premium: number;
  biayaMinimal: number;
}

export interface BiayaOptions {
  jenis: string[];
  satuan: string[];
}

export interface BiayaPayload {
  kode?: string;
  jenis: string;
  keterangan: string;
  medium: number;
  premium: number;
  biayaMinimal: number;
}

const BASE = "/master/biaya";

export const biayaApi = {
  getAll: async (): Promise<BiayaPengerjaan[]> => {
    const { data } = await api.get(BASE);
    return data.data;
  },
  getDetail: async (kode: string): Promise<BiayaPengerjaan> => {
    const { data } = await api.get(`${BASE}/${encodeURIComponent(kode)}`);
    return data.data;
  },
  getOptions: async (): Promise<BiayaOptions> => {
    const { data } = await api.get(`${BASE}/options`);
    return data.data;
  },
  create: async (payload: BiayaPayload) => {
    const { data } = await api.post(`${BASE}/save`, payload);
    return data;
  },
  update: async (kode: string, payload: BiayaPayload) => {
    const { data } = await api.put(`${BASE}/${encodeURIComponent(kode)}`, payload);
    return data;
  },
  remove: async (kode: string) => {
    const { data } = await api.delete(`${BASE}/${encodeURIComponent(kode)}`);
    return data;
  },
};
