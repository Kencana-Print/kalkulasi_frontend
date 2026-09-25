<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { isAuthExpiredError } from "@/api/axios";
import { exportExcel, exportExcelSingle, type ExcelColumn } from "@/utils/excelExport";
import BaseBrowse from "@/components/BaseBrowse.vue";
import {
  mintahargaApi,
  type MintaHargaRow,
  type DivisiOption,
} from "@/api/transaksi/mintahargaApi";
import {
  IconCalculator,
  IconTrash,
  IconSearch,
  IconTag,
  IconFileSpreadsheet,
} from "@tabler/icons-vue";

const router = useRouter();
const route = useRoute();
const toast = useToast();

// Samakan MENU_ID dengan yang terdaftar pada sistem backend routes (misal "22")
const MENU_ID = "22";

// ── Periode & Filter State ───────────────────────────────────────────
const STORAGE_KEY = "kalklasi_periode_minta_harga";

const getLocal = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

const getSavedPeriode = () => {
  try {
    const s = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
    if (s?.startDate && s?.endDate) return s;
  } catch {
    /* silent */
  }
  return null;
};

const now = new Date();
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
const firstJan = new Date(now.getFullYear(), 0, 1);
const savedP = getSavedPeriode();

// Status yang dikenal mh_status (daftar dashboard + CANCEL/DONE)
const STATUS_OPTIONS = ["BELUM", "MINTA", "NEGO", "WAIT", "CANCEL", "DONE"];

// ?filter=STATUS dari kartu dashboard: paksa status + periode Jan tahun
// berjalan s/d hari ini (mengalahkan simpanan session).
const queryFilter = String(route.query.filter || "").toUpperCase();
const fromDashboard = STATUS_OPTIONS.includes(queryFilter);

const startDate = ref(
  fromDashboard ? getLocal(firstJan) : (savedP?.startDate ?? getLocal(firstDay)),
);
const endDate = ref(savedP?.endDate ?? getLocal(now));
const selectedDivisi = ref("0");
const selectedStatus = ref(fromDashboard ? queryFilter : "");
const divisiOptions = ref<DivisiOption[]>([]);
const searchText = ref("");

watch([startDate, endDate, selectedDivisi, selectedStatus], ([s, e]) => {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ startDate: s, endDate: e })
    );
  } catch {
    /* silent */
  }
  loadData();
});

// ── Data & Datatable State ────────────────────────────────────────────
const items = ref<MintaHargaRow[]>([]);
const isLoading = ref(false);
const selected = ref<MintaHargaRow[]>([]);

const selectedItem = computed(() => selected.value[0] ?? null);

// Quick Filter Data Sesuai Input Text
const filteredItems = computed(() => {
  if (!searchText.value.trim()) return items.value;
  const q = searchText.value.toLowerCase().trim();
  return items.value.filter(
    (item) =>
      item.Nomor?.toLowerCase().includes(q) ||
      item.Customer?.toLowerCase().includes(q) ||
      item.NamaPekerjaan?.toLowerCase().includes(q) ||
      item.Sales?.toLowerCase().includes(q)
  );
});

const headers = [
  { key: "Nomor", title: "Nomor", width: "140px" },
  { key: "Divisi", title: "Divisi", width: "110px" },
  { key: "Tanggal", title: "Tanggal", width: "100px", align: "center" as const },
  { key: "Approved", title: "Approved", width: "140px" },
  { key: "Customer", title: "Customer", width: "180px" },
  { key: "Sales", title: "Sales", width: "120px" },
  { key: "NamaPekerjaan", title: "Nama Pekerjaan", width: "220px" },
  { key: "RencanaOrder", title: "Rencana Order", width: "110px", align: "right" as const },
  { key: "OrderTerakhir", title: "Order Terakhir", width: "110px", align: "right" as const },
  { key: "Kain", title: "Kain", width: "110px", align: "left" as const },
  { key: "Panjang", title: "Panjang", width: "80px", align: "left" as const },
  { key: "Lebar", title: "Lebar", width: "80px", align: "left" as const },
  { key: "Ukuran", title: "Ukuran", width: "110px", align: "left" as const },
  { key: "Gramasi", title: "Gramasi", width: "110px", align: "left" as const },
  { key: "Finishing", title: "Finishing", width: "110px", align: "left" as const },
  { key: "Sublim", title: "Sublim", width: "110px", align: "left" as const },
  { key: "Created", title: "Created", width: "120px", align: "left" as const },
  { key: "HargaLama", title: "Harga Lama", width: "110px", align: "right" as const },
  { key: "HargaMAP", title: "Harga MAP", width: "110px", align: "right" as const },
  { key: "HargaKalkulasi", title: "Harga Kalkulasi", width: "120px", align: "right" as const },
  { key: "TglKalkulasi", title: "TglKalkulasi", width: "80px", align: "left" as const },
  { key: "NomorKalkulasi", title: "No.Kalkulasi", width: "100px", align: "left" as const },
  { key: "UsrKalkulasi", title: "UsrKalkulasi", width: "80px", align: "left" as const },
  { key: "Status", title: "Status", width: "90px", align: "center" as const },
  { key: "KetKalkulasi", title: "KetKalkulasi", width: "130px", align: "left" as const  },
  { key: "KetBeli", title: "KetBeli", width: "130px", align: "left" as const },
];

