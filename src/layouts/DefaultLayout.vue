<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import api from "@/api/axios";
import { useToast } from "vue-toastification";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useTabsStore } from "@/stores/tabsStore";
import logoUrl from "@/assets/logo.png";
import {
  IconLayoutDashboard,
  IconCash,
  IconChevronDown,
  IconLogout,
  IconUser,
  IconLock,
  IconBuildingBank,
  IconFileInvoice,
  IconReportMoney,
  IconBookmarks,
  IconTransferIn,
  IconTransferOut,
  IconReceipt2,
  IconBook,
  IconList,
  IconAdjustments,
  IconUsers,
  IconMenu2,
  IconArrowsExchange,
  IconTransfer,
  IconTruckDelivery,
  IconMapPin,
  IconX,
  IconFileText,
} from "@tabler/icons-vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const tabsStore = useTabsStore();
const toast = useToast();
const drawer = ref(true);
const rail = ref(false);
const isMobile = ref(false);

// ── State Ganti Password ──────────────────────────────────────────────
const showPasswordDialog = ref(false);
const pwForm = ref({ oldPassword: "", newPassword: "", confirmPassword: "" });
const pwSaving = ref(false);
const pwError = ref("");

const userName = computed(() => authStore.userName);
const userCabang = computed(() => authStore.userCabang);

const openPasswordDialog = () => {
  pwForm.value = { oldPassword: "", newPassword: "", confirmPassword: "" };
  pwError.value = "";
  showPasswordDialog.value = true;
};

const submitChangePassword = async () => {
  pwError.value = "";
  if (!pwForm.value.oldPassword) {
    pwError.value = "Password lama wajib diisi.";
    return;
  }
  if (!pwForm.value.newPassword) {
    pwError.value = "Password baru wajib diisi.";
    return;
  }
  if (pwForm.value.newPassword !== pwForm.value.confirmPassword) {
    pwError.value = "Konfirmasi password tidak cocok.";
    return;
  }
  pwSaving.value = true;
  try {
    await api.post("/auth/change-password", pwForm.value);
    showPasswordDialog.value = false;
    toast.success("Password berhasil diganti.");
  } catch (e: any) {
    pwError.value = e.response?.data?.message || "Gagal mengganti password.";
  } finally {
    pwSaving.value = false;
  }
};

const logout = () => {
  tabsStore.reset();
  authStore.logout();
  router.push("/login");
};

const switchCabang = (c: string) => {
  authStore.setActiveCabang(c);
  router.go(0); // reload halaman biar dashboard/laporan re-fetch pakai cabang baru
};

// Toggle hamburger — beda behavior mobile vs desktop
const toggleDrawer = () => {
  if (isMobile.value) {
    drawer.value = !drawer.value; // mobile: show/hide sepenuhnya
  } else {
    rail.value = !rail.value; // desktop: expand/collapse rail
  }
};

const updateBreakpoint = () => {
  const w = window.innerWidth;
  isMobile.value = w <= 768;

  // Hanya set rail berdasarkan ukuran layar
  // Jangan reset drawer.value saat resize agar tidak mengganggu user
  if (!isMobile.value) {
    rail.value = w <= 1024;
    drawer.value = true; // desktop/tablet selalu tampil
  }
};

// Init pertama kali — set semua state
const initBreakpoint = () => {
  const w = window.innerWidth;
  isMobile.value = w <= 768;
  if (isMobile.value) {
    rail.value = false;
    drawer.value = false; // mobile: mulai tertutup
  } else if (w <= 1024) {
    rail.value = true;
    drawer.value = true;
  } else {
    rail.value = false;
    drawer.value = true;
  }
};

onMounted(() => {
  initBreakpoint();
  window.addEventListener("resize", updateBreakpoint);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateBreakpoint);
});

