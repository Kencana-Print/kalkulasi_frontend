<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { IconSearch, IconPlus, IconTrash } from "@tabler/icons-vue";
import { kalkulasiFormApi } from "@/api/transaksi/kalkulasiFormApi";
import ModelKerjaSearchModal from "@/components/transaksi/ModelKerjaSearchModal.vue";
import BiayaPengerjaanSearchModal from "@/components/transaksi/BiayaPengerjaanSearchModal.vue";

const props = defineProps<{
  formData: any;
  isEdit: boolean;
  recalcTotal: () => void;
  recalcKomponenRow: (index: number) => void;
  gridEdit: { index: number; tipe: string };
  setActiveTab: (idx: number) => void;
}>();

const toast = useToast();
const isLoadingModel = ref(false);
const showModelKerjaModal = ref(false);

const openModelKerjaModal = () => {
  if (!props.formData.rencanaOrder || Number(props.formData.rencanaOrder) === 0) {
    toast.warning("Qty Order diisi dulu.");
    return;
  }
  showModelKerjaModal.value = true;
};

const onModelKerjaSelected = async (item: { kode: string; nama: string }) => {
  props.formData.khKode = item.kode;
  await loadModelKerja();
};

const loadModelKerja = async () => {
  if (!props.formData.khKode?.trim()) return;
  isLoadingModel.value = true;
  try {
    const res = await kalkulasiFormApi.getModelKerja(props.formData.khKode);
    const d = res.data.data;
    props.formData.khNama = d.nama;
    props.formData.warna = d.warna;
    props.formData.rpPotong = d.biayaPotong;
    props.formData.bordir.cmBordir = d.cmBordir;
    props.formData.polyflex.cmBordir = d.cmPolyflex;
    props.formData.dtf.cmBordir = d.cmDtf;
    props.formData.jenisKainOptions = d.jenisKainOptions;
    props.recalcTotal();
  } catch (e: any) {
    toast.error(e.response?.data?.message ?? "Model tsb belum ada.");
    props.formData.khNama = "";
  } finally {
    isLoadingModel.value = false;
  }
};

// ── Grid Komponen Bahan ──
const addKomponenRow = () => {
  props.formData.komponen.push({
    komponen: "", kg: true, pabrik: true, jenisKain: "", lengan: "", warna: "",
    harga: 0, babaran: 0, bruto: 0, kebutuhan: 0, pcs: 0, logBody: 0, logLengan: 0,
  });
};
const removeKomponenRow = (idx: number) => {
  props.formData.komponen.splice(idx, 1);
  props.recalcTotal();
};
const onKomponenChange = (idx: number) => {
  const row = props.formData.komponen[idx];
  if (Number(row.babaran) === 0) {
    row.kg = true;
    row.pabrik = true;
  }
};
// Qty Order diganti → jalankan prosedur margin Delphi (tmargin /
// tallowance / tbiayakirim bertingkat per qty + grade): isi Laba,
// Allowance %, dan Biaya Kirim, lalu hitung ulang total.
// Sama seperti di applyOk Gramasi: hanya dokumen baru (nomor masih kosong)
// supaya tidak menimpa nilai tersimpan saat Ubah.
const onQtyOrderChange = async () => {
  if (props.formData.nomor) {
    props.recalcTotal();
    return;
  }
  try {
    const grade = props.formData.ckMedium ? "medium" : "premium";
    const m = await kalkulasiFormApi.getMargin({ qtyOrder: props.formData.rencanaOrder, grade });
    props.formData.pakaiPersen = m.data.data.pakaiPersen;
    if (m.data.data.pakaiPersen) props.formData.labaPersen = m.data.data.labaPersen;
    else props.formData.rpLaba = m.data.data.laba;
    props.formData.allowancePersen = m.data.data.allowancePersen;
    props.formData.rpKirim = m.data.data.rpKirim;
  } catch { /* abaikan — total tetap dihitung ulang di bawah */ }
  props.formData.pakaiPersen = true;
  props.recalcTotal();
};

// F1 pada baris grid: BODY/LENGAN → Tab Gramasi, RIB/KRAH/MANSET → Tab Jenis Kain
const openLookupUntukBaris = (idx: number) => {
  const komponen = (props.formData.komponen[idx]?.komponen || "").toUpperCase();
  if (!komponen) {
    toast.warning("Pilih Komponen terlebih dahulu.");
    return;
  }
  props.gridEdit.index = idx;
  props.gridEdit.tipe = komponen;
  if (komponen === "BODY" || komponen === "LENGAN") props.setActiveTab(1);
  else props.setActiveTab(2);
};
const onFlagChange = (idx: number) => {
  props.recalcKomponenRow(idx);
  props.recalcTotal();
};
// Harga Bahan+Ppn diketik bebas → Bruto & Rp/Pcs ikut rumus (hitungkg + hitungpabrik)
const onHargaChange = (idx: number) => {
  props.recalcKomponenRow(idx);
  props.recalcTotal();
};