// ── Loaders ───────────────────────────────────────────────────────────
const loadDivisi = async () => {
  try {
    const list = await mintahargaApi.getDivisi();
    divisiOptions.value = [{ kode: "0", divisi: "Semua Divisi" }, ...list];
  } catch (e: any) {
    if (!isAuthExpiredError(e)) toast.error("Gagal memuat list divisi.");
  }
};

const loadData = async () => {
  isLoading.value = true;
  selected.value = [];
  try {
    items.value = await mintahargaApi.getBrowse(
      startDate.value,
      endDate.value,
      selectedDivisi.value,
      selectedStatus.value
    );
  } catch (e: any) {
    if (isAuthExpiredError(e)) return;
    toast.error(e.response?.data?.message ?? "Gagal memuat data permintaan harga.");
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  await loadDivisi();
  await loadData();
});

// ── Export Excel Handler ──────────────────────────────────────────────
const onExportExcel = async () => {
  if (!filteredItems.value || filteredItems.value.length === 0) {
    toast.warning("Tidak ada data untuk diexport.");
    return;
  }

  // 1. Definisikan pemetaan kolom untuk Excel
  const columns: ExcelColumn[] = [
    { header: "Nomor", key: "Nomor", width: 18 },
    { header: "Divisi", key: "Divisi", width: 14 },
    { header: "Tanggal", key: "Tanggal", width: 14, align: "center" },
    { header: "Approved", key: "Approved", width: 18 },
    { header: "Customer", key: "Customer", width: 22 },
    { header: "Sales", key: "Sales", width: 15 },
    { header: "Nama Pekerjaan", key: "NamaPekerjaan", width: 28 },
    { header: "Rencana Order", key: "RencanaOrder", width: 15, align: "right", numFmt: "#,##0" },
    { header: "Order Terakhir", key: "OrderTerakhir", width: 15, align: "right", numFmt: "#,##0" },
    { header: "Kain", key: "Kain", width: 15 },
    { header: "Panjang", key: "Panjang", width: 10 },
    { header: "Lebar", key: "Lebar", width: 10 },
    { header: "Ukuran", key: "Ukuran", width: 15 },
    { header: "Gramasi", key: "Gramasi", width: 15 },
    { header: "Finishing", key: "Finishing", width: 15 },
    { header: "Sublim", key: "Sublim", width: 15 },
    { header: "Created", key: "Created", width: 15 },
    { header: "Harga Lama", key: "HargaLama", width: 15, align: "right", numFmt: "#,##0" },
    { header: "Harga MAP", key: "HargaMAP", width: 15, align: "right", numFmt: "#,##0" },
    { header: "Harga Kalkulasi", key: "HargaKalkulasi", width: 16, align: "right", numFmt: "#,##0" },
    { header: "Tgl Kalkulasi", key: "TglKalkulasi", width: 12 },
    { header: "No. Kalkulasi", key: "NomorKalkulasi", width: 15 },
    { header: "Usr Kalkulasi", key: "UsrKalkulasi", width: 14 },
    { header: "Status", key: "Status", width: 12, align: "center" },
    { header: "Ket Kalkulasi", key: "KetKalkulasi", width: 18 },
    { header: "Ket Beli", key: "KetBeli", width: 18 },
  ];

  try {
    const fileName = `Browse_Kalkulasi_Harga_${startDate.value}_sd_${endDate.value}.xlsx`;
    const title = `LAPORAN KALKULASI HARGA (${startDate.value} s/d ${endDate.value})`;

    // Panggil helper exportExcelSingle
    // await exportExcelSingle(
    //   fileName,
    //   "Kalkulasi Harga",
    //   columns,
    //   filteredItems.value,
    //   title
    // );

    // Panggil exportExcel dengan opsi rowStyleFn
    await exportExcel(fileName, [
      {
        sheetName: "Minta Harga",
        columns,
        rows: filteredItems.value,
        title,
        rowStyleFn: getRowExcelStyle, // ⬅️ Masukkan fungsi warna di sini
      },
    ]);    

    // toast.success("Data berhasil diexport ke Excel!");
  } catch (error) {
    // console.error("Export Error:", error);
    toast.error("Gagal melakukan export data.");
  }
};

