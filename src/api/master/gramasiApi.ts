import api from "@/api/axios";

export interface Gramasi {
  gramasi: string;
}

export interface GramasiPayload {
  gramasi: string;
}

export const gramasiApi = {
  getAll: async (): Promise<Gramasi[]> => {
    const res = await api.get("/master/gramasi");
    return res.data.data;
  },

  save: async (payload: GramasiPayload) => {
    const res = await api.post("/master/gramasi/save", payload);
    return res.data;
  },

  delete: async (gramasi: string) => {
    const res = await api.delete(`/master/gramasi/${encodeURIComponent(gramasi)}`);
    return res.data;
  },
};