<script setup lang="ts">
import { computed, ref } from "vue";
import { useToast } from "vue-toastification";
import { IconSearch } from "@tabler/icons-vue";
import { kalkulasiFormApi } from "@/api/transaksi/kalkulasiFormApi";
import BiayaPengerjaanSearchModal from "@/components/transaksi/BiayaPengerjaanSearchModal.vue";

// Cetak BERBEDA dari Bordir/Polyflex/DTF: tiap baris (1-8) punya jenis &
// harga satuan sendiri-sendiri (bukan 1 harga untuk semua baris), dan
// minimum biayanya bertingkat berdasarkan qty order + grade (tmincetak),
// bukan minimum flat. Lihat catatan analisis ufrmKalkulasi.pas poin 4.
const props = defineProps<{
  formData: any;
  recalcTotal: () => void;
  setActiveTab?: (idx: number) => void;
}>();

const toast = useToast();
const showModal = ref(false);
const activeRow = ref(-1);

const cetak = computed(() => props.formData.cetak);
const qty = computed(() =>
  cetak.value.p.map((p: number, i: number) => (Number(p) || 0) * (Number(cetak.value.l[i]) || 0)),
);
const qtyTotal = computed(() => qty.value.reduce((s: number, v: number) => s + v, 0));
const totalBiaya = computed(() =>
  qty.value.reduce((s: number, v: number, i: number) => s + v * (Number(cetak.value.cm[i]) || 0), 0),
);

const openLookup = (idx: number) => {
  activeRow.value = idx;
  showModal.value = true;
};
const onSelected = (item: { nama: string; harga: number }) => {
  if (activeRow.value < 0) return;
  cetak.value.jenis[activeRow.value] = item.nama;
  cetak.value.cm[activeRow.value] = item.harga;
};

const applyOk = async () => {
  for (let i = 0; i < 8; i++) {
    if (!cetak.value.jenis[i] && qty.value[i] !== 0) {
      toast.warning(`Jenis cetak ${i + 1} harus diisi!`);
      return;
    }
  }
  const grade = props.formData.ckMedium ? "medium" : "premium";
  let rp = totalBiaya.value;
  try {
    const res = await kalkulasiFormApi.getMinCetak({ qtyOrder: props.formData.rencanaOrder, grade });
    if (rp > 0 && rp < res.data.data.min) rp = res.data.data.min;
  } catch { /* abaikan minimum — tetap fokus ke Tab Kalkulasi di bawah */ }
  cetak.value.rp = Math.round(rp);
  props.recalcTotal();
  // Selalu kembali fokus ke Tab Kalkulasi (idx 0) walau fetch di atas gagal.
  props.setActiveTab?.(0);
};

const fmt = (v: number) => (Number(v) || 0).toLocaleString("id-ID");
</script>

<template>
  <div class="ct-layout">
    <div class="section-card">
      <div class="sec-title">Cetak</div>
      <table class="ct-table">
        <thead>
          <tr>
            <th style="width: 28px" class="text-center">No</th>
            <th style="width: 160px">Jenis Cetak</th>
            <th class="text-right">Harga Satuan</th>
            <th class="text-right">Panjang</th>
            <th class="text-right">Lebar</th>
            <th class="text-right">Qty (Luas)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="n in 8" :key="n">
            <td class="text-center td-lbl">{{ n }}</td>
            <td class="p0">
              <div class="cell-grp">
                <input v-model="cetak.jenis[n - 1]" class="cell-inp" readonly placeholder="F1 / Cari..." />
                <button type="button" class="ci-lkp" @click="openLookup(n - 1)" title="Cari Jenis Cetak">
                  <IconSearch :size="12" />
                </button>
              </div>
            </td>
            <td class="p0"><input v-model.number="cetak.cm[n - 1]" type="number" class="cell-inp tr" /></td>
            <td class="p0"><input v-model.number="cetak.p[n - 1]" type="number" class="cell-inp tr" /></td>
            <td class="p0"><input v-model.number="cetak.l[n - 1]" type="number" class="cell-inp tr" /></td>
            <td class="text-right td-qty">{{ fmt(qty[n - 1]) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" class="text-right total-label">Total Qty</td>
            <td class="text-right total-val">{{ fmt(qtyTotal) }}</td>
          </tr>
        </tfoot>
      </table>

      <div class="fr mt-2">
        <label class="lbl">Estimasi Biaya</label>
        <input :value="fmt(totalBiaya)" readonly class="inp ro tr" style="width: 160px" />
        <button type="button" class="btn-ok ml-2" @click="applyOk">
          OK — Terapkan ke Ringkasan ({{ fmt(cetak.rp) }})
        </button>
      </div>
    </div>
  </div>

  <BiayaPengerjaanSearchModal v-model="showModal" jenis="CETAK" :grade="formData.ckMedium ? 'medium' : 'premium'" @selected="onSelected" />
</template>

<style scoped>
.ct-layout {
  padding: 8px;
  font-family: "Segoe UI", system-ui, sans-serif;
  font-size: 11px;
}
.section-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 12px 14px;
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
.ro {
  background: #f0f0f0 !important;
  color: #555 !important;
}
.tr {
  text-align: right;
}
.ct-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  margin-top: 4px;
}
.ct-table th {
  background: #f5f5f5;
  padding: 6px 8px;
  font-weight: 700;
  border-bottom: 1px solid #e0e0e0;
}
.ct-table td {
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