// ── Jahit (F1 picker, harga bisa termasuk surcharge raglan) ──
const showJahitModal = ref(false);
const jahitHargaDasar = ref(0);
const jahitRaglanMedium = ref(0);
const jahitRaglanPremium = ref(0);

const onJahitSelected = (item: { nama: string; harga: number; raglanMedium?: number; raglanPremium?: number }) => {
  props.formData.jahit = item.nama;
  jahitHargaDasar.value = item.harga;
  jahitRaglanMedium.value = item.raglanMedium || 0;
  jahitRaglanPremium.value = item.raglanPremium || 0;
  applyJahitHarga();
};

const applyJahitHarga = () => {
  const raglan = props.formData.ckMedium ? jahitRaglanMedium.value : jahitRaglanPremium.value;
  props.formData.rpRaglan = raglan;
  props.formData.rpJahit = Math.round(jahitHargaDasar.value + (props.formData.raglan ? raglan : 0));
  props.recalcTotal();
};

// Toggle raglan setelah jahit sudah dipilih — dihitung ulang dari harga
// dasar (bukan tambah/kurang inkremental spt Delphi) supaya tidak drift.
watch(
  () => props.formData.raglan,
  () => {
    if (jahitHargaDasar.value > 0) applyJahitHarga();
  },
);

// ── Resize lebar kolom grid Komponen ala Excel (drag garis kanan header).
// Lebar tersimpan di localStorage sehingga bertahan antar sesi. ──
const komponenTableRef = ref<HTMLTableElement | null>(null);
const COLW_KEY = "kalkulasi-komponen-colwidths";

const loadColWidths = () => {
  try {
    const saved: Record<string, string> = JSON.parse(localStorage.getItem(COLW_KEY) || "{}");
    komponenTableRef.value?.querySelectorAll("thead th").forEach((th) => {
      const key = (th as HTMLElement).dataset.col;
      if (key && saved[key]) (th as HTMLElement).style.width = saved[key];
    });
  } catch { /* abaikan */ }
};

const saveColWidths = () => {
  try {
    const out: Record<string, string> = {};
    komponenTableRef.value?.querySelectorAll("thead th").forEach((th) => {
      const key = (th as HTMLElement).dataset.col;
      if (key) out[key] = (th as HTMLElement).style.width || "";
    });
    localStorage.setItem(COLW_KEY, JSON.stringify(out));
  } catch { /* abaikan */ }
};

const EDGE_PX = 8;

const isNearEdge = (e: MouseEvent, thEl: HTMLElement) => {
  const r = thEl.getBoundingClientRect();
  return r.right - e.clientX <= EDGE_PX || e.clientX - r.left <= EDGE_PX;
};

const initColResize = () => {
  const table = komponenTableRef.value;
  if (!table) return;
  table.querySelectorAll("thead th").forEach((th) => {
    const el = th as HTMLElement;
    // Fallback utama: deteksi tepi langsung di th (tidak bergantung pada
    // span grip / posisi absolute yang rapuh di border-collapse: collapse).
    // Ini yang membuat cursor col-resize selalu muncul walau grip ter-clip.
    if (!el.dataset.edgeBound) {
      el.dataset.edgeBound = "1";
      el.addEventListener("mousemove", (e) => {
        el.style.cursor = isNearEdge(e as MouseEvent, el) ? "col-resize" : "";
      });
      el.addEventListener("mouseleave", () => (el.style.cursor = ""));
      el.addEventListener("mousedown", (e) => {
        if (isNearEdge(e as MouseEvent, el)) startColResize(e as MouseEvent, el);
      });
    }
    if (el.querySelector(":scope > .col-grip")) return;
    const grip = document.createElement("span");
    grip.className = "col-grip";
    // Tiru atribut scope Vue ([data-v-xxx]) dari th agar CSS scoped tetap nempel
    // — ini akar masalah sebelumnya: grip buatan JS tidak punya atribut scope
    // sehingga tidak ber-style (lebar 0, cursor tidak berubah).
    for (const a of Array.from(el.attributes)) {
      if (a.name.startsWith("data-v-")) grip.setAttribute(a.name, "");
    }
    grip.title = "Geser untuk ubah lebar kolom";
    el.appendChild(grip);
    grip.addEventListener("mousedown", (e) => startColResize(e, el));
  });
};