// ── Menu struktur ─────────────────────────────────────────────────────
const menus = [
  {
    title: "Dashboard",
    icon: IconLayoutDashboard,
    route: "/",
    menuId: null,
  },
  {
    title: "Master",
    icon: IconBookmarks,
    menuId: null,
    children: [
      {
        title: "Master Jenis Kain",
        icon: IconAdjustments,
        route: "/master/jenis",
        menuId: "6",
      },
      {
        title: "Master Harga Kain",
        icon: IconBuildingBank,
        route: "/master/harga",
        menuId: "7",
      },
      {
        title: "Master Gramasi",
        icon: IconList,
        route: "/master/gramasi",
        menuId: "8",
      },
      {
        title: "Master Komponen",
        icon: IconList,
        route: "/master/komponen",
        menuId: "9",
      },
      {
        title: "Master Pekerjaan",
        icon: IconList,
        route: "/master/pekerjaan",
        menuId: "11",
      },
      {
        title: "Master Biaya Pengerjaan",
        icon: IconList,
        route: "/master/biaya",
        menuId: "12",
      },
    ],
  },
  {
    title: "Transaksi",
    icon: IconCash,
    menuId: null,
    children: [
      // {
      //   title: "Kalkulasi Harga",
      //   icon: IconTruckDelivery,
      //   route: "/transaksi/kalkulasi",
      //   menuId: "21",
      // },
      {
        title: "Permintaan Harga",
        icon: IconReceipt2,
        route: "/transaksi/minta-harga",
        menuId: "22",
      },

    ],
  },

  // {
  //   title: "Laporan",
  //   icon: IconReportMoney,
  //   menuId: null,
  //   children: [
  //     {
  //       title: "List Jurnal",
  //       icon: IconList,
  //       route: "/laporan/list-jurnal",
  //       menuId: null,
  //     },
  //     {
  //       title: "Buku Besar",
  //       icon: IconBook,
  //       route: "/laporan/buku-besar",
  //       menuId: null,
  //     },
  //     {
  //       title: "Kasbon Belum Selesai",
  //       icon: IconList,
  //       route: "/laporan/kasbon-belum-selesai",
  //       menuId: null,
  //     },
  //     {
  //       title: "Rekonsiliasi Bank",
  //       icon: IconBuildingBank,
  //       route: "/laporan/rekonsiliasi-bank",
  //       menuId: null,
  //     },
  //     {
  //       title: "Stok",
  //       icon: IconList,
  //       route: "/laporan/stok-finance",
  //       menuId: null,
  //     },
  //     {
  //       title: "Daftar Hutang",
  //       icon: IconList,
  //       route: "/laporan/daftar-hutang",
  //       menuId: null,
  //     },
  //   ],
  // },
  {
    title: "Tools",
    icon: IconUsers,
    menuId: null,
    children: [
      {
        title: "Master User",
        icon: IconUser,
        route: "/tools/users",
        menuId: "1",
      },
    ],
  },
];

// ── Filter Menu Berdasarkan Hak Akses ─────────────────────────────────
const filteredMenus = computed(() => {
  return (
    menus
      .map((menu) => {
        if (menu.children) {
          const allowedChildren = menu.children.filter(
            (child) => !child.menuId || authStore.can(child.menuId, "view"),
          );
          return { ...menu, children: allowedChildren };
        }

        if (menu.menuId && !authStore.can(menu.menuId, "view")) {
          return null;
        }

        return menu;
      })
      // 1. Tambahkan type predicate 'as NonNullable<...>' agar TS tahu hasilnya tidak null
      .filter((menu): menu is NonNullable<typeof menu> => {
        if (!menu) return false;
        if (menu.children && menu.children.length === 0) return false;
        return true;
      })
  );
});

// Expand state per group
const openGroups = ref<Record<string, boolean>>({});
const toggleGroup = (title: string) => {
  if (openGroups.value[title]) {
    openGroups.value[title] = false;
  } else {
    openGroups.value = { [title]: true };
  }
};

// ── Tab navigasi ala browser ──────────────────────────────────────────
// 1 tab = 1 menu (key `menu:<menuId>`; Dashboard pin). Buka menu otomatis
// menambah tab; klik tab = kembali ke halaman terakhir di menu itu;
// isi halaman dipertahankan via <keep-alive> di <v-main>.
const tabKeyOf = (r: typeof route): string => {
  const menuId = r.meta?.menuId as string | undefined;
  if (menuId) return `menu:${menuId}`;
  if (r.path === "/") return "dashboard";
  return `route:${String(r.name ?? r.path)}`;
};

const findIconForPath = (fullPath: string) => {
  const path = fullPath.split("?")[0];
  for (const m of menus) {
    if (m.children) {
      for (const c of m.children) {
        if (path === c.route || path.startsWith(`${c.route}/`)) return c.icon;
      }
    } else if (m.route && (path === m.route || path.startsWith(`${m.route}/`))) {
      return m.icon;
    }
  }
  return undefined;
};

