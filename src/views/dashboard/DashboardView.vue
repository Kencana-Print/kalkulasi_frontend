<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { systemApi, type SystemInfo } from "@/api/systemApi";
import { dashboardApi, type DashboardSummary, type TodayActivityRow } from "@/api/dashboardApi";
import {
  IconLayoutDashboard,
  IconActivity,
  IconReceipt2,
  IconTransferOut,
  IconBook,
  IconAlertCircle,
  IconClock,
  IconInfoCircle,
  IconReceipt,
  IconTransfer,
  IconCalendar,
  IconBuildingBank,
  IconArrowsExchange,
  IconList,
  IconChevronRight,
  IconTrendingUp,
  IconFileInvoice,
} from "@tabler/icons-vue";
import PageLayout from "@/components/PageLayout.vue";

const authStore = useAuthStore();
const router = useRouter();
const appVersion = __APP_VERSION__;

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 11) return "Selamat Pagi";
  if (h < 15) return "Selamat Siang";
  if (h < 18) return "Selamat Sore";
  return "Selamat Malam";
});

const canViewKalkulasi = computed(() => authStore.can("22", "view"));

const fmt = (v: number) => new Intl.NumberFormat("id-ID").format(v);
const fmtCompact = (v: number) => {
  if (Math.abs(v) >= 1_000_000_000)
    return `${(v / 1_000_000_000).toFixed(1)} M`;
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} Jt`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)} Rb`;
  return String(v);
};

const showChangelog = ref(false);
const systemInfo = ref<SystemInfo | null>(null);

const summaryData = ref<DashboardSummary>({
  serverDate: "",
  belum: { count: 0 },
  minta: { count: 0 },
  nego: { count: 0 },
  wait: { count: 0 },
});
const isSummaryLoading = ref(true);

const todayActivity = ref<TodayActivityRow[]>([]);
const isActivityLoading = ref(true);

onMounted(async () => {
  try {
    systemInfo.value = await systemApi.getInfo();
  } catch {
    /* silent */
  }
  try {
    summaryData.value = await dashboardApi.getSummary(authStore.activeCabang);
  } catch {
    /* silent */
  } finally {
    isSummaryLoading.value = false;
  }
  try {
    todayActivity.value = await dashboardApi.getTodayActivity();
  } catch (e) {
    console.error("[dashboard] aktivitas hari ini gagal:", e);
  } finally {
    isActivityLoading.value = false;
  }
});

const serverDateFormatted = computed(() => {
  if (!summaryData.value.serverDate) return "—";
  const [y, m, d] = summaryData.value.serverDate.split("-");
  return `${d}/${m}/${y}`;
});

// ── Aktivitas Hari Ini (9 kolom: NoKalkulasi, TglKalkulasi, Status,
// Created, NoPermintaan, TglPermintaan, Peminta, NamaPermintaan,
// DateCreate) ──
const activityCount = computed(() => todayActivity.value.length);

// "YYYY-MM-DD" / datetime → "DD-MM-YYYY"
const fmtTgl = (v: string) => {
  if (!v) return "—";
  const m = String(v).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return String(v);
};

