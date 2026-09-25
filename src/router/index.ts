import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ── Auth ──────────────────────────────────────────────────────────
    {
      path: "/login",
      name: "Login",
      component: () => import("@/views/auth/LoginView.vue"),
      meta: { title: "Login", layout: "BlankLayout", requiresAuth: false },
    },

    // ── Dashboard ─────────────────────────────────────────────────────
    {
      path: "/",
      name: "Dashboard",
      component: () => import("@/views/dashboard/DashboardView.vue"),
      meta: { layout: "DefaultLayout", requiresAuth: true, title: "Dashboard" },
    },

    // ── Master ────────────────────────────────────────────────────────
    {
      path: "/master/jenis",
      name: "MasterJenis",
      component: () => import("@/views/master/JenisView.vue"),
      meta: {
        layout: "DefaultLayout",
        requiresAuth: true,
        menuId: "6",
        title: "Master Jenis Kain",
      },
    },
    {
      path: "/master/harga",
      name: "MasterHarga",
      component: () => import("@/views/master/HargaView.vue"),
      meta: {
        layout: "DefaultLayout",
        requiresAuth: true,
        menuId: "7",
        title: "Master Harga Kain",
      },
    },
    {
      path: "/master/gramasi",
      name: "MasterGramasi",
      component: () => import("@/views/master/GramasiView.vue"),
      meta: {
        layout: "DefaultLayout",
        requiresAuth: true,
        menuId: "8",
        title: "Master Gramasi",
      },
    },
    {
      path: "/master/komponen",
      name: "MasterKomponen",
      component: () => import("@/views/master/KomponenView.vue"),
      meta: {
        layout: "DefaultLayout",
        requiresAuth: true,
        menuId: "9",
        title: "Master Komponen",
      },
    },
    {
      path: "/master/pekerjaan",
      name: "MasterPekerjaan",
      component: () => import("@/views/master/PekerjaanView.vue"),
      meta: {
        layout: "DefaultLayout",
        requiresAuth: true,
        menuId: "11",
        title: "Master Pekerjaan",
      },
    },
    {
      path: "/master/pekerjaan/create",
      name: "MasterPekerjaanCreate",
      component: () => import("@/views/master/PekerjaanFormView.vue"),
      meta: {
        layout: "DefaultLayout",
        requiresAuth: true,
        menuId: "11",
        title: "Tambah Pekerjaan",
        browseRoute: "MasterPekerjaan",
      },
    },
    {
      path: "/master/pekerjaan/edit/:kode",
      name: "MasterPekerjaanEdit",
      component: () => import("@/views/master/PekerjaanFormView.vue"),
      meta: {
        layout: "DefaultLayout",
        requiresAuth: true,
        menuId: "11",
        title: "Ubah Pekerjaan",
        browseRoute: "MasterPekerjaan",
      },
    },
    {
      path: "/master/biaya",
      name: "MasterBiaya",
      component: () => import("@/views/master/BiayaView.vue"),
      meta: {
        layout: "DefaultLayout",
        requiresAuth: true,
        menuId: "12",
        title: "Master Biaya Pengerjaan",
      },
    },
    {
      path: "/master/biaya/create",
      name: "MasterBiayaCreate",
      component: () => import("@/views/master/BiayaFormView.vue"),
      meta: {
        layout: "DefaultLayout",
        requiresAuth: true,
        menuId: "12",
        title: "Tambah Biaya Pengerjaan",
        browseRoute: "MasterBiaya",
      },
    },
    {
      path: "/master/biaya/edit/:kode",
      name: "MasterBiayaEdit",
      component: () => import("@/views/master/BiayaFormView.vue"),
      meta: {
        layout: "DefaultLayout",
        requiresAuth: true,
        menuId: "12",
        title: "Ubah Biaya Pengerjaan",
        browseRoute: "MasterBiaya",
      },
    },

    // ── Transaksi ─────────────────────────────────────────────────────
    {
      path: "/transaksi/minta-harga",
      name: "MintaHarga",
      component: () => import("@/views/transaksi/MintaHargaView.vue"),
      meta: {
        layout: "DefaultLayout",
        requiresAuth: true,
        menuId: "22",
        title: "Permintaan Harga",
      },
    },
    {
      path: "/transaksi/minta-harga/edit/:nomor",
      name: "MintaHargaEdit",
      component: () => import("@/views/transaksi/KalkulasiFormView.vue"),
      meta: {
        layout: "DefaultLayout",
        requiresAuth: true,
        menuId: "22",
        title: "Ubah Kalkulasi (via Permintaan Harga)",
        browseRoute: "MintaHarga",
      },
    },
    // ── Kalkulasi Form — menu browse Kalkulasi disembunyikan, Tutup/sukses
    // kembali ke browse Permintaan Harga (browseRoute: "MintaHarga").
    {
      path: "/transaksi/kalkulasi/create",
      name: "KalkulasiCreate",
      component: () => import("@/views/transaksi/KalkulasiFormView.vue"),
      meta: {
        layout: "DefaultLayout",
        requiresAuth: true,
        menuId: "22",
        title: "Buat Kalkulasi Harga",
        browseRoute: "MintaHarga",
      },
    },
    {
      path: "/transaksi/kalkulasi/edit/:nomor",
      name: "KalkulasiEdit",
      component: () => import("@/views/transaksi/KalkulasiFormView.vue"),
      meta: {
        layout: "DefaultLayout",
        requiresAuth: true,
        menuId: "22",
        title: "Ubah Kalkulasi",
        browseRoute: "MintaHarga",
      },
    },
    
    // ── Tools ─────────────────────────────────────────────────────────
    {
      path: "/tools/users",
      name: "MasterUser",
      component: () => import("@/views/tools/MasterUserView.vue"),
      meta: {
        layout: "DefaultLayout",
        requiresAuth: true,
        menuId: "1",
        title: "Master User",
      },
    },
    {
      path: "/tools/users/create",
      name: "MasterUserCreate",
      component: () => import("@/views/tools/MasterUserFormView.vue"),
      meta: {
        layout: "DefaultLayout",
        requiresAuth: true,
        menuId: "1",
        title: "Tambah User",
        browseRoute: "MasterUser",
      },
    },
    {
      path: "/tools/users/edit/:kode",
      name: "MasterUserEdit",
      component: () => import("@/views/tools/MasterUserFormView.vue"),
      meta: {
        layout: "DefaultLayout",
        requiresAuth: true,
        menuId: "1",
        title: "Ubah User",
        browseRoute: "MasterUser",
      },
    },

    // ── Error Pages ───────────────────────────────────────────────────
    {
      path: "/403",
      name: "Unauthorized",
      component: () => import("@/views/errors/UnauthorizedView.vue"),
      meta: {
        layout: "BlankLayout",
        requiresAuth: false,
        title: "Akses Ditolak",
      },
    },
    {
      path: "/:pathMatch(.*)*",
      name: "NotFound",
      component: () => import("@/views/errors/NotFoundView.vue"),
      meta: {
        layout: "BlankLayout",
        requiresAuth: false,
        title: "Halaman Tidak Ditemukan",
      },
    },
  ],
});

// ── Navigation Guard ──────────────────────────────────────────────────
router.beforeEach((to) => {
  const authStore = useAuthStore();
  document.title = `${String(to.meta?.title || to.name || "Kalkulasi")} — KALKULASI`;

  if (to.meta.requiresAuth && !authStore.isAuthenticated)
    return { name: "Login" };

  if (to.name === "Login" && authStore.isAuthenticated)
    return { name: "Dashboard" };

  // Hanya cek permission kalau menus sudah ada isinya
  const menuId = to.meta.menuId as string | undefined;
  if (
    menuId &&
    menuId !== "0" &&
    authStore.user?.menus?.length &&
    !authStore.can(menuId, "view")
  )
    return { name: "Unauthorized", query: { from: to.fullPath } };
});

export default router;