const syncTab = () => {
  const key = tabKeyOf(route);
  const title = String(route.meta?.title ?? route.name ?? key);
  tabsStore.ensureTab(
    key,
    title,
    route.fullPath,
    findIconForPath(route.fullPath) ??
      (key === "dashboard" ? IconLayoutDashboard : undefined),
    key !== "dashboard",
  );
};

watch(() => route.fullPath, syncTab, { immediate: true });

const onTabClick = (key: string) => {
  const t = tabsStore.tabs.find((x) => x.key === key);
  if (!t || key === tabsStore.activeKey) return;
  router.push(t.fullPath);
};

const onTabClose = (e: Event, key: string) => {
  e.stopPropagation();
  const next = tabsStore.close(key);
  if (next) router.push(next.fullPath);
};
</script>

<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      :rail="!isMobile && rail"
      :temporary="isMobile"
      :permanent="!isMobile"
      class="kalkulasi-drawer"
      width="240"
      theme="dark"
    >
      <div class="drawer-brand" :class="{ 'rail-brand': rail }">
        <div class="brand-logo">
          <img :src="logoUrl" alt="Logo" class="img-logo" />
        </div>
        <transition name="fade">
          <div v-if="isMobile || !rail" class="brand-text">
            <div class="brand-title">KALKULASI</div>
            <div class="brand-sub">Kalkulasi Harga</div>
          </div>
        </transition>
      </div>

      <v-divider class="mx-3 mb-1" />

      <v-list density="compact" nav class="px-2">
        <template v-for="menu in filteredMenus" :key="menu.title">
          <v-list-item
            v-if="!menu.children"
            :to="menu.route"
            rounded="lg"
            class="mb-1"
            active-class="nav-active"
            :title="rail ? '' : menu.title"
          >
            <template #prepend>
              <component
                :is="menu.icon"
                :size="18"
                :stroke-width="1.8"
                class="nav-icon"
              />
            </template>
            <template #title v-if="isMobile || !rail">{{
              menu.title
            }}</template>
          </v-list-item>

          <template v-else>
            <v-list-item
              rounded="lg"
              class="mb-1 nav-group-header"
              :title="rail ? '' : menu.title"
              @click="(isMobile || !rail) && toggleGroup(menu.title)"
            >
              <template #prepend>
                <component
                  :is="menu.icon"
                  :size="18"
                  :stroke-width="1.8"
                  class="nav-icon"
                />
              </template>
              <template #title v-if="!rail">{{ menu.title }}</template>
              <template #append v-if="isMobile || !rail">
                <IconChevronDown
                  :size="14"
                  :stroke-width="2"
                  :style="{
                    transform: openGroups[menu.title] ? 'rotate(180deg)' : '',
                    transition: 'transform .2s',
                  }"
                />
              </template>
            </v-list-item>

            <v-expand-transition>
              <div
                v-if="openGroups[menu.title] && (isMobile || !rail)"
                class="nav-children"
              >
                <v-list-item
                  v-for="child in menu.children"
                  :key="child.title"
                  :to="child.route"
                  rounded="lg"
                  class="mb-0.5 nav-child-item"
                  active-class="nav-active"
                >
                  <template #prepend>
                    <component
                      :is="child.icon"
                      :size="15"
                      :stroke-width="1.7"
                      class="nav-child-icon"
                    />
                  </template>
                  <v-list-item-title class="nav-child-title">{{
                    child.title
                  }}</v-list-item-title>
                </v-list-item>
              </div>
            </v-expand-transition>
          </template>
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar flat class="kalkulasi-appbar" height="52">
      <v-btn variant="text" size="small" @click="toggleDrawer" class="ml-1">
        <IconMenu2 :size="20" :stroke-width="1.8" />
      </v-btn>

      <v-app-bar-title>
        <span class="appbar-title">Kalkulasi Harga</span>
      </v-app-bar-title>

      <template #append>
        <!-- ── Switch Cabang — hanya tampil kalau user punya lebih dari 1 cabang ── -->
        <v-menu v-if="authStore.canSwitchCabang">
          <template #activator="{ props }">
            <button class="cabang-switch-btn" v-bind="props">
              <IconMapPin :size="13" :stroke-width="1.8" />
              {{ authStore.activeCabang }}
              <IconChevronDown :size="12" />
            </button>
          </template>
          <v-list density="compact" class="user-menu">
            <v-list-item
              v-for="c in authStore.cabangOptions"
              :key="c"
              @click="switchCabang(c)"
              :active="c === authStore.activeCabang"
            >
              <v-list-item-title style="font-size: 12px">{{
                c
              }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-menu>
          <template #activator="{ props }">
            <div class="appbar-user-btn" v-bind="props">
              <div class="appbar-avatar">
                {{ userName.charAt(0).toUpperCase() }}
              </div>
              <div class="appbar-info">
                <div class="appbar-name">{{ userName }}</div>
                <div class="appbar-cab">{{ userCabang }}</div>
              </div>
              <IconChevronDown :size="14" class="appbar-chevron" />
            </div>
          </template>

          <v-list density="compact" class="user-menu">
            <v-list-item @click="openPasswordDialog">
              <template #prepend>
                <IconLock
                  :size="15"
                  :stroke-width="1.8"
                  class="mr-2"
                  style="color: #2e7d32"
                />
              </template>
              <v-list-item-title style="font-size: 13px"
                >Ganti Password</v-list-item-title
              >
            </v-list-item>
            <v-divider class="my-1" />
            <v-list-item @click="logout">
              <template #prepend>
                <IconLogout
                  :size="15"
                  :stroke-width="1.8"
                  class="mr-2"
                  style="color: #c62828"
                />
              </template>
              <v-list-item-title style="font-size: 13px; color: #c62828"
                >Keluar</v-list-item-title
              >
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-app-bar>

    <v-main class="kalkulasi-main">
      <!-- ── Tab strip: tiap menu yang dibuka jadi satu tab ── -->
      <div class="tab-strip">
        <button
          v-for="tab in tabsStore.tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: tab.key === tabsStore.activeKey }"
          :title="tab.title"
          @click="onTabClick(tab.key)"
        >
          <component :is="tab.icon ?? IconFileText" :size="14" :stroke-width="1.8" class="tab-icon" />
          <span class="tab-label">{{ tab.title }}</span>
          <span
            v-if="tab.closable"
            class="tab-close"
            title="Tutup tab"
            @click="onTabClose($event, tab.key)"
          >
            <IconX :size="12" :stroke-width="2.2" />
          </span>
        </button>
      </div>
      <div class="tab-content">
        <router-view v-slot="{ Component, route: r }">
          <keep-alive :max="15">
            <component :is="Component" :key="r.fullPath" />
          </keep-alive>
        </router-view>
      </div>
    </v-main>
  </v-app>

  <v-dialog v-model="showPasswordDialog" max-width="380" persistent>
    <v-card rounded="lg">
      <v-card-title class="pw-dialog-title">
        <IconLock :size="18" :stroke-width="1.8" color="#2e7d32" />
        Ganti Password
      </v-card-title>
      <v-card-text class="pa-4 pt-2">
        <div class="pw-field">
          <label class="pw-lbl">Password Lama</label>
          <input
            v-model="pwForm.oldPassword"
            type="password"
            class="pw-inp"
            placeholder="Masukkan password lama"
            autocomplete="current-password"
          />
        </div>
        <div class="pw-field">
          <label class="pw-lbl">Password Baru</label>
          <input
            v-model="pwForm.newPassword"
            type="password"
            class="pw-inp"
            placeholder="Masukkan password baru"
            autocomplete="new-password"
          />
        </div>
        <div class="pw-field">
          <label class="pw-lbl">Ulangi Password Baru</label>
          <input
            v-model="pwForm.confirmPassword"
            type="password"
            class="pw-inp"
            placeholder="Ketik ulang password baru"
            autocomplete="new-password"
            @keydown.enter="submitChangePassword"
          />
        </div>
        <div v-if="pwError" class="pw-error">{{ pwError }}</div>
      </v-card-text>
      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn variant="text" size="small" @click="showPasswordDialog = false"
          >Batal</v-btn
        >
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          :loading="pwSaving"
          @click="submitChangePassword"
        >
          Simpan
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* ── Drawer ── */
.kalkulasi-drawer {
  background: #2e7d32 !important;
  border-right: none !important;
}

.drawer-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px 10px;
  min-height: 64px;
  transition: padding 0.2s ease;
}

