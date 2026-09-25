<script setup lang="ts">
import { ref, watch } from "vue";
import { kalkulasiFormApi } from "@/api/transaksi/kalkulasiFormApi";

const props = defineProps<{
  formData: any;
  recalcTotal: () => void;
  recalcKomponenRow: (index: number) => void;
  gridEdit: { index: number; tipe: string };
  setActiveTab: (idx: number) => void;
}>();

const isRib = () => props.gridEdit.tipe === "RIB";

// ── RIB ──
const jenisKainRib = ref("");
const warna = ref<"MUDA" | "SEDANG" | "TUA" | "SUPERTUA">("MUDA");
const ckLeher = ref(false);
const ckLengan = ref(true);
const hargaRib = ref(0);
const babaranRib = ref(0);

const fetchHargaRib = async () => {
  if (!jenisKainRib.value) return;
  const row = props.formData.komponen[props.gridEdit.index];
  const res = await kalkulasiFormApi.getHargaKain({
    jenisKain: jenisKainRib.value,
    warna: warna.value,
    pabrik: row ? row.pabrik : true,
  });
  hargaRib.value = res.data.data.harga;
};
const fetchBabaranRib = async () => {
  const res = await kalkulasiFormApi.getRibBabaran({ leher: ckLeher.value, lengan: ckLengan.value });
  babaranRib.value = res.data.data.babaran;
};

// ── KRAH / MANSET ──
const daftarBahan = ref<{ nama: string; harga: number }[]>([]);
const bahanTerpilih = ref<{ nama: string; harga: number } | null>(null);

const loadDaftarBahan = async () => {
  const res = await kalkulasiFormApi.getKrahManset();
  daftarBahan.value = res.data.data;
  bahanTerpilih.value = daftarBahan.value[0] || null;
};

watch(
  () => props.gridEdit.index,
  async () => {
    if (props.gridEdit.index < 0) return;
    if (isRib()) {
      const row = props.formData.komponen[props.gridEdit.index];
      jenisKainRib.value = row?.jenisKain || props.formData.jenisKainOptions[0] || "";
      warna.value = ["MUDA", "SEDANG", "TUA", "SUPERTUA"].includes(row?.warna) ? row.warna : "MUDA";
      const lengan = String(row?.lengan || "");
      ckLeher.value = lengan.includes("LEHER");
      ckLengan.value = lengan.includes("LENGAN") || lengan === "";
      await fetchHargaRib();
      await fetchBabaranRib();
    } else {
      await loadDaftarBahan();
    }
  },
);
watch([jenisKainRib, warna], () => fetchHargaRib());
watch([ckLeher, ckLengan], () => fetchBabaranRib());

const applyOkRib = () => {
  const idx = props.gridEdit.index;
  const row = props.formData.komponen[idx];
  if (!row) return;
  if (hargaRib.value === 0 || babaranRib.value === 0) {
    // replikasi showmessage peringatan Delphi — tetap lanjut simpan seperti aslinya
  }
  let ribLabel = "LEHER+LENGAN";
  if (ckLeher.value && !ckLengan.value) ribLabel = "LEHER";
  else if (!ckLeher.value && ckLengan.value) ribLabel = "LENGAN";

  row.jenisKain = jenisKainRib.value;
  row.lengan = ribLabel;
  row.warna = warna.value;
  row.babaran = babaranRib.value;
  row.harga = hargaRib.value;
  props.recalcKomponenRow(idx);
  props.recalcTotal();
  props.setActiveTab(0);
};

const applyOkKrahManset = () => {
  const idx = props.gridEdit.index;
  const row = props.formData.komponen[idx];
  if (!row || !bahanTerpilih.value) return;
  row.jenisKain = bahanTerpilih.value.nama;
  row.bruto = bahanTerpilih.value.harga === 0 ? 0 : Math.round(bahanTerpilih.value.harga);
  // Catatan: jalur KRAH/MANSET di Delphi TIDAK memanggil hitungkg (bruto
  // ditulis langsung dari harga terpilih), hanya hitungpabrik utk hitung pcs.
  if (Number(row.bruto) !== 0) {
    row.pcs = row.pabrik
      ? Number(row.bruto) / ((100 + Number(props.formData.ppnGlobal)) / 100)
      : Number(row.bruto);
  }
  props.recalcTotal();
  props.setActiveTab(0);
};
</script>