// Helper untuk menentukan warna text/background di export excel berdasarkan status
const getRowExcelStyle = (row: any) => {
  const status = row?.Status ?? "";

  // Return fontColor & fillColor (dalam format HEX tanpa '#')
  // return { fillColor: "FFCDD2", fontColor: "B71C1C", bold: true }; 
  if (status === "MINTA") {
    return { fontColor: "D32F2F", bold: true }; // Merah
  }
  if (status === "WAIT") {
    return { fontColor: "2E7D32", bold: true }; // Hijau
  }
  if (status === "NEGO") {
    return { fontColor: "7B1FA2", bold: true }; // Ungu
  }
  if (status === "BELUM") {
    return { fontColor: "757575" }; // Abu-abu
  }
  if (status === "CANCEL") {
    return { fontColor: "1976D2" }; // Biru
  }
  return null;
};


// ── Custom Row Styling (Pewarnaan Sesuai Delphi uBrowseMintaHarga) ───
const rowPropsFn = (data: any) => {
  const row: MintaHargaRow = data?.item?.raw ?? data?.item ?? data;
  const status = row?.Status ?? "";

  if (status === "MINTA") return { style: "color: #d32f2f; font-weight: 600;" }; // Merah
  if (status === "WAIT") return { style: "color: #2e7d32; font-weight: 600;" };  // Hijau
   if (status === "NEGO") return { style: "color: #7b1fa2; font-weight: 600;" };  // Hijau
  if (status === "BELUM") return { style: "color: #757575; font-weight: 500;" }; // Abu-abu
  if (status === "CANCEL") return { style: "color: #1976d2; text-decoration: line-through;" }; // Biru Coret

  return {};
};

const getUsrBadgeClass = (usr: string) => {
  if (usr === "WIDYA") return "usr-widya";
  if (usr === "CACA") return "usr-caca";
  if (usr === "DARUL") return "usr-darul";
  return "";
};

// ── Actions ───────────────────────────────────────────────────────────
const requireSelected = () => {
  if (!selectedItem.value) {
    toast.warning("Pilih data permintaan harga terlebih dahulu.");
    return false;
  }
  return true;
};

const onKalkulasi = () => {
  if (!requireSelected()) return;
  const row = selectedItem.value!;
  if (row.Status === "BELUM") {
    toast.warning("Permintaan harga tersebut belum di-approve oleh Marketing.");
    return;
  }
  // Jika sudah ada kalkulasi → mode edit langsung ke nomor kalkulasi (KALKULASI HARGA)
  // Jika belum ada → mode create dari Minta Harga (query ?mh=...), replikasi zminta=true + varglobal
  if (row.NomorKalkulasi) {
    router.push({
      name: "KalkulasiEdit",
      params: { nomor: encodeURIComponent(row.NomorKalkulasi) },
    });
  } else {
    router.push({
      name: "KalkulasiCreate",
      query: { mh: row.Nomor, jenis: "KALKULASI HARGA" },
    });
  }
};

const onRowDblClick = (row: MintaHargaRow) => {
  selected.value = [row];
  onKalkulasi();
};

const onPenawaran1 = () => {
  if (!requireSelected()) return;
  const row = selectedItem.value!;
  if (!row.HargaKalkulasi || Number(row.HargaKalkulasi) === 0) {
    toast.warning("Silahkan melakukan Kalkulasi Harga dulu baru melakukan penawaran.");
    return;
  }
  router.push({
    name: "KalkulasiHarga",
    query: {
      nomor: row.Nomor,
      nomorPenawaran: row.NoPenawaran1 || "",
      mode: "PENAWARAN_1",
    },
  });
};

const onPenawaran2 = () => {
  if (!requireSelected()) return;
  const row = selectedItem.value!;
  if (!row.HargaKalkulasi || Number(row.HargaKalkulasi) === 0) {
    toast.warning("Silahkan melakukan Kalkulasi Harga dulu baru melakukan penawaran.");
    return;
  }
  router.push({
    name: "KalkulasiHarga",
    query: {
      nomor: row.Nomor,
      nomorPenawaran: row.NoPenawaran2 || "",
      mode: "PENAWARAN_2",
    },
  });
};

