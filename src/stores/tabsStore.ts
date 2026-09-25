import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Component } from "vue";

export interface OpenTab {
  key: string;
  title: string;
  fullPath: string;
  icon?: Component;
  closable: boolean;
}

const DASHBOARD_TAB: OpenTab = {
  key: "dashboard",
  title: "Dashboard",
  fullPath: "/",
  closable: false,
};

/**
 * Store tab navigasi ala browser (lihat screenshot: Dashboard | Barang Garmen | ...).
 * - 1 tab = 1 menu (key = `menu:<menuId>`, Dashboard selalu pin pertama).
 * - Buka dokumen lain dalam menu yang sama menggantikan isi tab itu.
 * - Klik tab = router.push ke fullPath terakhir yang tersimpan di tab tsb.
 */
export const useTabsStore = defineStore("tabs", () => {
  const tabs = ref<OpenTab[]>([{ ...DASHBOARD_TAB }]);
  const activeKey = ref<string>(DASHBOARD_TAB.key);

  const activeTab = computed(
    () => tabs.value.find((t) => t.key === activeKey.value) ?? null,
  );

  const ensureTab = (
    key: string,
    title: string,
    fullPath: string,
    icon?: Component,
    closable = true,
  ) => {
    const existing = tabs.value.find((t) => t.key === key);
    if (existing) {
      existing.title = title;
      existing.fullPath = fullPath;
      if (icon) existing.icon = icon;
    } else {
      tabs.value.push({ key, title, fullPath, icon, closable });
    }
    activeKey.value = key;
  };

  const activate = (key: string) => {
    if (tabs.value.some((t) => t.key === key)) activeKey.value = key;
  };

  /** Tutup tab. Return tab yang harus dibuka berikutnya bila tab aktif yang ditutup. */
  const close = (key: string): OpenTab | null => {
    const idx = tabs.value.findIndex((t) => t.key === key);
    if (idx < 0 || !tabs.value[idx].closable) return null;
    const wasActive = activeKey.value === key;
    tabs.value.splice(idx, 1);
    if (wasActive) {
      const next = tabs.value[Math.min(idx, tabs.value.length - 1)];
      activeKey.value = next.key;
      return next;
    }
    return null;
  };

  const reset = () => {
    tabs.value = [{ ...DASHBOARD_TAB }];
    activeKey.value = DASHBOARD_TAB.key;
  };

  return { tabs, activeKey, activeTab, ensureTab, activate, close, reset };
});
