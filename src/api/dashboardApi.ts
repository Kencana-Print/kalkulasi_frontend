import apiClient from "./axios";

export interface DashboardSummary {
  serverDate: string;
  belum: { count: number };
  minta: { count: number };
  nego: { count: number };
  wait: { count: number };
}

export interface TodayActivityRow {
  NoKalkulasi: string;
  TglKalkulasi: string;
  Status: string;
  Created: string;
  modified: string;
  NoPermintaan: string;
  TglPermintaan: string;
  Peminta: string;
  NamaPermintaan: string;
  DateCreate: string;
}

export const dashboardApi = {
  getSummary: async (cabang?: string): Promise<DashboardSummary> => {
    const { data } = await apiClient.get("/dashboard/summary", {
      params: cabang ? { cabang } : undefined,
    });
    return data.data;
  },
  getTodayActivity: async (): Promise<TodayActivityRow[]> => {
    const { data } = await apiClient.get("/dashboard/today-activity");
    return data.data ?? [];
  },
};
