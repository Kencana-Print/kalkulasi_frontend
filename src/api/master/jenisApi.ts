import api from "@/api/axios";

export interface JenisKain {
  nama: string;
}

export const jenisApi = {
  getAll: async (): Promise<JenisKain[]> => {
    const { data } = await api.get("/master/jenis");
    return data.data;
  },

  save: async (payload: { nama: string }) => {
    const { data } = await api.post("/master/jenis/save", payload);
    return data;
  },
  delete: async (nama: string) => {
    const { data } = await api.delete(
      `/master/jenis/${encodeURIComponent(nama)}`,
    );
    return data;
  },
};