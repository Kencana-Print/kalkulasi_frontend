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

const jenisKain = ref("");
const warna = ref<"MUDA" | "SEDANG" | "TUA" | "SUPERTUA">("MUDA");
const lengan = ref<"PENDEK" | "PANJANG">("PENDEK");
const kolom = ref<1 | 2 | 3 | 4>(1); // ck1..ck4
const harga = ref(0);
const babaran = ref({ normal: 0, xxl: 0, r5570: 0, r5268: 0 });

const bagian = () => (props.gridEdit.tipe === "LENGAN" ? "lengan" : "body");

const fetchBabaranDefault = async () => {
  if (!jenisKain.value) return;
  const res = await kalkulasiFormApi.getGramasi({
    khKode: props.formData.khKode,
    jenisKain: jenisKain.value,
    lengan: lengan.value,
    bagian: bagian(),
  });
  const d = res.data.data;
  babaran.value = { normal: d.babaran, xxl: d.babaranXxl, r5570: d.babaran5570, r5268: d.babaran5268 };
};

const fetchHarga = async () => {
  if (!jenisKain.value) return;
  const row = props.formData.komponen[props.gridEdit.index];
  const res = await kalkulasiFormApi.getHargaKain({
    jenisKain: jenisKain.value,
    warna: warna.value,
    pabrik: row ? row.pabrik : true,
  });
  harga.value = res.data.data.harga;
};

// Dipicu tiap kali F1 ditekan dari grid komponen (baris/index berganti).
watch(
  () => props.gridEdit.index,
  async () => {
    if (props.gridEdit.index < 0) return;
    const row = props.formData.komponen[props.gridEdit.index];
    if (!row?.jenisKain) {
      jenisKain.value = props.formData.jenisKainOptions[0] || "";
      lengan.value = "PENDEK";
      warna.value = "MUDA";
      kolom.value = 1;
      await fetchBabaranDefault();
    } else {
      jenisKain.value = row.jenisKain;
      lengan.value = row.lengan === "PANJANG" ? "PANJANG" : "PENDEK";
      warna.value = ["MUDA", "SEDANG", "TUA", "SUPERTUA"].includes(row.warna) ? row.warna : "MUDA";
      await fetchBabaranDefault();
      const logKolom = (bagian() === "lengan" ? row.logLengan : row.logBody) || 0;
      const nilaiBaris = Number(row.babaran) || 0;
      if (logKolom === 4 && nilaiBaris !== 0) babaran.value.r5268 = nilaiBaris;
      if (logKolom === 3 && nilaiBaris !== 0) babaran.value.r5570 = nilaiBaris;
      if (logKolom === 2 && nilaiBaris !== 0) babaran.value.xxl = nilaiBaris;
      if (logKolom === 1 && nilaiBaris !== 0) babaran.value.normal = nilaiBaris;
      kolom.value = (logKolom || 1) as 1 | 2 | 3 | 4;
    }
    await fetchHarga();
  },
);

const updateCkMedium = (val: string) => {
  const jk = (val || "").trim().toUpperCase();
  // replikasi Delphi: if (leftstr(cbbJeniskain.Text,2)='PE') or (leftstr(cbbJeniskain.Text,5)='PE DK') or (leftstr(cbbJeniskain.Text,5)='HYGIT') or (leftstr(cbbJeniskain.text,6)='DRYFIT') then ckmedium.checked:=True else False
  // LeftStr cek pakai startsWith agar toleran spasi/casing, urutan persis Delphi
  const isMedium =
    jk.substring(0, 2) === "PE" ||
    jk.substring(0, 5) === "PE DK" ||
    jk.substring(0, 5) === "HYGIT" ||
    jk.substring(0, 6) === "DRYFIT";
  props.formData.ckMedium = isMedium;
};

watch([jenisKain, lengan], () => {
  fetchBabaranDefault();
  fetchHarga();
  updateCkMedium(jenisKain.value);
});
watch(warna, () => fetchHarga());
watch(jenisKain, (val) => updateCkMedium(val));

const babaranTerpilih = () =>
  ({ 1: babaran.value.normal, 2: babaran.value.xxl, 3: babaran.value.r5570, 4: babaran.value.r5268 })[kolom.value];