const startColResize = (e: MouseEvent, thEl: HTMLElement) => {
  const table = komponenTableRef.value;
  if (!table) return;
  e.preventDefault();
  e.stopPropagation();
  // Kunci layout supaya drag presisi & kolom lain tidak ikut bergeser acak
  table.style.tableLayout = "fixed";
  table.style.width = `${table.offsetWidth}px`;
  const startX = e.clientX;
  const startW = thEl.offsetWidth;
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
  const onMove = (ev: MouseEvent) => {
    thEl.style.width = `${Math.max(30, startW + ev.clientX - startX)}px`;
    thEl.style.minWidth = thEl.style.width;
  };
  const onUp = () => {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    thEl.style.minWidth = "";
    // Biarkan table-layout fixed agar lebar hasil drag dihormati browser
    saveColWidths();
  };
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
};

const onGripMouseDown = (e: MouseEvent) => {
  const thEl = (e.currentTarget as HTMLElement).parentElement as HTMLElement;
  if (thEl) startColResize(e, thEl);
};

// Data lama (mode edit) sudah punya jahit+rpJahit dari backend tapi belum
// punya jahitHargaDasar lokal — backfill sekali supaya toggle raglan tetap
// konsisten tanpa harus pilih ulang jenis jahit.
onMounted(() => {
  loadColWidths();
  initColResize();
  if (props.formData.jahit && props.formData.rpJahit) {
    jahitHargaDasar.value = props.formData.raglan
      ? Number(props.formData.rpJahit) - Number(props.formData.rpRaglan)
      : Number(props.formData.rpJahit);
  }
});

// ── Grid Aksesoris ──
const addAksesorisRow = () => {
  props.formData.aksesories.push({ aksesories: "", biaya: 0 });
};
const removeAksesorisRow = (idx: number) => {
  props.formData.aksesories.splice(idx, 1);
  props.recalcTotal();
};

// Nominal (Rp) tampil bulat tanpa koma + pemisah ribuan.
// Pengecualian (tetap boleh koma): Babaran grid, Allowance %, Laba %, PPN %
// — keempatnya tidak lewat fmt() ini.
const fmt = (v: any) => Math.round(Number(v) || 0).toLocaleString("id-ID");

// Edit +PPN → hitung mundur Rp Penyesuaian (kebalikan rumus Delphi di
// recalcSesuaiPpn: rpSesuai = rpSesuaiPpn / (1 + ppn/100)).
// Watch rpSesuai di parent otomatis recalc maju utk normalisasi tampilan.
const onSesuaiPpnChange = () => {
  const fd = props.formData;
  const ppn = Number(fd.ppn) || 0;
  const total = Number(fd.rpSesuaiPpn) || 0;
  // Tandai agar watcher parent melewati 1x recalc maju — nilai +PPN
  // ketikan user dipertahankan apa adanya (yang disimpan ke Minta Harga).
  // Flag hanya dipasang kalau rpSesuai benar berubah (kalau sama watcher
  // tidak jalan sehingga flag basi tidak boleh tertinggal).
  const baru = ppn === 0 ? Math.round(total) : Math.round(total / (1 + ppn / 100));
  if (baru !== Number(fd.rpSesuai)) {
    fd.skipSesuaiPpnOnce = true;
    fd.rpSesuai = baru;
  }
};
</script>

