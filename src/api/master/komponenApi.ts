import api from "@/api/axios";

export interface Komponen {
  nama: string;
}

export const komponenApi = {
  getAll: async (): Promise<Komponen[]> => {
    const { data } = await api.get("/master/komponen");
    return data.data;
  },

  save: async (payload: { nama: string }) => {
    const { data } = await api.post("/master/komponen/save", payload);
    return data;
  },
  delete: async (nama: string) => {
    const { data } = await api.delete(
      `/master/komponen/${encodeURIComponent(nama)}`,
    );
    return data;
  },
};