// ── Delete Actions ──
const showDeleteModal = ref(false);
const deleteType = ref<"KALKULASI" | "PEN1" | "PEN2">("KALKULASI");
const isDeleting = ref(false);

const openDeleteConfirm = (type: "KALKULASI" | "PEN1" | "PEN2") => {
  if (!requireSelected()) return;
  const row = selectedItem.value!;

  if (type === "PEN1" && Number(row.HargaPenawaran1) === 0) {
    toast.warning("Harga penawaran 1 sudah kosong.");
    return;
  }
  if (type === "PEN2" && Number(row.HargaPenawaran2) === 0) {
    toast.warning("Harga penawaran 2 sudah kosong.");
    return;
  }

  deleteType.value = type;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (!selectedItem.value) return;
  isDeleting.value = true;
  const row = selectedItem.value;

  try {
    if (deleteType.value === "KALKULASI") {
      await mintahargaApi.deleteKalkulasi(row.Nomor, row.NomorKalkulasi);
    } else if (deleteType.value === "PEN1") {
      await mintahargaApi.deletePenawaran1(row.Nomor);
    } else if (deleteType.value === "PEN2") {
      await mintahargaApi.deletePenawaran2(row.Nomor);
    }

    toast.success("Data berhasil dihapus.");
    showDeleteModal.value = false;
    await loadData();
  } catch (e: any) {
    if (isAuthExpiredError(e)) return;
    toast.error(e.response?.data?.message ?? "Gagal menghapus data.");
  } finally {
    isDeleting.value = false;
  }
};

const fmt = (v: number) => new Intl.NumberFormat("id-ID").format(v || 0);
const fmtDate = (v: string) => {
  if (!v) return "-";
  const [y, m, d] = v.split("-");
  return `${d}-${m}-${y}`;
};

</script>

