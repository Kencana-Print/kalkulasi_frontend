<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { IconTools, IconSearch, IconDatabaseOff } from "@tabler/icons-vue";
import { kalkulasiFormApi } from "@/api/transaksi/kalkulasiFormApi";

// Padanan generik dialog helper (Tfrmbantu) yang dipakai Delphi untuk
// memilih jenis proses (Cetak/Sublim/Jahit) berikut harganya dari
// tbiayapengerjaan. Daftar biasanya pendek, jadi filter cukup di sisi
// klien (tanpa pagination server), sama seperti perilaku Tfrmbantu asli.
const props = defineProps<{
  modelValue: boolean;
  jenis: "CETAK" | "SUBLIM" | "JAHIT";
  grade: "medium" | "premium";
}>();
const emit = defineEmits(["update:modelValue", "selected"]);

const search = ref("");
const isLoading = ref(false);
const items = ref<{ nama: string; harga: number; raglanMedium?: number; raglanPremium?: number }[]>([]);

const filtered = computed(() =>
  items.value.filter((i) => i.nama.toLowerCase().includes(search.value.toLowerCase())),
);

const judul = computed(
  () => ({ CETAK: "Jenis Cetak", SUBLIM: "Jenis Sublim", JAHIT: "Jenis Jahit" })[props.jenis],
);

const fetchData = async () => {
  isLoading.value = true;
  try {
    const res = await kalkulasiFormApi.listBiayaPengerjaan({ jenis: props.jenis, grade: props.grade });
    items.value = res.data.data;
  } catch (e) {
    console.error("Gagal memuat daftar biaya pengerjaan:", e);
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      search.value = "";
      fetchData();
    }
  },
);

const pilih = (item: any) => {
  emit("selected", item);
  emit("update:modelValue", false);
};

const exportExcelJahit = async () => {
  try {
    const { exportExcel } = await import("@/utils/excelExport");
    const cols: any = [
      { header: "Nama", key: "nama", width: 30 },
      { header: "Harga", key: "harga", width: 14, align: "right", numFmt: "#,##0" },
    ];
    if (props.jenis === "JAHIT") {
      cols.push({ header: "RaglanMedium", key: "raglanMedium", width: 14, align: "right", numFmt: "#,##0" });
      cols.push({ header: "RaglanPremium", key: "raglanPremium", width: 14, align: "right", numFmt: "#,##0" });
    }
    await exportExcel(`Biaya_${props.jenis}_${new Date().toISOString().slice(0,10)}.xlsx`, [
      { sheetName: props.jenis, title: `DAFTAR BIAYA ${props.jenis}`, columns: cols, rows: filtered.value },
    ]);
  } catch {}
};
</script>