// "YYYY-MM-DD HH:mm:ss" (atau ISO) → "DD-MM-YYYY HH:MM"
const fmtDateTime = (v: string) => {
  if (!v) return "—";
  const m = String(v).match(
    /(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/
  );
  if (m) return `${m[3]}-${m[2]}-${m[1]} ${m[4]}:${m[5]}`;
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

// Warna status mengikuti pewarnaan browse Minta Harga
const statusStyle = (s: string) => {
  if (s === "MINTA") return "color: #c62828; font-weight: 700;";
  if (s === "WAIT") return "color: #2e7d32; font-weight: 700;";
  if (s === "DONE") return "color: #111; font-weight: 700;";
  if (s === "NEGO") return "color: #ff00e1; font-weight: 700;";
  if (s === "BELUM") return "color: #6e6d6d; font-weight: 700;";
  if (s === "CANCEL") return "color: #1565c0; text-decoration: line-through;";
  return "";
};


</script>

<template>
  <PageLayout
    title="Dashboard"
    :icon="IconLayoutDashboard"
    :desktop-mode="false"
    max-width="100%"
  >
    <div class="dash-wrap">
      <!-- ── Greeting ── -->
      <div class="dash-greeting">
        <div class="greeting-left">
          <h2 class="greeting-text">
            {{ greeting }},
            <span class="name">{{ authStore.userName || "User" }}</span> 👋
          </h2>
          <p class="greeting-sub">
            Selamat datang di Sistem Kalkulasi Harga Kencana Print.
          </p>
        </div>
        <div class="info-pills">
          <div
            class="info-pill clickable"
            @click="showChangelog = true"
            title="Catatan rilis"
          >
            <IconInfoCircle :size="13" />
            <span>Kalkulasi v{{ appVersion }}</span>
          </div>
          <div class="info-pill">
            <IconLayoutDashboard :size="13" />
            <span>{{ authStore.activeCabang || "—" }}</span>
          </div>
          <div class="info-pill">
            <IconCalendar :size="13" />
            <span v-if="isSummaryLoading">...</span>
            <span v-else>{{ serverDateFormatted }}</span>
          </div>
        </div>
      </div>

      <!-- ── Changelog Dialog ── -->
      <v-dialog v-model="showChangelog" max-width="500" scrollable>
        <v-card rounded="lg">
          <v-card-title
            class="pa-4 pb-2"
            style="
              font-size: 14px;
              font-weight: 700;
              border-top: 3px solid #2e7d32;
            "
          >
            Catatan Rilis (Changelog)
          </v-card-title>
          <v-card-text class="pa-4 pt-2" style="max-height: 400px">
            <div v-if="systemInfo">
              <div class="mb-3 text-caption" style="color: #555">
                Versi: <strong>v{{ appVersion }}</strong>
              </div>
              <div
                v-for="(logs, version) in systemInfo.all_changelogs"
                :key="version"
                class="mb-4"
              >
                <div class="changelog-version">Versi {{ version }}</div>
                <ul class="changelog-list">
                  <li v-for="(log, idx) in logs" :key="idx">{{ log }}</li>
                </ul>
              </div>
            </div>
            <div v-else class="text-center text-caption" style="color: #999">
              Memuat...
            </div>
          </v-card-text>
          <v-card-actions class="pa-3" style="border-top: 1px solid #eee">
            <v-spacer />
            <v-btn variant="text" size="small" @click="showChangelog = false"
              >Tutup</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- ── Tugas Menunggu ── -->
      <h3 class="section-title">
        <IconAlertCircle :size="14" style="color: #c62828" />
        Tugas Menunggu
      </h3>
      <div class="task-grid">

        <!-- BELUM -->
        <div v-if="canViewKalkulasi"
          class="task-card task-silver"
          @click="
            router.push({
              path: '/transaksi/minta-harga',
              query: { filter: 'BELUM' },
            })
          ">
          <div class="task-top">
            <div class="task-icon-wrap silver">
              <IconAlertCircle :size="20" />
            </div>
            <IconChevronRight :size="14" class="task-arrow" />
          </div>
          <div class="task-count">
            <span v-if="isSummaryLoading">—</span>
            <span v-else>{{ summaryData.belum?.count ?? 0 }}</span>
          </div>
          <div class="task-label">BELUM</div>
        </div>        

        <!-- MINTA -->
        <div v-if="canViewKalkulasi"
          class="task-card task-red"
          @click="
            router.push({
              path: '/transaksi/minta-harga',
              query: { filter: 'MINTA' },
            })
          ">
          <div class="task-top">
            <div class="task-icon-wrap red">
              <IconAlertCircle :size="20" />
            </div>
            <IconChevronRight :size="14" class="task-arrow" />
          </div>
          <div class="task-count">
            <span v-if="isSummaryLoading">—</span>
            <span v-else>{{ summaryData.minta?.count ?? 0 }}</span>
          </div>
          <div class="task-label">MINTA</div>
        </div>

        <!-- NEGO -->
        <div v-if="canViewKalkulasi"
          class="task-card task-purple"
          @click="
            router.push({
              path: '/transaksi/minta-harga',
              query: { filter: 'NEGO' },
            })
          ">
          <div class="task-top">
            <div class="task-icon-wrap purple">
              <IconReceipt :size="20" />
            </div>
            <IconChevronRight :size="14" class="task-arrow" />
          </div>
          <div class="task-count">
            <span v-if="isSummaryLoading">—</span>
            <span v-else>{{ summaryData.nego?.count ?? 0 }}</span>
          </div>
          <div class="task-label">NEGO</div>
        </div>

        <!-- WAIT -->
        <div
          v-if="canViewKalkulasi"
          class="task-card task-green"
          @click="
            router.push({
              path: '/transaksi/minta-harga',
              query: { filter: 'WAIT' },
            })
          ">
          <div class="task-top">
            <div class="task-icon-wrap green">
              <IconClock :size="20" />
            </div>
            <IconChevronRight :size="14" class="task-arrow" />
          </div>
          <div class="task-count">
            <span v-if="isSummaryLoading">—</span>
            <span v-else>{{ summaryData.wait?.count ?? 0 }}</span>
          </div>
          <div class="task-label">WAIT</div>
        </div>

      </div> 

      <!-- ── Aksi Cepat ── -->
      <h3 class="section-title" style="margin-top: 28px">
        <IconTrendingUp :size="14" style="color: #2e7d32" />
        Aksi Cepat
      </h3>
      <div class="quick-actions">
        
        <button
          v-if="canViewKalkulasi"
          class="qa-btn"
          @click="router.push('/transaksi/minta-harga')"
        >
          <IconReceipt2 :size="18" class="qa-icon" />
          <span>Kalkulasi Harga</span>
        </button>
        

      </div>

      <!-- ── Aktivitas Hari Ini ── -->
      <div class="activity-card">
        <div class="activity-header">
          <div class="activity-title">
            <IconActivity :size="14" style="color: #7b1fa2" />
            <span>Aktivitas Hari Ini</span>
          </div>
          <div class="activity-count">
            <span v-if="isActivityLoading">…</span>
            <span v-else>{{ activityCount }} transaksi</span>
          </div>
        </div>
        <div class="activity-list">
          <div v-if="isActivityLoading" class="activity-empty">
            Memuat aktivitas…
          </div>
          <div v-else-if="activityCount === 0" class="activity-empty">
            Belum ada kalkulasi hari ini.
          </div>
          <template v-else>
            <div class="activity-row activity-head">
              <span>NoKalkulasi</span>
              <span>TglKalkulasi</span>
              <span>Status</span>
              <span>Created</span>
              <span>Modified</span>
              <span>NoPermintaan</span>
              <span>TglPermintaan</span>
              <span>Peminta</span>
              <span>NamaPermintaan</span>
              <span class="activity-jam">DateCreate</span>
            </div>
            <div
              v-for="row in todayActivity"
              :key="row.NoKalkulasi"
              class="activity-row"
              :title="`${row.NoKalkulasi} • ${row.NoPermintaan}`"
            >
              <span class="activity-nomor">{{ row.NoKalkulasi }}</span>
              <span class="activity-dim">{{ fmtDateTime(row.TglKalkulasi) }}</span>
              <span :style="statusStyle(row.Status)">{{ row.Status || "—" }}</span>
              <span class="activity-user">{{ row.Created || "—" }}</span>
              <span class="activity-modify">{{ row.modified || "—" }}</span>
              <span class="activity-nomor">{{ row.NoPermintaan }}</span>
              <span class="activity-dim">{{ fmtTgl(row.TglPermintaan) }}</span>
              <span class="activity-user">{{ row.Peminta || "—" }}</span>
              <span class="activity-nama">{{ row.NamaPermintaan || "—" }}</span>
              <span class="activity-jam">{{ fmtDateTime(row.DateCreate) }}</span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<style scoped>
.dash-wrap {
  width: 100%;
  max-width: 100%;
  padding: 4px 8px 32px;
}

/* ── Greeting ── */
.dash-greeting {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.greeting-text {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 4px;
}
.name {
  color: #2e7d32;
}
.greeting-sub {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin: 0;
}
.info-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.info-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #f1f8f1;
  border: 1px solid #c8e6c9;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 600;
  color: #2e7d32;
}
.info-pill.clickable {
  cursor: pointer;
  transition: background 0.15s;
}
.info-pill.clickable:hover {
  background: #e8f5e9;
}

/* ── Saldo Hero ── */
.saldo-hero {
  background: linear-gradient(135deg, #2e7d32, #1b5e20);
  border-radius: 12px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  margin-bottom: 24px;
  transition: opacity 0.15s;
  box-shadow: 0 4px 16px rgba(46, 125, 50, 0.25);
}
.saldo-hero:hover {
  opacity: 0.92;
}
.saldo-hero-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}
.saldo-hero-val {
  font-size: 26px;
  font-weight: 800;
  color: white;
  letter-spacing: -0.5px;
  margin-bottom: 4px;
}
.saldo-loading {
  font-size: 14px;
  opacity: 0.7;
}
.saldo-hero-sub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
}
.saldo-hero-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}
.saldo-hero-bank {
  background: linear-gradient(135deg, #1565c0, #0d47a1);
  box-shadow: 0 4px 16px rgba(21, 101, 192, 0.25);
}

@media (max-width: 768px) {
  .saldo-hero-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

/* ── Section title ── */
.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* ── Task Grid ── */
.task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 28px;
}
.task-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}
.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}
.task-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}
.task-silver::before {
  background: #6e6d6d;
}
.task-red::before {
  background: #ef5350;
}
.task-purple::before {
  background: #ff00e1;
}
.task-orange::before {
  color: #e65100;
}
.task-blue::before {
  background: #1565c0;
}
.task-green::before {
  background: #2e7d32;
}

