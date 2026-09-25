<script setup lang="ts">
import { computed } from "vue";
import { kalkulasiFormApi } from "@/api/transaksi/kalkulasiFormApi";

// Komponen generik dipakai ulang untuk Bordir, Polyflex, dan DTF — ketiga
// proses ini identik: 8 baris luas (Panjang x Lebar) x 1 harga satuan,
// dengan pengecekan biaya minimum flat (tbiayapengerjaan.bp_min). Sublim
// dan Cetak TIDAK memakai komponen ini karena logikanya beda (lihat
// KalkulasiTabSublim.vue / KalkulasiTabCetak.vue).
const props = defineProps<{
  proses: "bordir" | "polyflex" | "dtf";
  title: string;
  jenisBiaya: string;
  formData: any;
  recalcTotal: () => void;
  setActiveTab?: (idx: number) => void;
}>();

const data = computed(() => props.formData[props.proses]);

const qty = computed(() =>
  data.value.p.map((p: number, i: number) => (Number(p) || 0) * (Number(data.value.l[i]) || 0)),
);
const qtyTotal = computed(() => qty.value.reduce((s: number, v: number) => s + v, 0));
const totalBiaya = computed(() => qtyTotal.value * (Number(data.value.cmBordir) || 0));

const applyOk = async () => {
  let rp = totalBiaya.value;
  try {
    const res = await kalkulasiFormApi.getBiayaMin(props.jenisBiaya);
    if (rp > 0 && rp < res.data.data.min) rp = res.data.data.min;
  } catch { /* abaikan minimum — tetap fokus ke Tab Kalkulasi di bawah */ }
  data.value.rp = Math.round(rp);
  props.recalcTotal();
  // Selalu kembali fokus ke Tab Kalkulasi (idx 0) walau fetch di atas gagal.
  props.setActiveTab?.(0);
};

const fmt = (v: number) => (Number(v) || 0).toLocaleString("id-ID");
</script>

<template>
  <div class="pa-layout">
    <div class="section-card">
      <div class="sec-title">{{ title }}</div>
      <div class="fr">
        <label class="lbl">Harga Satuan</label>
        <input v-model.number="data.cmBordir" type="number" class="inp tr" style="width: 140px" />
      </div>

      <table class="pa-table">
        <thead>
          <tr>
            <th style="width: 32px" class="text-center">No</th>
            <th class="text-right">Panjang</th>
            <th class="text-right">Lebar</th>
            <th class="text-right">Qty (Luas)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="n in 8" :key="n">
            <td class="text-center td-lbl">{{ n }}</td>
            <td class="p0"><input v-model.number="data.p[n - 1]" type="number" class="cell-inp tr" /></td>
            <td class="p0"><input v-model.number="data.l[n - 1]" type="number" class="cell-inp tr" /></td>
            <td class="text-right td-qty">{{ fmt(qty[n - 1]) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" class="text-right total-label">Total Qty</td>
            <td class="text-right total-val">{{ fmt(qtyTotal) }}</td>
          </tr>
        </tfoot>
      </table>

      <div class="fr mt-2">
        <label class="lbl">Estimasi Biaya</label>
        <input :value="fmt(totalBiaya)" readonly class="inp ro tr" style="width: 160px" />
        <button type="button" class="btn-ok ml-2" @click="applyOk">
          OK — Terapkan ke Ringkasan ({{ fmt(data.rp) }})
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pa-layout {
  padding: 8px;
  font-family: "Segoe UI", system-ui, sans-serif;
  font-size: 11px;
}
.section-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 12px 14px;
  max-width: 520px;
}
.sec-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #1565c0;
  margin-bottom: 8px;
}
.mt-2 {
  margin-top: 10px;
}
.ml-2 {
  margin-left: 8px;
}
.fr {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  min-height: 24px;
}
.lbl {
  width: 100px;
  flex-shrink: 0;
  font-weight: 600;
  color: #424242;
  font-size: 11px;
}
.inp {
  height: 26px;
  border: 1px solid #bdbdbd;
  border-radius: 3px;
  padding: 0 6px;
  font-size: 11px;
  outline: none;
  background: white;
  color: #212121;
  font-family: inherit;
  box-sizing: border-box;
}
.inp:focus {
  border-color: #1565c0;
}
.ro {
  background: #f0f0f0 !important;
  color: #555 !important;
}
.tr {
  text-align: right;
}
.pa-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  margin-top: 4px;
}
.pa-table th {
  background: #f5f5f5;
  padding: 6px 8px;
  font-weight: 700;
  border-bottom: 1px solid #e0e0e0;
}
.pa-table td {
  padding: 3px 4px;
  border-bottom: 1px solid #eee;
}
.td-lbl {
  background: #f5f5f5;
  color: #555;
}
.td-qty {
  padding-right: 8px;
  color: #1565c0;
  font-weight: 600;
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
.text-center {
  text-align: center;
}
.text-right {
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