<template>
  <div class="jk-layout">
    <!-- ── RIB ── -->
    <div v-if="isRib()" class="section-card" style="max-width: 460px">
      <div class="sec-title">Jenis Kain — RIB</div>
      <div class="fr">
        <label class="lbl">Jenis Kain</label>
        <select v-model="jenisKainRib" class="inp flex-1">
          <option v-for="j in formData.jenisKainOptions" :key="j" :value="j">{{ j }}</option>
        </select>
      </div>
      <div class="fr">
        <label class="lbl">Warna</label>
        <label class="radio-lbl"><input type="radio" value="MUDA" v-model="warna" /> Muda</label>
        <label class="radio-lbl"><input type="radio" value="SEDANG" v-model="warna" /> Sedang</label>
        <label class="radio-lbl"><input type="radio" value="TUA" v-model="warna" /> Tua</label>
        <label class="radio-lbl"><input type="radio" value="SUPERTUA" v-model="warna" /> Super Tua</label>
      </div>
      <div class="fr">
        <label class="lbl">Posisi</label>
        <label class="radio-lbl"><input type="checkbox" v-model="ckLeher" /> Leher</label>
        <label class="radio-lbl"><input type="checkbox" v-model="ckLengan" /> Lengan</label>
      </div>
      <div class="fr">
        <label class="lbl">Harga</label>
        <input :value="hargaRib.toLocaleString('id-ID')" readonly class="inp ro tr" style="width: 140px" />
        <label class="lbl ml-2" style="width: 70px">Babaran</label>
        <input :value="babaranRib.toLocaleString('id-ID')" readonly class="inp ro tr" style="width: 100px" />
      </div>
      <div class="fr mt-2">
        <button type="button" class="btn-ok" @click="applyOkRib">OK — Terapkan ke Baris Grid</button>
      </div>
    </div>

    <!-- ── KRAH / MANSET ── -->
    <div v-else class="section-card" style="max-width: 460px">
      <div class="sec-title">Jenis Kain — {{ gridEdit.tipe || "KRAH/MANSET" }}</div>
      <div class="k-tbl-wrap">
        <table class="k-tbl">
          <thead>
            <tr>
              <th>Nama Bahan</th>
              <th style="width: 100px" class="text-right">Harga</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="b in daftarBahan"
              :key="b.nama"
              class="k-row"
              :class="{ selected: bahanTerpilih?.nama === b.nama }"
              @click="bahanTerpilih = b"
            >
              <td>{{ b.nama }}</td>
              <td class="text-right">{{ b.harga.toLocaleString("id-ID") }}</td>
            </tr>
            <tr v-if="daftarBahan.length === 0">
              <td colspan="2" class="text-center text-grey py-4 font-italic">Belum ada data bahan.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="fr mt-2">
        <button type="button" class="btn-ok" :disabled="!bahanTerpilih" @click="applyOkKrahManset">
          OK — Terapkan ke Baris Grid
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.jk-layout {
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
  width: 80px;
  flex-shrink: 0;
  font-weight: 600;
  color: #424242;
  font-size: 11px;
}
.flex-1 {
  flex: 1;
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
.radio-lbl {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: #424242;
  cursor: pointer;
}
.k-tbl-wrap {
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 3px;
}
.k-tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.k-tbl thead th {
  background: #1565c0;
  color: white;
  padding: 6px 8px;
  position: sticky;
  top: 0;
  font-weight: 700;
  text-align: left;
}
.k-tbl td {
  padding: 5px 8px;
  border-bottom: 1px solid #f0f0f0;
}
.k-row {
  cursor: pointer;
}
.k-row:hover td {
  background: #e3f2fd;
}
.k-row.selected td {
  background: #bbdefb;
  font-weight: 700;
}
.text-right {
  text-align: right;
}
.text-center {
  text-align: center;
}
.text-grey {
  color: #9e9e9e;
}
.font-italic {
  font-style: italic;
}
.py-4 {
  padding-top: 16px;
  padding-bottom: 16px;
}
.btn-ok {
  background: #1565c0;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 7px 18px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.btn-ok:hover:not(:disabled) {
  background: #0d47a1;
}
.btn-ok:disabled {
  background: #bdbdbd;
  cursor: not-allowed;
}
</style>