.task-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.task-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.task-icon-wrap.silver {
  background: #ffebee;
  color: #6e6d6d;
}
.task-icon-wrap.red {
  background: #ffebee;
  color: #c62828;
}
.task-icon-wrap.purple {
  background: #ffebee;
  color: #ff00e1;
}
.task-icon-wrap.orange {
  background: #fff3e0;
  color: #ef6c00;
}
.task-icon-wrap.blue {
  background: #e3f2fd;
  color: #1565c0;
}
.task-icon-wrap.green {
  background: #e8f5e9;
  color: #2e7d32;
}
.task-arrow {
  color: #9ca3af;
}

.task-count {
  font-size: 28px;
  font-weight: 800;
  color: #111;
  line-height: 1;
  margin-bottom: 4px;
}
.task-silver .task-count {
  color: #6e6d6d;
}
.task-red .task-count {
  color: #c62828;
}
.task-purple .task-count {
  color: #ff00e1;
}
.task-orange .task-count {
  color: #e65100;
}
.task-blue .task-count {
  color: #1565c0;
}
.task-green .task-count {
  color: #2e7d32;
}

.task-label {
  font-size: 11px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 2px;
}
.task-sub {
  font-size: 10px;
  color: #9ca3af;
}

/* ── Bar Chart ── */
.chart-section {
  margin-bottom: 24px;
}
.bar-chart-wrap {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.bar-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.bar-lbl {
  font-size: 11px;
  font-weight: 600;
  color: #374151;
  width: 70px;
  flex-shrink: 0;
}
.bar-track {
  flex: 1;
  height: 10px;
  background: #f3f4f6;
  border-radius: 99px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.6s ease;
}
.bar-info {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 70px;
  flex-shrink: 0;
}
.bar-count {
  font-size: 12px;
  font-weight: 700;
  color: #111;
}
.bar-pct {
  font-size: 10px;
  color: #9ca3af;
}

/* ── Quick Actions ── */
.quick-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.qa-btn {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
}
.qa-btn:hover {
  border-color: #2e7d32;
  background: #f1f8f1;
  color: #2e7d32;
}
.qa-icon {
  color: #2e7d32;
}

/* ── Aktivitas Hari Ini ── */
.activity-card {
  margin-top: 20px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
}
.activity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid #e5e7eb;
}
.activity-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}
.activity-count {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
}
.activity-list {
  max-height: 260px;
  overflow: auto;
}
.activity-row {
  display: grid;
  grid-template-columns:
    100px 130px 60px 70px 70px 100px 95px 70px minmax(160px, 1fr) 130px;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 12px;
  min-width: 1020px;
}
.activity-row:last-child {
  border-bottom: none;
}
.activity-head {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9ca3af;
  background: #f9fafb;
  position: sticky;
  top: 0;
  z-index: 1;
}
.activity-nomor {
  color: #1565c0;
  font-weight: 700;
  white-space: nowrap;
}
.activity-dim {
  color: #4b5563;
  white-space: nowrap;
}
.activity-user {
  color: #4b5563;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.activity-modified {
  color: #4b5563;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.activity-nama {
  color: #111827;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.activity-jam {
  color: #6b7280;
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.activity-empty {
  padding: 20px 16px;
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
}

@media (max-width: 768px) {
  .activity-count {
    font-size: 12px;
  }
}

/* ── Changelog ── */
.changelog-version {
  font-size: 13px;
  font-weight: 700;
  color: #2e7d32;
  margin-bottom: 4px;
  padding-bottom: 2px;
  border-bottom: 1px solid #e0e0e0;
}
.changelog-list {
  margin: 0;
  padding-left: 20px;
  font-size: 12px;
  color: #333;
}
.changelog-list li {
  margin-bottom: 3px;
}

/* ── Responsif ── */
@media (max-width: 768px) {
  .saldo-hero-val {
    font-size: 20px;
  }
  .task-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .task-count {
    font-size: 22px;
  }
  .dash-greeting {
    flex-direction: column;
    gap: 10px;
  }
}
@media (max-width: 480px) {
  .task-grid {
    grid-template-columns: 1fr 1fr;
  }
  .quick-actions .qa-btn span {
    display: none;
  }
  .quick-actions .qa-btn {
    padding: 10px;
  }
}
</style>