<template>
  <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" :max-width="jenis==='JAHIT' ? '620px' : '480px'">
    <div class="lookup-card">
      <div class="lookup-header">
        <IconTools :size="15" :stroke-width="1.7" color="white" />
        <span>Cari {{ judul }}</span>
        <v-spacer />
        <button class="lookup-close" @click="emit('update:modelValue', false)">✕</button>
      </div>

      <div class="lookup-search">
        <IconSearch :size="16" :stroke-width="1.7" color="#9e9e9e" />
        <input v-model="search" type="text" placeholder="Cari nama jenis..." class="search-input" autofocus />
        <button v-if="search" class="search-clear" @click="search = ''">✕</button>
      </div>

      <div class="lookup-table-wrap">
        <div v-if="isLoading" class="lookup-state">
          <v-progress-circular indeterminate color="primary" size="24" />
          <span>Memuat data...</span>
        </div>
        <div v-else-if="filtered.length === 0" class="lookup-state">
          <IconDatabaseOff :size="32" :stroke-width="1.3" color="#bdbdbd" />
          <span>{{ search ? `Tidak ada hasil untuk "${search}"` : "Tidak ada data" }}</span>
        </div>
        <table v-else class="lookup-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th style="width: 90px" class="text-right">Harga</th>
              <th v-if="jenis==='JAHIT'" style="width: 90px" class="text-right">RaglanMedium</th>
              <th v-if="jenis==='JAHIT'" style="width: 90px" class="text-right">RaglanPremium</th>
            </tr>
            <tr v-if="filtered.length>0">
              <th colspan="1" style="font-weight:400;font-size:10px;color:#9e9e9e;text-align:center">Click here to define a filter</th>
              <th colspan="1"></th>
              <th v-if="jenis==='JAHIT'"></th>
              <th v-if="jenis==='JAHIT'"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filtered" :key="item.nama" class="lookup-row" @click="pilih(item)">
              <td>{{ item.nama }}</td>
              <td class="text-right">{{ item.harga.toLocaleString("id-ID") }}</td>
              <td v-if="jenis==='JAHIT'" class="text-right">{{ (item.raglanMedium??0).toLocaleString("id-ID") }}</td>
              <td v-if="jenis==='JAHIT'" class="text-right">{{ (item.raglanPremium??0).toLocaleString("id-ID") }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="lookup-footer">
        <button class="btn-export" @click="exportExcelJahit" v-if="filtered.length">⧉ Export to Excel</button>
        <span class="footer-count">{{ filtered.length }} data ditemukan</span>
        <div class="ml-auto" style="display:flex;gap:6px">
          <button class="btn-ok" @click="filtered[0] && pilih(filtered[0])">✓ OK</button>
          <button class="btn-batal" @click="emit('update:modelValue', false)">✕ Close</button>
        </div>
      </div>
    </div>
  </v-dialog>
</template>

<style scoped>
.lookup-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-family: "Segoe UI", system-ui, sans-serif;
  font-size: 12px;
  max-height: 80vh;
}
.lookup-header {
  display: flex;
  align-items: center;
  background: #1565c0;
  color: white;
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.03em;
  flex-shrink: 0;
  gap: 6px;
}
.lookup-close {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 15px;
  cursor: pointer;
  padding: 0 2px;
}
.lookup-close:hover {
  color: white;
}
.lookup-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px;
  color: #212121;
  background: transparent;
}
.search-input::placeholder {
  color: #9e9e9e;
}
.search-clear {
  background: transparent;
  border: none;
  color: #9e9e9e;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}
.search-clear:hover {
  color: #424242;
}
.lookup-table-wrap {
  flex: 1;
  overflow-y: auto;
  min-height: 200px;
}
.lookup-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 16px;
  color: #9e9e9e;
  font-size: 12px;
}
.lookup-table {
  width: 100%;
  border-collapse: collapse;
}
.lookup-table thead tr {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #f5f5f5;
}
.lookup-table th {
  padding: 7px 10px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #424242;
  border-bottom: 2px solid #e0e0e0;
  text-align: left;
  white-space: nowrap;
}
.lookup-table td {
  padding: 6px 10px;
  font-size: 12px;
  border-bottom: 1px solid #f0f0f0;
  color: #212121;
}
.lookup-row {
  cursor: pointer;
  transition: background 0.1s;
}
.lookup-row:hover td {
  background: #e3f2fd;
}
.text-right {
  text-align: right;
}
.lookup-footer {
  display: flex;
  align-items: center;
  padding: 7px 12px;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
  flex-shrink: 0;
  gap: 8px;
}
.footer-count {
  font-size: 11px;
  color: #757575;
  white-space: nowrap;
}
.ml-auto {
  margin-left: auto;
}
.btn-batal {
  background: transparent;
  border: 1px solid #bdbdbd;
  border-radius: 4px;
  padding: 4px 14px;
  font-size: 12px;
  cursor: pointer;
  color: #424242;
}
.btn-batal:hover {
  background: #f0f0f0;
}
.btn-ok {
  background: white;
  border: 1px solid #2e7d32;
  color: #2e7d32;
  border-radius: 4px;
  padding: 4px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.btn-ok:hover {
  background: #e8f5e9;
}
.btn-export {
  background: #e8f5e9;
  border: 1px solid #a5d6a7;
  color: #1b5e20;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