.rail-brand {
  padding-left: 0 !important;
  padding-right: 0 !important;
  justify-content: center !important;
}

.brand-logo {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.img-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 4px;
}

.brand-title {
  font-size: 14px;
  font-weight: 700;
  color: white;
  letter-spacing: 0.05em;
}
.brand-sub {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.65);
}

/* Nav items */
.nav-icon {
  flex-shrink: 0;
}
.nav-group-header {
  cursor: pointer;
}

.nav-children {
  padding-left: 8px;
}
.nav-child-icon {
  flex-shrink: 0;
}
.nav-child-title {
  font-size: 12px !important;
}

/* Active state */
:deep(.nav-active) {
  background: rgba(255, 255, 255, 0.15) !important;
}

/* ── App Bar ── */
.kalkulasi-appbar {
  background: white !important;
  border-bottom: 1px solid #c8e6c9 !important;
  box-shadow: 0 1px 4px rgba(46, 125, 50, 0.1) !important;
}
.appbar-title {
  font-size: 14px;
  font-weight: 600;
  color: #2e7d32;
}

/* ── Main ── */
.kalkulasi-main {
  background-color: #f1f8f1 !important;
  min-height: 100vh;
}
.kalkulasi-main :deep(.v-main__wrap) {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Sembunyikan content di drawer saat rail aktif */
.kalkulasi-drawer :deep(.v-list-item__content) {
  display: none;
}
.kalkulasi-drawer:not(.v-navigation-drawer--rail) :deep(.v-list-item__content) {
  display: flex;
}

/* ── User menu dropdown ── */
.user-menu {
  min-width: 170px !important;
}

/* ── Password dialog ── */
.pw-dialog-title {
  font-size: 14px !important;
  font-weight: 700 !important;
  border-top: 3px solid #2e7d32;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 16px 12px;
}
.pw-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}
.pw-field:last-of-type {
  margin-bottom: 0;
}
.pw-lbl {
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
}
.pw-inp {
  height: 36px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0 10px;
  font-size: 13px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}