<template>
  <div class="km-layout">
    <!-- ── Kolom kiri: identitas + grid komponen + total/HPP ── -->
    <div class="km-left">
      <div class="section-card">
        <div class="sec-title">Identitas Kalkulasi</div>

        <div class="fr">
          <label class="lbl">No. Kalkulasi</label>
          <input :value="formData.nomor || '(Otomatis)'" readonly class="inp ro" style="flex: 1; max-width: 220px; font-weight: 700; color: #1565c0" />
          <label class="lbl ml-2" style="width: 60px">Tanggal</label>
          <input v-model="formData.tanggal" type="date" class="inp" style="width: 150px" />
        </div>

        <div class="fr">
          <label class="lbl">Model Kerja</label>
          <div class="igrp" style="width: 160px">
            <input
              v-model="formData.khKode"
              class="inp text-uppercase"
              placeholder="Kode Model"
              :disabled="isEdit"
              @blur="loadModelKerja"
            />
            <button type="button" class="blkp" title="Cari Model Kerja" :disabled="isEdit" @mousedown.prevent="openModelKerjaModal">
              <IconSearch :size="13" color="#1565c0" />
            </button>
          </div>
          <input :value="formData.khNama" readonly class="inp ro ml-2" style="flex: 1" placeholder="Nama Model" />
          <label class="lbl ml-2" style="width: 55px">Warna</label>
          <input :value="formData.warna" readonly class="inp ro" style="width: 100px" />
        </div>

        <div class="fr">
          <label class="lbl">Customer</label>
          <input v-model="formData.cus" class="inp" style="flex: 1" />
        </div>
        <div class="fr">
          <label class="lbl">Project</label>
          <input v-model="formData.project" class="inp" style="flex: 1" />
        </div>
        <div class="fr">
          <label class="lbl">Qty Order</label>
          <input v-model.number="formData.rencanaOrder" type="number" class="inp text-right" style="width: 140px" @change="onQtyOrderChange" />
          <label class="lbl ml-2" style="width:auto;gap:6px">
            <input type="checkbox" :checked="formData.ckMedium" disabled style="accent-color:#1565c0;width:14px;height:14px" />
            <span :style="{fontWeight: formData.ckMedium?700:400, color: formData.ckMedium?'#1565c0':'#616161'}">Medium</span>
            <span style="color:#9e9e9e">/</span>
            <span :style="{fontWeight: !formData.ckMedium?700:400, color: !formData.ckMedium?'#e65100':'#616161'}">Premium</span>
          </label>
          <span v-if="formData.divisi" class="badge-legacy ml-2">Divisi: {{ formData.divisi }}</span>
        </div>
      </div>

      <div class="section-card mt-2 flex-grow-1">
        <div class="sec-title d-flex justify-space-between align-center">
          <span>Komponen Bahan</span>
          <button type="button" class="btn-action blue" @click="addKomponenRow">
            <IconPlus :size="13" class="mr-1" /> Tambah Baris
          </button>
        </div>
        <div class="ll-table-wrap">
          <table ref="komponenTableRef" class="ll-table ll-table-wide">
            <thead>
              <tr>
                <th data-col="no" style="width: 32px" class="text-center">No<span class="col-grip" title="Geser untuk ubah lebar kolom" @mousedown="onGripMouseDown" /></th>
                <th data-col="komponen" style="width: 90px">Komponen<span class="col-grip" title="Geser untuk ubah lebar kolom" @mousedown="onGripMouseDown" /></th>
                <th data-col="kg" style="width: 44px" class="text-center">Kg<span class="col-grip" title="Geser untuk ubah lebar kolom" @mousedown="onGripMouseDown" /></th>
                <th data-col="pabrik" style="width: 50px" class="text-center">Pabrik<span class="col-grip" title="Geser untuk ubah lebar kolom" @mousedown="onGripMouseDown" /></th>
                <th data-col="jeniskain" style="width: 180px">Jenis Kain<span class="col-grip" title="Geser untuk ubah lebar kolom" @mousedown="onGripMouseDown" /></th>
                <th data-col="lengan" style="width: 80px">Lengan/Rib<span class="col-grip" title="Geser untuk ubah lebar kolom" @mousedown="onGripMouseDown" /></th>
                <th data-col="warna" style="width: 80px">Warna<span class="col-grip" title="Geser untuk ubah lebar kolom" @mousedown="onGripMouseDown" /></th>
                <th data-col="harga" style="width: 80px" class="text-right">Harga Bahan+Ppn<span class="col-grip" title="Geser untuk ubah lebar kolom" @mousedown="onGripMouseDown" /></th>
                <th data-col="babaran" style="width: 50px" class="text-right">Babaran<span class="col-grip" title="Geser untuk ubah lebar kolom" @mousedown="onGripMouseDown" /></th>
                <th data-col="bruto" style="width: 90px" class="text-right">Bruto<span class="col-grip" title="Geser untuk ubah lebar kolom" @mousedown="onGripMouseDown" /></th>
                <th data-col="pcs" style="width: 90px" class="text-right">Rp / Pcs<span class="col-grip" title="Geser untuk ubah lebar kolom" @mousedown="onGripMouseDown" /></th>
                <th data-col="kebutuhan" style="width: 90px" class="text-right">Kebutuhan Kain<span class="col-grip" title="Geser untuk ubah lebar kolom" @mousedown="onGripMouseDown" /></th>
                <th data-col="aksi" style="width: 40px" class="text-center">Aksi<span class="col-grip" title="Geser untuk ubah lebar kolom" @mousedown="onGripMouseDown" /></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in formData.komponen" :key="idx">
                <td class="ll-td-ctr ll-td-lbl">{{ Number(idx) + 1 }}</td>
                <td class="ll-td-inp">
                  <select v-model="row.komponen" class="ll-cell" @change="onKomponenChange(Number(idx))">
                    <option value=""></option>
                    <option v-for="k in formData.komponenOptions" :key="k" :value="k">{{ k }}</option>
                  </select>
                </td>
                <td class="ll-td-ctr">
                  <input type="checkbox" v-model="row.kg" @change="onFlagChange(Number(idx))" style="accent-color: #1565c0" />
                </td>
                <td class="ll-td-ctr">
                  <input type="checkbox" v-model="row.pabrik" @change="onFlagChange(Number(idx))" style="accent-color: #1565c0" />
                </td>
                <td class="ll-td-inp">
                  <div class="cell-grp">
                    <input v-model="row.jenisKain" class="ll-cell" placeholder="ketik/F1 utk pilih" />
                    <button type="button" class="ci-lkp" @mousedown.prevent="openLookupUntukBaris(Number(idx))" title="Cari">
                      <IconSearch :size="12" />
                    </button>
                  </div>
                </td>
                <td class="ll-td-inp"><input :value="row.lengan" readonly class="ll-cell" /></td>
                <td class="ll-td-inp"><input :value="row.warna" readonly class="ll-cell" /></td>
                <td class="ll-td-inp"><input v-model.number="row.harga" type="number" class="ll-cell tr" @change="onHargaChange(Number(idx))" /></td>
                <td class="ll-td-inp"><input :value="row.babaran" readonly class="ll-cell tr" /></td>
                <td class="ll-td-inp"><input :value="fmt(row.bruto)" readonly class="ll-cell tr" /></td>
                <td class="ll-td-inp"><input :value="fmt(row.pcs)" readonly class="ll-cell tr font-weight-bold" /></td>
                <td class="ll-td-inp"><input :value="fmt(row.kebutuhan)" readonly class="ll-cell tr" /></td>
                <td class="ll-td-ctr">
                  <button type="button" class="btn-del" @click="removeKomponenRow(Number(idx))" title="Hapus Baris">
                    <IconTrash :size="14" />
                  </button>
                </td>
              </tr>
              <tr v-if="formData.komponen.length === 0">
                <td colspan="13" class="text-center text-grey py-4 font-italic">Belum ada komponen bahan.</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="10" class="text-right total-label">Total Bahan (a)</td>
                <td class="text-right total-val">{{ fmt(formData.totBahan) }}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div class="section-card mt-2">
        <div class="sec-title">Total &amp; HPP</div>
        <div class="hpp-grid">
          <div class="hpp-item">
            <label class="lbl">Allowance % (b)</label>
            <input v-model.number="formData.allowancePersen" type="number" step="any" class="inp tr flex-1" @change="recalcTotal" />
          </div>
          <div class="hpp-item">
            <label class="lbl">Rp Allowance</label>
            <input :value="fmt(formData.rpAllowance)" readonly class="inp ro tr flex-1" />
          </div>
          <div class="hpp-item">
            <label class="lbl">Total Bahan (c=a+b)</label>
            <input :value="fmt(formData.totBahan2)" readonly class="inp ro tr flex-1" />
          </div>
          <div class="hpp-item">
            <label class="lbl">HPP (h=c+d+e+f+g)</label>
            <input :value="fmt(formData.hpp)" readonly class="inp ro tr flex-1" style="font-weight: 700; color: #1565c0" />
          </div>
          <div class="hpp-item">
            <label class="lbl">Laba % (i)</label>
            <input type="checkbox" v-model="formData.pakaiPersen" style="accent-color: #1565c0" @change="recalcTotal" />
            <input
              v-model.number="formData.labaPersen"
              type="number"
              step="any"
              class="inp tr flex-1"
              :disabled="!formData.pakaiPersen"
              @change="recalcTotal"
            />
          </div>
          <div class="hpp-item">
            <label class="lbl">Rp Laba</label>
            <input
              v-model.number="formData.rpLaba"
              type="number"
              class="inp tr flex-1"
              :disabled="formData.pakaiPersen"
              @change="recalcTotal"
            />
          </div>
          <div class="hpp-item">
            <label class="lbl">Harga Jual (h+i)</label>
            <input :value="fmt(formData.hargaJual)" readonly class="inp ro tr flex-1" style="font-weight: 700; font-size: 13px; color: #2e7d32" />
          </div>
          <div class="hpp-item">
            <label class="lbl">Rp Penyesuaian</label>
            <input v-model.number="formData.rpSesuai" type="number" class="inp tr flex-1" />
          </div>
          <div class="hpp-item">
            <label class="lbl">PPN %</label>
            <input v-model.number="formData.ppn" type="number" step="any" class="inp tr flex-1" />
          </div>
          <div class="hpp-item">
            <label class="lbl">+PPN</label>
            <input v-model.number="formData.rpSesuaiPpn" type="number" class="inp tr flex-1" @change="onSesuaiPpnChange" />
          </div>
        </div>
      </div>
    </div>

    <!-- ── Kolom kanan: rekap biaya proses + grid aksesoris + catatan ── -->
    <div class="km-right">
      <div class="section-card">
        <div class="sec-title">Biaya Pengerjaan <span style="font-weight:400;text-transform:none;letter-spacing:0;color:#616161;font-size:10px">— bisa isi manual atau dari tab proses</span></div>
        <div class="fr"><label class="lbl">Potong</label><input v-model.number="formData.rpPotong" type="number" class="inp tr flex-1" @input="recalcTotal" @change="recalcTotal" /></div>
        <div class="fr"><label class="lbl">Bordir</label><input v-model.number="formData.bordir.rp" type="number" class="inp tr flex-1" @input="recalcTotal" @change="recalcTotal" /></div>
        <div class="fr"><label class="lbl">Cetak</label><input v-model.number="formData.cetak.rp" type="number" class="inp tr flex-1" @input="recalcTotal" @change="recalcTotal" /></div>
        <div class="fr"><label class="lbl">Sublim</label><input v-model.number="formData.sublim.rpSublim" type="number" class="inp tr flex-1" @input="recalcTotal" @change="recalcTotal" /></div>
        <div class="fr"><label class="lbl">Polyflex</label><input v-model.number="formData.polyflex.rp" type="number" class="inp tr flex-1" @input="recalcTotal" @change="recalcTotal" /></div>
        <div class="fr"><label class="lbl">DTF</label><input v-model.number="formData.dtf.rp" type="number" class="inp tr flex-1" @input="recalcTotal" @change="recalcTotal" /></div>
        <div class="fr">
          <label class="lbl">Jahit</label>
          <label class="lbl" style="width:auto;gap:4px;margin-left:2px">
            <input type="checkbox" v-model="formData.raglan" style="accent-color: #1565c0; width:13px; height:13px" />
            <span>Raglan</span>
          </label>
          <button type="button" class="btn-lookup flex-1 ml-1" @click="showJahitModal = true" :title="formData.jahit || 'Klik untuk pilih Biaya Jahit (F1)'">
            <IconSearch :size="13" color="#1565c0" style="flex-shrink:0" />
            <span class="lookup-text">{{ formData.jahit || "Pilih Biaya Jahit..." }}</span>
            <span class="lookup-help">Help ▾</span>
          </button>
          <input v-model.number="formData.rpJahit" type="number" class="inp tr" style="width:110px;flex-shrink:0" @input="recalcTotal" @change="recalcTotal" />
        </div>
        <div class="fr"><label class="lbl">Finishing</label><input v-model.number="formData.rpFinishing" type="number" class="inp tr flex-1" @input="recalcTotal" @change="recalcTotal" /></div>
        <div class="fr"><label class="lbl">Tenaga Cetak</label><input v-model.number="formData.rpTenagaCetak" type="number" class="inp tr flex-1" @input="recalcTotal" @change="recalcTotal" /></div>
        <div class="fr total-biaya-row"><label class="lbl">Total Biaya (d)</label><input :value="fmt(formData.totBiaya)" readonly class="inp ro tr flex-1 total-biaya-val" /></div>
      </div>

      <div class="section-card mt-2">
        <div class="sec-title">Biaya Obat &amp; Kirim</div>
        <div class="fr">
          <label class="lbl">Biaya Obat (e)</label>
          <input type="checkbox" v-model="formData.pakaiObat" style="accent-color: #1565c0" />
          <input v-model.number="formData.rpBiayaObat" type="number" class="inp tr flex-1 ml-2" @input="recalcTotal" @change="recalcTotal" />
        </div>
        <div class="fr"><label class="lbl">Biaya Kirim (f)</label><input v-model.number="formData.rpKirim" type="number" class="inp tr flex-1" @input="recalcTotal" @change="recalcTotal" /></div>
      </div>

      <div class="section-card mt-2">
        <div class="sec-title d-flex justify-space-between align-center">
          <span>Aksesoris</span>
          <button type="button" class="btn-action blue" @click="addAksesorisRow">
            <IconPlus :size="13" class="mr-1" /> Tambah
          </button>
        </div>
        <div class="ll-table-wrap">
          <table class="ll-table">
            <thead>
              <tr>
                <th style="width: 28px" class="text-center">No</th>
                <th>Aksesoris</th>
                <th style="width: 90px" class="text-right">Biaya</th>
                <th style="width: 36px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in formData.aksesories" :key="idx">
                <td class="ll-td-ctr ll-td-lbl">{{ Number(idx) + 1 }}</td>
                <td class="ll-td-inp"><input v-model="row.aksesories" class="ll-cell" /></td>
                <td class="ll-td-inp"><input v-model.number="row.biaya" type="number" class="ll-cell tr" @input="recalcTotal" @change="recalcTotal" /></td>
                <td class="ll-td-ctr">
                  <button type="button" class="btn-del" @click="removeAksesorisRow(Number(idx))">
                    <IconTrash :size="13" />
                  </button>
                </td>
              </tr>
              <tr v-if="formData.aksesories.length === 0">
                <td colspan="4" class="text-center text-grey py-2 font-italic">Belum ada aksesoris.</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" class="text-right total-label">Total Aksesoris (g)</td>
                <td class="text-right total-val">{{ fmt(formData.totAksesories) }}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div class="section-card mt-2">
        <div class="sec-title">Catatan</div>
        <label class="lbl mb-1" style="width: auto">Keterangan Produksi/Marketing</label>
        <textarea v-model="formData.ket" class="ket-textarea" style="height: 70px" />
        <label class="lbl mb-1 mt-2" style="width: auto">Keterangan Pembelian</label>
        <textarea v-model="formData.ketBeli" class="ket-textarea" style="height: 60px" />
        <div class="fr mt-2">
          <label class="lbl" style="width: auto">
            <input type="checkbox" v-model="formData.ckCancel" style="accent-color: #d32f2f" /> Cancel
          </label>
          <label class="lbl ml-3" style="width: auto">
            <input type="checkbox" v-model="formData.ckUpdate" style="accent-color: #1565c0" /> Update ke Permintaan Harga
          </label>
        </div>
      </div>
    </div>
  </div>

  <ModelKerjaSearchModal v-model="showModelKerjaModal" @selected="onModelKerjaSelected" />
  <BiayaPengerjaanSearchModal
    v-model="showJahitModal"
    jenis="JAHIT"
    :grade="formData.ckMedium ? 'medium' : 'premium'"
    @selected="onJahitSelected"
  />
