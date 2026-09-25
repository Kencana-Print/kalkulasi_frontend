<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { IconSearch } from "@tabler/icons-vue";
import { kalkulasiFormApi } from "@/api/transaksi/kalkulasiFormApi";
import BiayaPengerjaanSearchModal from "@/components/transaksi/BiayaPengerjaanSearchModal.vue";

// Sublim PALING BEDA dari 4 proses lain: tidak ada geometri panjang x
// lebar sama sekali. Tiap slot (1-8) cuma pilihan jenis sublim dengan
// harga siap pakai (dari tbiayapengerjaan.bp_medium/bp_premium), total
// tinggal dijumlah — dan TIDAK ADA pengecekan biaya minimum di tombol OK
// (beda dari Bordir/Cetak/Polyflex/DTF). Lihat catatan analisis poin 4.
const props = defineProps<{
  formData: any;
  recalcTotal: () => void;
  setActiveTab?: (idx: number) => void;
}>();

const showModal = ref(false);
const activeRow = ref(-1);
const ketMinimal = ref("");

const sublim = computed(() => props.formData.sublim);
const total = computed(() => sublim.value.rp.reduce((s: number, v: number) => s + (Number(v) || 0), 0));

onMounted(async () => {
  const res = await kalkulasiFormApi.getKetSublim();
  ketMinimal.value = res.data.data;
});

const openLookup = (idx: number) => {
  activeRow.value = idx;
  showModal.value = true;
};
const onSelected = (item: { nama: string; harga: number }) => {
  if (activeRow.value < 0) return;
  sublim.value.jenis[activeRow.value] = item.nama;
  sublim.value.rp[activeRow.value] = item.harga;
};

const applyOk = () => {
  sublim.value.rpSublim = Math.round(total.value);
  props.recalcTotal();
  props.setActiveTab?.(0);
};

const fmt = (v: number) => (Number(v) || 0).toLocaleString("id-ID");
</script>

<template>
  <div class="sb-layout">
    <div class="section-card">
      <div class="sec-title">Sublim</div>
      <div v-if="ketMinimal" class="hint-banner">Isi dengan --&gt; {{ ketMinimal }}</div>

      <table class="sb-table">
        <thead>
          <tr>
            <th style="width: 28px" class="text-center">No</th>
            <th>Jenis Sublim</th>
            <th style="width: 130px" class="text-right">Harga (Rp)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="n in 8" :key="n">
            <td class="text-center td-lbl">{{ n }}</td>
            <td class="p0">
              <div class="cell-grp">
                <input v-model="sublim.jenis[n - 1]" class="cell-inp" readonly placeholder="F1 / Cari..." />
                <button type="button" class="ci-lkp" @click="openLookup(n - 1)" title="Cari Jenis Sublim">
                  <IconSearch :size="12" />
                </button>
              </div>
            </td>
            <td class="p0"><input v-model.number="sublim.rp[n - 1]" type="number" class="cell-inp tr" /></td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" class="text-right total-label">Total Sublim</td>
            <td class="text-right total-val">{{ fmt(total) }}</td>
          </tr>
        </tfoot>
      </table>

      <div class="fr mt-2">
        <button type="button" class="btn-ok" @click="applyOk">
          OK — Terapkan ke Ringkasan ({{ fmt(sublim.rpSublim) }})
        </button>
      </div>
    </div>
  </div>

  <BiayaPengerjaanSearchModal v-model="showModal" jenis="SUBLIM" :grade="formData.ckMedium ? 'medium' : 'premium'" @selected="onSelected" />
</template>

<style scoped>
.sb-layout {
  padding: 8px;
  font-family: "Segoe UI", system-ui, sans-serif;
  font-size: 11px;
}
.section-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 12px 14px;
  max-width: 480px;
}
.sec-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #1565c0;
  margin-bottom: 8px;
}
.hint-banner {
  background: #fff3e0;
  color: #e65100;
  font-size: 11px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 4px;
  margin-bottom: 8px;
}
.mt-2 {
  margin-top: 10px;
}
.fr {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  min-height: 24px;
}
.sb-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.sb-table th {
  background: #f5f5f5;
  padding: 6px 8px;
  font-weight: 700;
  border-bottom: 1px solid #e0e0e0;
}
.sb-table td {
  padding: 3px 4px;
  border-bottom: 1px solid #eee;
}
.td-lbl {
  background: #f5f5f5;
  color: #555;
}
.p0 {
  padding: 0 !important;
}
.cell-inp {
  width: 100%;
  height: 26px;
  border: 1px solid #ccc;
  border-radius: 3px;
  padding: 0 6px;
  font-size: 11px;
  outline: none;
  background: white;
  box-sizing: border-box;
}
.cell-inp:focus {
  border-color: #1976d2;
}
.cell-grp {
  display: flex;
  align-items: center;
  height: 26px;
  border: 1px solid #ccc;
  border-radius: 3px;
  overflow: hidden;
}
.cell-grp .cell-inp {
  border: none;
  flex: 1;
}
.ci-lkp {
  background: #eeeeee;
  border: none;
  border-left: 1px solid #ccc;
  padding: 0 6px;
  cursor: pointer;
  height: 26px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.ci-lkp:hover {
  background: #e0e0e0;
}
.text-center {
  text-align: center;
}
.text-right,
.tr {
  text-align: right;
}
.total-label {
  font-weight: 700;
  color: #455a64;
  padding: 6px 8px;
}
.total-val {
  font-weight: 700;
  color: #1565c0;
  padding: 6px 8px;
  border-top: 2px solid #546e7a;
}
.btn-ok {
  background: #1565c0;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 14px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}
.btn-ok:hover {
  background: #0d47a1;
}
</style>