.pw-inp:focus {
  border-color: #2e7d32;
  box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1);
}
.pw-error {
  font-size: 12px;
  color: #c62828;
  font-weight: 600;
  background: #ffebee;
  border-radius: 4px;
  padding: 8px 10px;
  margin-top: 10px;
}

/* ── Appbar user button ── */
.appbar-user-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.15s;
}
.appbar-user-btn:hover {
  background: rgba(46, 125, 50, 0.08);
}
.appbar-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #2e7d32;
  color: white;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.appbar-info {
  display: flex;
  flex-direction: column;
}
.appbar-name {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.2;
}
.appbar-cab {
  font-size: 11px;
  color: #6b7280;
}
.appbar-chevron {
  color: #9ca3af;
  margin-left: 2px;
}

.kalkulasi-drawer.v-navigation-drawer--rail :deep(.v-list-item__content) {
  display: none !important;
}
.kalkulasi-drawer:not(.v-navigation-drawer--rail) :deep(.v-list-item__content) {
  display: grid !important; /* Vuetify 3 defaultnya pakai grid, bukan flex */
  opacity: 1 !important;
  visibility: visible !important;
}

.cabang-switch-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid #c8e6c9;
  border-radius: 16px;
  background: #f1f8f1;
  color: #2e7d32;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  margin-right: 10px;
  transition: background 0.15s;
}
.cabang-switch-btn:hover {
  background: #e0f2e1;
}

/* ── Tab strip ala browser ── */
.tab-strip {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  padding: 6px 10px 0;
  background: #f1f8f1;
  border-bottom: 1px solid #c8e6c9;
  overflow-x: auto;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 5;
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 200px;
  min-width: 0;
  padding: 6px 8px 6px 10px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  color: #616161;
  background: #e8f0e8;
  border: 1px solid #c8e6c9;
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}
.tab-btn:hover {
  background: white;
  color: #2e7d32;
}
.tab-btn.active {
  background: white;
  color: #1565c0;
  border-color: #90caf9;
  border-bottom: 2px solid white;
  margin-bottom: -1px;
  box-shadow: 0 -1px 3px rgba(21, 101, 192, 0.12);
}
.tab-icon {
  flex-shrink: 0;
}
.tab-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  flex-shrink: 0;
  color: #9e9e9e;
}
.tab-close:hover {
  background: #ffebee;
  color: #c62828;
}
.tab-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* ── Responsif DefaultLayout ── */
@media (max-width: 768px) {
  .appbar-info,
  .appbar-chevron {
    display: none;
  }
  .appbar-user-btn {
    margin-right: 4px;
    padding: 4px;
  }
  .appbar-title {
    font-size: 13px;
  }
  .kalkulasi-drawer {
    width: 240px !important;
  }
  /* Kembalikan tampilan konten menu di mobile */
  .kalkulasi-drawer :deep(.v-list-item__content) {
    display: grid !important;
    opacity: 1 !important;
    visibility: visible !important;
  }
}
</style>