</template>

<style scoped>
.km-layout {
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 10px;
  font-family: "Segoe UI", system-ui, sans-serif;
  font-size: 11px;
  height: 100%;
  overflow: hidden;
}
.km-left,
.km-right {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  padding-right: 2px;
}
.flex-grow-1 {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}
.total-biaya-row {
  border-top: 2px solid #546e7a;
  padding-top: 6px;
  margin-top: 6px;
}
.total-biaya-val {
  font-weight: 700;
  color: #1565c0 !important;
}
.section-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 10px 12px;
}
.sec-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #1565c0;
  margin-bottom: 8px;
}
.fr {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 4px;
  min-height: 24px;
}
.hpp-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 14px;
}
.hpp-item {
  display: flex;
  align-items: center;
  gap: 5px;
  min-height: 24px;
  min-width: 0;
}
.hpp-item .lbl {
  width: 128px;
}
.hpp-item .inp {
  min-width: 0;
}
.lbl {
  width: 100px;
  flex-shrink: 0;
  font-weight: 600;
  color: #424242;
  white-space: nowrap;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.inp {
  height: 24px;
  border: 1px solid #bdbdbd;
  border-radius: 3px;
  padding: 0 5px;
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
.inp:disabled {
  background: #f5f5f5;
  color: #9e9e9e;
}
.ro {
  background: #f0f0f0 !important;
  color: #555 !important;
}
.flex-1 {
  flex: 1;
}
.text-right,
.tr {
  text-align: right;
}
.total-label {
  font-weight: 700;
  color: #455a64;
  padding: 6px 8px;
  background: #f5f5f5;
}
.total-val {
  font-weight: 700;
  color: #1565c0;
  padding: 6px 8px;
  border-top: 2px solid #546e7a;
}
.text-uppercase {
  text-transform: uppercase;
}
.igrp {
  display: flex;
  border: 1px solid #bdbdbd;
  border-radius: 3px;
  overflow: hidden;
  height: 26px;
  background: white;
}
.igrp .inp {
  border: none;
  height: 24px;
  flex: 1;
}
.blkp {
  width: 26px;
  min-width: 26px;
  flex-shrink: 0;
  background: #e3f2fd;
  border: none;
  border-left: 1px solid #bdbdbd;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.blkp:hover:not(:disabled) {
  background: #bbdefb;
}
.blkp:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.ml-1 {
  margin-left: 4px;
}
.ml-2 {
  margin-left: 8px;
}
.ml-3 {
  margin-left: 12px;
}
.mt-2 {
  margin-top: 8px;
}
.mb-1 {
  margin-bottom: 4px;
}
.mr-1 {
  margin-right: 3px;
}
.d-flex {
  display: flex;
}
.justify-space-between {
  justify-content: space-between;
}
.align-center {
  align-items: center;
}
.badge-legacy {
  background: #e3f2fd;
  border: 1px solid #64b5f6;
  color: #1565c0;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 3px;
  white-space: nowrap;
}
.btn-action {
  color: white;
  border: none;
  padding: 5px 12px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}
.btn-action.blue {
  background: #1976d2;
}
.btn-action.blue:hover {
  background: #1565c0;
}
.btn-del {
  background: transparent;
  color: #d32f2f;
  border: none;
  cursor: pointer;
  padding: 2px;
}
.btn-del:hover {
  background: #ffebee;
  border-radius: 3px;
}
.ll-table-wrap {
  flex: 1;
  overflow: auto;
  border: 1px solid #e0e0e0;
  border-radius: 3px;
  min-height: 120px;
}
.ll-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}
/* Grid komponen lebar → scroll horizontal, kolom tidak gepeng */
.ll-table-wide {
  min-width: 1010px;
}
.ll-table-wide thead th {
  position: sticky;
  user-select: none;
  overflow: visible;
}
/* Gagang drag di sisi kanan tiap header — ala Excel */
.col-grip {
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 100%;
  cursor: col-resize;
  z-index: 3;
  display: block;
  touch-action: none;
}
/* Selalu beri petunjuk saat header di-hover, bukan cuma saat gagang di-hover */
.ll-table-wide thead th:hover .col-grip,
.col-grip:hover,
.col-grip:active {
  background: rgba(255, 235, 59, 0.7);
}
.ll-table thead th {
  background: #1565c0;
  color: white;
  font-weight: 600;
  padding: 6px;
  position: sticky;
  top: 0;
  z-index: 1;
  font-size: 10px;
  border: 1px solid #0d47a1;
}
.ll-table td {
  border: 1px solid #eeeeee;
}
.ll-table tr:nth-of-type(even) td {
  background: #fafafa;
}
.ll-table tr:hover td {
  background: #e3f2fd !important;
}
.ll-td-lbl {
  padding: 4px 6px;
  background: #f5f5f5 !important;
  color: #424242;
}
.ll-td-inp {
  padding: 0;
}
.ll-td-ctr {
  text-align: center;
}
.ll-cell {
  width: 100%;
  height: 26px;
  border: none;
  background: transparent;
  outline: none;
  font-size: 11px;
  padding: 0 6px;
  font-family: inherit;
  color: #212121;
  box-sizing: border-box;
}
.ll-cell:focus {
  background: #e3f2fd;
}
.cell-grp {
  display: flex;
  align-items: center;
  height: 26px;
}
.cell-grp .ll-cell {
  flex: 1;
}
.ci-lkp {
  background: #eeeeee;
  border: none;
  border-left: 1px solid #e0e0e0;
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
.text-grey {
  color: #9e9e9e;
}
.font-italic {
  font-style: italic;
}
.font-weight-bold {
  font-weight: 700;
}
.py-2 {
  padding-top: 8px;
  padding-bottom: 8px;
}
.py-4 {
  padding-top: 16px;
  padding-bottom: 16px;
}
.ket-textarea {
  width: 100%;
  border: 1px solid #bdbdbd;
  border-radius: 3px;
  padding: 6px 8px;
  font-size: 11px;
  font-family: inherit;
  resize: vertical;
  outline: none;
  color: #212121;
  box-sizing: border-box;
}
.ket-textarea:focus {
  border-color: #1565c0;
}
.btn-lookup {
  height: 26px;
  border: 1px solid #90caf9;
  background: #e3f2fd;
  border-radius: 3px;
  padding: 0 8px;
  font-size: 11px;
  color: #0d47a1;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  justify-content: space-between;
  font-family: inherit;
  font-weight: 600;
}
.btn-lookup:hover {
  background: #bbdefb;
  border-color: #64b5f6;
}
.lookup-text {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lookup-help {
  font-size: 10px;
  color: #1565c0;
  font-weight: 700;
  flex-shrink: 0;
  background: white;
  border: 1px solid #90caf9;
  border-radius: 3px;
  padding: 1px 5px;
}
</style>