const applyOk = async () => {
  const idx = props.gridEdit.index;
  const row = props.formData.komponen[idx];
  if (!row) return;

  row.jenisKain = jenisKain.value;
  row.lengan = lengan.value;
  row.warna = warna.value;
  row.harga = harga.value;
  const nilaiBabaran = babaranTerpilih();
  row.babaran = nilaiBabaran;
  if (bagian() === "lengan") row.logLengan = kolom.value;
  else row.logBody = kolom.value;

  props.recalcKomponenRow(idx);

  // Grade medium/premium otomatis dari jenis kain — dipakai lintas tab
  // (Jahit/Sublim/Cetak/Margin/Minimum Cetak).
  const jk = jenisKain.value.toUpperCase();
  props.formData.ckMedium =
    jk.startsWith("PE") || jk.startsWith("PE DK") || jk.startsWith("HYGIT") || jk.startsWith("DRYFIT");

  if (bagian() === "body") {
    let ket = "-";
    if (jk.startsWith("PE")) ket = "PE";
    else if (jk.startsWith("HYGIT")) ket = "HYGIT";
    else if (jk.startsWith("DRYFIT")) ket = "DRYFIT";
    try {
      const res = await kalkulasiFormApi.getBiayaTunggal({ jenis: "FINISHING", ket });
      props.formData.rpFinishing = res.data.data.biaya;
    } catch { /* abaikan — tetap fokus ke Tab Kalkulasi di bawah */ }
  }

  if (!props.formData.nomor) {
    try {
      const grade = props.formData.ckMedium ? "medium" : "premium";
      const m = await kalkulasiFormApi.getMargin({ qtyOrder: props.formData.rencanaOrder, grade });
      props.formData.pakaiPersen = m.data.data.pakaiPersen;
      if (m.data.data.pakaiPersen) props.formData.labaPersen = m.data.data.labaPersen;
      else props.formData.rpLaba = m.data.data.laba;
      props.formData.allowancePersen = m.data.data.allowancePersen;
      props.formData.rpKirim = m.data.data.rpKirim;
    } catch { /* abaikan — tetap fokus ke Tab Kalkulasi di bawah */ }
  }
  props.formData.pakaiPersen = true;

  props.recalcTotal();
  // Selalu kembali fokus ke Tab Kalkulasi (idx 0) walau fetch di atas gagal.
  props.setActiveTab(0);
};
</script>

<template>
  <div class="gr-layout">
    <div class="section-card" style="max-width: 480px">
      <div class="sec-title">Gramasi — {{ gridEdit.tipe || "(pilih komponen dulu di grid)" }}</div>

      <div class="fr">
        <label class="lbl">Jenis Kain</label>
        <select v-model="jenisKain" class="inp flex-1">
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
        <label class="lbl">Lengan</label>
        <label class="radio-lbl"><input type="radio" value="PENDEK" v-model="lengan" /> Pendek</label>
        <label class="radio-lbl"><input type="radio" value="PANJANG" v-model="lengan" /> Panjang</label>
      </div>

      <div class="fr">
        <label class="lbl">Harga Kain</label>
        <input :value="harga.toLocaleString('id-ID')" readonly class="inp ro tr" style="width: 140px" />
      </div>

      <div class="sec-title mt-2">Pilih Babaran</div>
      <table class="babaran-table">
        <tbody>
          <tr>
            <td style="width: 24px"><input type="radio" :value="1" v-model="kolom" /></td>
            <td>Normal</td>
            <td class="tr">{{ babaran.normal.toLocaleString("id-ID") }}</td>
          </tr>
          <tr>
            <td><input type="radio" :value="2" v-model="kolom" /></td>
            <td>XXL</td>
            <td class="tr">{{ babaran.xxl.toLocaleString("id-ID") }}</td>
          </tr>
          <tr>
            <td><input type="radio" :value="3" v-model="kolom" /></td>
            <td>55-70</td>
            <td class="tr">{{ babaran.r5570.toLocaleString("id-ID") }}</td>
          </tr>
          <tr>
            <td><input type="radio" :value="4" v-model="kolom" /></td>
            <td>52-68</td>
            <td class="tr">{{ babaran.r5268.toLocaleString("id-ID") }}</td>
          </tr>
        </tbody>
      </table>

      <div class="fr mt-2">
        <button type="button" class="btn-ok" @click="applyOk">OK — Terapkan ke Baris Grid</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gr-layout {
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
.fr {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  min-height: 24px;
}
.lbl {
  width: 90px;
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
.radio-lbl {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: #424242;
  cursor: pointer;
}
.babaran-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.babaran-table td {
  padding: 5px 6px;
  border-bottom: 1px solid #eeeeee;
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
.btn-ok:hover {
  background: #0d47a1;
}
</style>