<template>
  <BaseBrowse
    title="Browse Permintaan Harga"
    :icon="IconCalculator"
    :menu-id="MENU_ID"
    :headers="headers"
    :items="filteredItems"
    :is-loading="isLoading"
    :fixed-layout="false"
    item-value="Nomor"
    v-model:selected="selected"
    :row-props-fn="rowPropsFn"
    @refresh="loadData"
    @row-dblclick="onRowDblClick"
  >
    <!-- Filter Section -->
    <template #filter-left>
      <div class="filter-group">
        <span class="filter-lbl">Periode</span>
        <input v-model="startDate" type="date" class="date-inp" />
        <span class="filter-sep">s/d</span>
        <input v-model="endDate" type="date" class="date-inp" />

        <span class="filter-lbl ml-2">Divisi</span>
        <select v-model="selectedDivisi" class="select-inp">
          <option
            v-for="div in divisiOptions"
            :key="div.kode"
            :value="div.kode"
          >
            {{ div.kode === '0' ? div.divisi : `${div.kode} - ${div.divisi}` }}
          </option>
        </select>

        <span class="filter-lbl ml-2">Status</span>
        <select v-model="selectedStatus" class="select-inp">
          <option value="">Semua Status</option>
          <option v-for="st in STATUS_OPTIONS" :key="st" :value="st">
            {{ st }}
          </option>
        </select>

      </div>
    </template>

    <!-- Legend Status -->
    <template #filter-right>
      <div class="legend-wrap">
        <span class="legend-dot bg-gray"></span>
        <span class="legend-lbl">Belum Approve MO</span>
        <span class="legend-dot bg-red"></span>
        <span class="legend-lbl">Minta</span>
        <span class="legend-dot bg-purple"></span>
        <span class="legend-lbl">Nego</span>
        <span class="legend-dot bg-green"></span>
        <span class="legend-lbl">Wait</span>
        <span class="legend-dot bg-blue"></span>
        <span class="legend-lbl">Cancel</span>
      </div>
    </template>

    <!-- Header Action Buttons -->
    <template #extra-actions>
      <v-btn
        size="small"
        color="primary"
        variant="flat"
        :disabled="!selectedItem"
        @click="onKalkulasi"
      >
        <template #prepend><IconCalculator :size="15" /></template>
        Kalkulasi Harga
      </v-btn>

      <!-- Disembunyikan sementara — menu Penawaran belum dipakai -->
      <v-menu v-if="false" location="bottom end">
        <template #activator="{ props }">
          <v-btn
            size="small"
            color="teal-darken-1"
            variant="tonal"
            v-bind="props"
            :disabled="!selectedItem"
          >
            <template #prepend><IconTag :size="15" /></template>
            Penawaran
          </v-btn>
        </template>
        <v-list density="compact" class="py-1">
          <v-list-item @click="onPenawaran1">
            <v-list-item-title>Penawaran 1</v-list-item-title>
          </v-list-item>
          <v-list-item @click="onPenawaran2">
            <v-list-item-title>Penawaran 2</v-list-item-title>
          </v-list-item>
          <v-divider class="my-1" />
          <v-list-item @click="openDeleteConfirm('PEN1')">
            <v-list-item-title class="text-error">Hapus Penawaran 1</v-list-item-title>
          </v-list-item>
          <v-list-item @click="openDeleteConfirm('PEN2')">
            <v-list-item-title class="text-error">Hapus Penawaran 2</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-btn
        size="small"
        color="error"
        variant="tonal"
        :disabled="!selectedItem"
        @click="openDeleteConfirm('KALKULASI')"
      >
        <template #prepend><IconTrash :size="15" /></template>
        Hapus Kalkulasi
      </v-btn>

      <v-btn size="small" variant="tonal" color="success" @click="onExportExcel">
        <template #prepend
          ><IconFileSpreadsheet :size="13" :stroke-width="1.8"
        /></template>
        Export
      </v-btn>

    </template>

    <!-- Format Cells -->
    <template #item.Tanggal="{ value }">
      <span>{{ fmtDate(value) }}</span>
    </template>

    <!-- Custom Cell Display -->
    <template #item.Nomor="{ item, value }">
      <span :class="['nomor-badge', getUsrBadgeClass(item.UsrKalkulasi)]">
        {{ value }}
      </span>
    </template>    

    <template #item.RencanaOrder="{ value }">{{ fmt(value) }}</template>
    <template #item.HargaLama="{ value }">{{ fmt(value) }}</template>
    <template #item.HargaMAP="{ value }">{{ fmt(value) }}</template>
    <template #item.HargaKalkulasi="{ value }">{{ fmt(value) }}</template>
    <template #item.HargaPenawaran1="{ value }">{{ fmt(value) }}</template>
    <template #item.HargaPenawaran2="{ value }">{{ fmt(value) }}</template>
  </BaseBrowse>

  <!-- Confirm Modal Delete -->
  <v-dialog v-model="showDeleteModal" max-width="400" persistent>
    <v-card rounded="lg">
      <v-card-title class="text-body-1 font-weight-bold pa-4">
        Konfirmasi Hapus
      </v-card-title>
      <v-card-text class="pa-4 pt-0" style="font-size: 13px">
        Apakah Anda yakin ingin menghapus
        <strong v-if="deleteType === 'KALKULASI'">Data Kalkulasi & Penawaran</strong>
        <strong v-else-if="deleteType === 'PEN1'">Penawaran 1</strong>
        <strong v-else>Penawaran 2</strong>
        pada nomor <strong>{{ selectedItem?.Nomor }}</strong>?
      </v-card-text>
      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn variant="text" size="small" @click="showDeleteModal = false">Batal</v-btn>
        <v-btn
          color="error"
          variant="flat"
          size="small"
          :loading="isDeleting"
          @click="confirmDelete"
        >
          Ya, Hapus
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.filter-lbl {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}
.filter-sep {
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
}
.date-inp,
.select-inp {
  height: 32px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0 8px;
  font-size: 12px;
  outline: none;
  background-color: white;
}
.search-item {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 8px;
  color: #9ca3af;
}
.search-inp {
  height: 32px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0 8px 0 28px;
  font-size: 12px;
  outline: none;
  width: 180px;
  background-color: white;
}

.legend-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.bg-gray { background-color: #757575; }
.bg-red { background-color: #d32f2f; }
.bg-purple { background-color: #ef04f3; }
.bg-green { background-color: #2e7d32; }
.bg-blue { background-color: #1976d2; }

.legend-lbl {
  font-size: 11px;
  color: #374151;
  margin-right: 6px;
}
.ml-2 {
  margin-left: 8px;
}

.nomor-badge {
  padding: 2px 6px;
  border-radius: 4px;
}
.usr-widya {
  background-color: #7b1fa2;
  color: white;
}
.usr-caca {
  background-color: #1976d2;
  color: white;
}
.usr-darul {
  background-color: #388e3c;
  color: white;
}
</style>