<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useForm } from "@/composables/useForm";
import BaseForm from "@/components/BaseForm.vue";
import { kalkulasiFormApi } from "@/api/transaksi/kalkulasiFormApi";
import { IconCalculator } from "@tabler/icons-vue";

import KalkulasiTabUtama from "@/components/transaksi/KalkulasiTabUtama.vue";
import KalkulasiTabGramasi from "@/components/transaksi/KalkulasiTabGramasi.vue";
import KalkulasiTabJenisKain from "@/components/transaksi/KalkulasiTabJenisKain.vue";
import KalkulasiTabProsesArea from "@/components/transaksi/KalkulasiTabProsesArea.vue";
import KalkulasiTabCetak from "@/components/transaksi/KalkulasiTabCetak.vue";
import KalkulasiTabSublim from "@/components/transaksi/KalkulasiTabSublim.vue";
import KalkulasiTabMinta from "@/components/transaksi/KalkulasiTabMinta.vue";
import KalkulasiTabGambar from "@/components/transaksi/KalkulasiTabGambar.vue";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const activeTab = ref(0);
const setActiveTab = (idx: number) => (activeTab.value = idx);

// State kecil lintas-tab utk alur F1 grid komponen → Tab Gramasi/Jenis Kain
// → tombol OK → tulis balik ke baris grid & kembali ke Tab Kalkulasi.
// Padanan variabel global "ckomponen" + index baris aktif di Delphi.
const gridEdit = ref<{ index: number; tipe: string }>({ index: -1, tipe: "" });

const isEditMode = computed(() => !!route.params.nomor);
// Salinan dari 3 jenis dokumen yang dilayani form Delphi ini sekaligus
// (KALKULASI HARGA / PENAWARAN 1 / PENAWARAN 2) — dipilih lewat query
// ?jenis=... saat membuat baru dari daftar Permintaan Harga.
const lblJudul = computed(() => {
  const j = String(route.query.jenis || "KALKULASI HARGA");
  return ["KALKULASI HARGA", "PENAWARAN 1", "PENAWARAN 2"].includes(j)
    ? j
    : "KALKULASI HARGA";
});

const blankBiaya8 = () => ({ jenis: Array(8).fill(""), cm: Array(8).fill(0) });
const blankProsesArea = () => ({
  cmBordir: 0,
  p: Array(8).fill(0),
  l: Array(8).fill(0),
  rp: 0,
});

const defaultData = {
  // --- identitas (Tab Kalkulasi / panelkiri) ---
  nomor: "",
  nomor2: "", // salin acuan dari kalkulasi lain (edtNomor2)
  tanggal: new Date().toISOString().substring(0, 10),
  khKode: "",
  khNama: "",
  warna: "",
  cus: "",
  project: "",
  rencanaOrder: 0,
  divisi: "", // ikut dari Minta Harga, tampil saja (readonly)
  jenisKainOptions: [] as string[],
  ckMedium: false, // grade PE/PE DK/HYGIT/DRYFIT vs lainnya — dipakai lintas tab

  // --- detail biaya (Tab Kalkulasi / panelkiri, kald_dtl) ---
  rpPotong: 0,
  jahit: "",
  raglan: false,
  rpRaglan: 0,
  rpJahit: 0,
  rpFinishing: 0,
  rpTenagaCetak: 0,
  pakaiObat: false,
  rpBiayaObat: 0,
  rpKirim: 0,

  // --- grid komponen bahan & aksesoris ---
  komponen: [] as any[],
  aksesories: [] as any[],
  komponenOptions: [] as string[],

  // --- total & margin (paneltotal) ---
  pakaiPersen: true,
  labaPersen: 0,
  rpLaba: 0,
  allowancePersen: 0,
  rpAllowance: 0,
  rpSesuai: 0,
  ppn: 0,
  rpSesuaiPpn: 0,
  totBahan: 0,
  totAksesories: 0,
  totBahan2: 0,
  totBiaya: 0,
  hpp: 0,
  hargaJual: 0,

  // --- catatan & status (panelkanan bawah) ---
  ket: "",
  ketBeli: "",
  ckCancel: false,
  ckUpdate: false,

  // --- proses per tab ---
  bordir: blankProsesArea(),
  polyflex: blankProsesArea(),
  dtf: blankProsesArea(),
  cetak: { ...blankBiaya8(), p: Array(8).fill(0), l: Array(8).fill(0), rp: 0 },
  sublim: { jenis: Array(8).fill(""), rp: Array(8).fill(0), rpSublim: 0 },

  // --- referensi read-only ---
  mintaHargaNomor: "",
  mintaHarga: null as any,
  nego: null as any,

  // PPN GLOBAL (zPpn di MAIN.pas: tversi.ppn aplikasi KALKULASI) — beda
  // dari `ppn` di atas (kal_ppn, per-dokumen, cuma dipakai utk rpSesuaiPpn).
  // zppn dipakai hitungpabrik utk keluarkan PPN dari harga pabrik.
  ppnGlobal: 11,
};

// ── hitungkg + hitungpabrik per baris grid komponen — replikasi 1:1.
// Dipanggil dari Tab Kalkulasi (edit langsung di grid) maupun dari Tab
// Gramasi/Jenis Kain setelah tombol OK menulis balik jenisKain/warna/
// babaran/harga ke baris yang sedang diedit. ──
const recalcKomponenRow = (index: number) => {
  const row = formData.value.komponen[index];
  if (!row) return;
  const qtyOrder = Number(formData.value.rencanaOrder) || 0;
  if (Number(row.babaran) === 0 || Number(row.harga) === 0) {
    row.kebutuhan = 0;
    row.bruto = 0;
  } else if (row.kg) {
    row.kebutuhan = qtyOrder / Number(row.babaran);
    row.bruto = Number(row.harga) / Number(row.babaran);
  } else {
    row.kebutuhan = qtyOrder * Number(row.babaran);
    row.bruto = Number(row.harga) * Number(row.babaran);
  }
  if (Number(row.bruto) !== 0) {
    row.pcs = row.pabrik
      ? Number(row.bruto) / ((100 + Number(formData.value.ppnGlobal)) / 100)
      : Number(row.bruto);
  }
};

// ── Hitung total/HPP — replikasi 1:1 procedure Hitung di Delphi.
// Dipanggil eksplisit dari titik yang sama dengan Delphi (bukan deep-watch
// blanket) supaya jejak pemicunya jelas & mudah ditelusuri. ──
const recalcTotal = () => {
  const fd = formData.value;
  const totBahan = fd.komponen.reduce((s: number, k: any) => s + (Number(k.pcs) || 0), 0);
  const totAksesories = fd.aksesories.reduce((s: number, a: any) => s + (Number(a.biaya) || 0), 0);
  const allowance = totBahan !== 0 ? (Number(fd.allowancePersen) / 100) * totBahan : 0;
  const totBahan2 = totBahan + allowance;
  const totBiaya =
    Number(fd.rpPotong) +
    Number(fd.bordir.rp) +
    Number(fd.cetak.rp) +
    Number(fd.sublim.rpSublim) +
    Number(fd.polyflex.rp) +
    Number(fd.dtf.rp) +
    Number(fd.rpJahit) +
    Number(fd.rpFinishing) +
    Number(fd.rpTenagaCetak);
  const hpp = totBahan2 + totBiaya + totAksesories + Number(fd.rpBiayaObat) + Number(fd.rpKirim);

  fd.totBahan = totBahan;
  fd.totAksesories = totAksesories;
  fd.rpAllowance = allowance;
  fd.totBahan2 = totBahan2;
  fd.totBiaya = totBiaya;
  fd.hpp = Math.round(hpp);

  if (hpp === 0) {
    fd.rpLaba = 0;
    fd.hargaJual = 0;
    return;
  }
  if (fd.pakaiPersen) {
    fd.rpLaba = (Number(fd.labaPersen) / 100) * hpp;
  } else {
    fd.labaPersen = (Number(fd.rpLaba) / hpp) * 100;
  }
  fd.rpLaba = Math.round(fd.rpLaba);
  fd.hargaJual = hpp + fd.rpLaba;
};

const recalcSesuaiPpn = () => {
  const fd = formData.value;
  // Dilewati 1x sehabis user edit +PPN langsung (hitung mundur di
  // onSesuaiPpnChange) supaya nilai ketikan tidak ditimpa hasil hitung
  // maju dari Rp Penyesuaian yang sudah dibulatkan.
  if (fd.skipSesuaiPpnOnce) {
    fd.skipSesuaiPpnOnce = false;
    return;
  }
  if (Number(fd.ppn) === 0) {
    fd.rpSesuaiPpn = fd.rpSesuai;
  } else {
    fd.rpSesuaiPpn = Number(fd.rpSesuai) + (Number(fd.ppn) / 100) * Number(fd.rpSesuai);
  }
};

const {
  isLoading,
  isSaving,
  showSaveDialog,
  showCancelDialog,
  showCloseDialog,
  formData,
  fetchData,
  executeSave,
  executeCancel,
  executeClose,
} = useForm({
  menuId: "22",
  initialData: defaultData,

  fetchApi: async () => {
    if (isEditMode.value) {
      const nomor = String(route.params.nomor);
      const res = await kalkulasiFormApi.getDetail(nomor);
      const d = res.data.data;
      const komponenOptRes = await kalkulasiFormApi.getKomponenOptions();

      return {
        ...defaultData,
        // ckMedium tidak pernah disimpan ke DB di Delphi (murni state UI,
        // di-set ulang tiap kali tombol OK Gramasi ditekan) — backend
        // getDetail() sudah menghitung ulang ini dari jenisKain baris
        // BODY memakai rumus yang sama persis dengan btnOkGClick, supaya
        // tidak "nyangkut" di nilai default saat buka data lama.
        ckMedium: d.header.ckMedium,
        nomor: d.header.nomor,
        tanggal: d.header.tanggal?.substring(0, 10) || defaultData.tanggal,
        khKode: d.header.khKode || "",
        khNama: d.header.khNama || "",
        cus: d.header.cus || "",
        project: d.header.project || "",
        rencanaOrder: d.header.rencanaOrder,
        pakaiPersen: d.header.pakaiPersen,
        pakaiObat: d.header.pakaiObat,
        ket: d.header.ket,
        ketBeli: d.header.ketBeli,
        ckCancel: d.header.ckCancel === true,
        ckUpdate: d.header.ckUpdate === true,
        labaPersen: d.header.labaPersen,
        rpLaba: d.header.rpLaba,
        allowancePersen: d.header.allowancePersen,
        rpAllowance: d.header.rpAllowance,
        rpSesuai: d.header.rpSesuai,
        ppn: d.header.ppn,
        rpSesuaiPpn: d.header.rpSesuaiPpn,
        rpPotong: d.dtl.rpPotong,
        jahit: d.dtl.jahit,
        raglan: d.dtl.raglan,
        rpRaglan: d.dtl.rpRaglan,
        rpJahit: d.dtl.rpJahit,
        rpFinishing: d.dtl.rpFinishing,
        rpTenagaCetak: d.dtl.rpTenagaCetak,
        rpBiayaObat: d.dtl.rpBiayaObat,
        rpKirim: d.dtl.rpKirim,
        komponen: d.komponen?.length ? d.komponen : [{ komponen: "", kg: true, pabrik: true, jenisKain: "", lengan: "", warna: "", harga: 0, babaran: 0, bruto: 0, kebutuhan: 0, pcs: 0, logBody: 0, logLengan: 0 }],
        aksesories: d.aksesories?.length ? d.aksesories : [...defaultData.aksesories],
        komponenOptions: komponenOptRes.data.data,
        jenisKainOptions: d.jenisKainOptions || [],
        bordir: d.bordir
          ? { cmBordir: d.bordir.cmBordir, p: d.bordir.p, l: d.bordir.l, rp: d.bordir.rpBordir }
          : blankProsesArea(),
        polyflex: d.polyflex
          ? { cmBordir: d.polyflex.cmPolyflex, p: d.polyflex.p, l: d.polyflex.l, rp: d.polyflex.rpPolyflex }
          : blankProsesArea(),
        dtf: d.dtf ? { cmBordir: d.dtf.cmDtf, p: d.dtf.p, l: d.dtf.l, rp: d.dtf.rpDtf } : blankProsesArea(),
        cetak: d.cetak
          ? { jenis: d.cetak.jenis, cm: d.cetak.cm, p: d.cetak.p, l: d.cetak.l, rp: d.cetak.rpCetak }
          : { ...blankBiaya8(), p: Array(8).fill(0), l: Array(8).fill(0), rp: 0 },
        sublim: d.sublim
          ? { jenis: d.sublim.jenis, rp: d.sublim.rp, rpSublim: d.sublim.rpSublim }
          : { jenis: Array(8).fill(""), rp: Array(8).fill(0), rpSublim: 0 },
        mintaHargaNomor: d.mintaHarga?.header?.nomor || "",
        mintaHarga: d.mintaHarga?.header || null,
        divisi: d.mintaHarga?.header?.divisi || "",
        nego: d.mintaHarga?.nego || null,
      };
    }

    // Mode buat-baru dari Minta Harga (?mh=<nomor>)
    const mhNomor = String(route.query.mh || "");
    if (!mhNomor) {
      // Buat kosong (dari Browse Kalkulasi) — tetap butuh komponenOptions agar dropdown terisi
      try {
        const komponenOptRes = await kalkulasiFormApi.getKomponenOptions();
        return { ...defaultData, komponenOptions: komponenOptRes.data.data, komponen: [{ komponen: "", kg: true, pabrik: true, jenisKain: "", lengan: "", warna: "", harga: 0, babaran: 0, bruto: 0, kebutuhan: 0, pcs: 0, logBody: 0, logLengan: 0 }], aksesories: [{ aksesories: "PLASTIK/KARUNG", biaya: 0 }] };
      } catch { return { ...defaultData, komponen: [{ komponen: "", kg: true, pabrik: true, jenisKain: "", lengan: "", warna: "", harga: 0, babaran: 0, bruto: 0, kebutuhan: 0, pcs: 0, logBody: 0, logLengan: 0 }], aksesories: [{ aksesories: "PLASTIK/KARUNG", biaya: 0 }] }; }
    }

    const res = await kalkulasiFormApi.getMintaHarga(mhNomor);
    const mh = res.data.data;
    const komponenOptRes = await kalkulasiFormApi.getKomponenOptions();

    const base: any = {
      ...defaultData,
      divisi: mh.header.divisi,
      project: mh.header.nama,
      cus: mh.header.custNama,
      rencanaOrder: mh.header.jmlOrder,
      pakaiObat: true,
      khKode: "KH-0002",
      mintaHargaNomor: mh.header.nomor,
      mintaHarga: mh.header,
      nego: mh.nego,
      komponenOptions: komponenOptRes.data.data,
      ckCancel: mh.header.status === "CANCEL",
      komponen: [{ komponen: "", kg: true, pabrik: true, jenisKain: "", lengan: "", warna: "", harga: 0, babaran: 0, bruto: 0, kebutuhan: 0, pcs: 0, logBody: 0, logLengan: 0 }],
      // Replikasi initgrid2 (refreshdata): grid aksesoris default 1 baris PLASTIK/KARUNG
      aksesories: [{ aksesories: "PLASTIK/KARUNG", biaya: 0 }],
      bordir: blankProsesArea(),
      polyflex: blankProsesArea(),
      dtf: blankProsesArea(),
      cetak: { ...blankBiaya8(), p: Array(8).fill(0), l: Array(8).fill(0), rp: 0 },
      sublim: { jenis: Array(8).fill(""), rp: Array(8).fill(0), rpSublim: 0 },
    };

    // Replikasi loadnego: kalau status NEGO & ada histori kalkulasi lama,
    // seluruh nilai kalkulasi (BUKAN nomor/tanggal — itu tetap baru) di-
    // prefill dari histori nego sebagai titik awal, supaya user tidak
    // perlu mengetik ulang dari nol.
    if (mh.nego) {
      const n = mh.nego;
      Object.assign(base, {
        project: n.header.project,
        cus: n.header.cus,
        rencanaOrder: n.header.rencanaOrder,
        khKode: n.header.khKode,
        khNama: n.header.khNama,
        pakaiPersen: n.header.pakaiPersen,
        pakaiObat: n.header.pakaiObat,
        ket: n.header.ket,
        ketBeli: n.header.ketBeli,
        labaPersen: n.header.labaPersen,
        rpLaba: n.header.rpLaba,
        allowancePersen: n.header.allowancePersen,
        rpAllowance: n.header.rpAllowance,
        rpSesuai: n.header.rpSesuai,
        ppn: n.header.ppn,
        rpSesuaiPpn: n.header.rpSesuaiPpn,
      });
      if (n.dtl) {
        Object.assign(base, {
          rpPotong: n.dtl.rpPotong,
          jahit: n.dtl.jahit,
          raglan: n.dtl.raglan,
          rpRaglan: n.dtl.rpRaglan,
          rpJahit: n.dtl.rpJahit,
          rpFinishing: n.dtl.rpFinishing,
          rpTenagaCetak: n.dtl.rpTenagaCetak,
          rpBiayaObat: n.dtl.rpBiayaObat,
          rpKirim: n.dtl.rpKirim,
        });
      }
      base.komponen = n.komponen?.length ? n.komponen : base.komponen;
      base.aksesories = n.aksesories?.length ? n.aksesories : base.aksesories;
      if (n.bordir) base.bordir = { cmBordir: n.bordir.cmBordir, p: n.bordir.p, l: n.bordir.l, rp: n.bordir.rpBordir };
      if (n.polyflex) base.polyflex = { cmBordir: n.polyflex.cmPolyflex, p: n.polyflex.p, l: n.polyflex.l, rp: n.polyflex.rpPolyflex };
      if (n.dtf) base.dtf = { cmBordir: n.dtf.cmDtf, p: n.dtf.p, l: n.dtf.l, rp: n.dtf.rpDtf };
      if (n.cetak) base.cetak = { jenis: n.cetak.jenis, cm: n.cetak.cm, p: n.cetak.p, l: n.cetak.l, rp: n.cetak.rpCetak };
      if (n.sublim) base.sublim = { jenis: n.sublim.jenis, rp: n.sublim.rp, rpSublim: n.sublim.rpSublim };
      if (n.header.khKode) {
        const modelRes = await kalkulasiFormApi.getModelKerja(n.header.khKode);
        base.jenisKainOptions = modelRes.data.data.jenisKainOptions;
      }
    }

    // Replikasi Delphi (pertama kali dari Browse Minta Harga status MINTA):
    // qty order diambil dari tmintaharga → event change textbox qty ikut
    // terpancing → prosedur margin jalan (tmargin/tallowance/tbiayakirim).
    // Hanya dokumen benar-benar baru (tanpa histori nego); kalau ada nego,
    // nilai margin/laba/allowance/kirim pakai histori tersebut.
    // Grade masih default (ckMedium=false → premium) karena jenis kain
    // baru diketahui setelah OK Gramasi.
    if (!mh.nego) {
      try {
        const mRes = await kalkulasiFormApi.getMargin({ qtyOrder: base.rencanaOrder, grade: "premium" });
        const m = mRes.data.data;
        base.pakaiPersen = m.pakaiPersen;
        if (m.pakaiPersen) base.labaPersen = m.labaPersen;
        else base.rpLaba = m.laba;
        base.allowancePersen = m.allowancePersen;
        base.rpKirim = m.rpKirim;
      } catch { /* abaikan — user bisa picu ulang lewat ubah Qty Order */ }
      base.pakaiPersen = true;
    }

    // Replikasi refreshdata + edtkhkodeExit (ufrmKalkulasi.pas): khKode
    // default KH-0002 langsung di-exit-kan sebelum data tampil → nama
    // model, warna, biaya potong, cm bordir/polyflex/dtf, dan pilihan
    // jenis kain terisi otomatis dari master.
    // Hanya dokumen benar-benar baru (tanpa histori nego); kalau ada nego,
    // semua nilai tersebut pakai histori.
    if (!mh.nego && base.khKode) {
      try {
        const modelRes = await kalkulasiFormApi.getModelKerja(base.khKode);
        const d = modelRes.data.data;
        base.khNama = d.nama;
        base.warna = d.warna;
        base.rpPotong = d.biayaPotong;
        base.bordir.cmBordir = d.cmBordir;
        base.polyflex.cmBordir = d.cmPolyflex;
        base.dtf.cmBordir = d.cmDtf;
        base.jenisKainOptions = d.jenisKainOptions;
      } catch { /* abaikan — user bisa isi manual / blur kode model */ }
    }

    return base;
  },

  submitApi: async (data: any) => {
    const payload = {
      isEdit: isEditMode.value,
      lblJudul: lblJudul.value,
      divisi: data.divisi,
      header: {
        nomor: data.nomor,
        tanggal: data.tanggal,
        project: data.project,
        cus: data.cus,
        khKode: data.khKode,
        rencanaOrder: data.rencanaOrder,
        pakaiPersen: data.pakaiPersen,
        labaPersen: data.labaPersen,
        rpLaba: data.rpLaba,
        allowancePersen: data.allowancePersen,
        rpAllowance: data.rpAllowance,
        rpSesuai: data.rpSesuai,
        ppn: data.ppn,
        rpSesuaiPpn: data.rpSesuaiPpn,
        ket: data.ket,
        pakaiObat: data.pakaiObat,
        ketBeli: data.ketBeli,
      },
      dtl: {
        rpPotong: data.rpPotong,
        jahit: data.jahit,
        raglan: data.raglan,
        rpRaglan: data.rpRaglan,
        rpJahit: data.rpJahit,
        rpFinishing: data.rpFinishing,
        rpTenagaCetak: data.rpTenagaCetak,
        rpBiayaObat: data.rpBiayaObat,
        rpKirim: data.rpKirim,
        ckCancel: data.ckCancel,
      },
      komponen: data.komponen,
      aksesories: data.aksesories,
      bordir: { cmBordir: data.bordir.cmBordir, p: data.bordir.p, l: data.bordir.l, rpBordir: data.bordir.rp },
      polyflex: { cmPolyflex: data.polyflex.cmBordir, p: data.polyflex.p, l: data.polyflex.l, rpPolyflex: data.polyflex.rp },
      dtf: { cmDtf: data.dtf.cmBordir, p: data.dtf.p, l: data.dtf.l, rpDtf: data.dtf.rp },
      cetak: { jenis: data.cetak.jenis, cm: data.cetak.cm, p: data.cetak.p, l: data.cetak.l, rpCetak: data.cetak.rp },
      sublim: { jenis: data.sublim.jenis, rp: data.sublim.rp, rpSublim: data.sublim.rpSublim },
      mintaHarga: data.mintaHargaNomor
        ? { nomor: data.mintaHargaNomor, updateStatus: data.ckUpdate }
        : null,
    };
    return kalkulasiFormApi.save(payload);
  },

  onSuccess: () => {
    toast.success("Kalkulasi berhasil disimpan.");
    const browse = (route.meta?.browseRoute as string) || "MintaHarga";
    try { router.push({ name: browse }); } catch { router.push("/transaksi/kalkulasi"); }
  },
});

const validateSave = () => {
  if (formData.value.ckCancel && !formData.value.ket?.trim()) {
    toast.warning("Status dicancel. Note Marketing harus diisi.");
    return;
  }
  if (["GARMEN", "KAOSAN"].includes(formData.value.divisi)) {
    if (formData.value.pakaiObat && Number(formData.value.rpBiayaObat) === 0) {
      toast.warning("Jika Biaya Obat dicentang. Maka Biaya Obat harus diisi.");
      return;
    }
    const isi = formData.value.komponen.filter((k: any) => k.komponen?.trim());
    if (isi.length === 0) {
      toast.warning("Divisi Garmen/Kaosan. Komponen harus diisi.");
      return;
    }
    const warnaValid = ["MUDA", "SEDANG", "TUA", "SUPERTUA"];
    for (const k of formData.value.komponen) {
      const w = (k.warna || "").trim();
      if (w && !warnaValid.includes(w)) {
        toast.warning("Isi Warna dengan: MUDA, SEDANG, TUA, SUPERTUA");
        return;
      }
    }
  }
  showSaveDialog.value = true;
};

onMounted(async () => {
  // fetchData() (kalau mode edit/dari-minta-harga) mengganti formData.value
  // sepenuhnya dari hasil fetchApi — jadi ppnGlobal WAJIB di-set SESUDAHNYA,
  // bukan sebelum, supaya tidak ikut tertimpa.
  if (isEditMode.value || route.query.mh) await fetchData();
  const ppnRes = await kalkulasiFormApi.getPpnDefault();
  formData.value.ppnGlobal = ppnRes.data.data.ppn;
  // Bruto & Kebutuhan tidak tersimpan di DB (dihitung runtime spt Delphi)
  // → hitung ulang utk tampil di grid. Hanya baris normal (harga & babaran
  // terisi); baris KRAH/MANSET dibiarkan apa adanya.
  if (isEditMode.value) {
    formData.value.komponen.forEach((r: any, i: number) => {
      if (Number(r.harga) && Number(r.babaran)) recalcKomponenRow(i);
    });
  }
  // Replikasi refreshdata (edtppn := zPpn): semua dokumen BARU dapat
  // default % PPN dari tversi — termasuk dari Minta Harga. Kalau ada
  // histori nego, % PPN pakai histori tersebut.
  if (!isEditMode.value && !formData.value.nego) formData.value.ppn = ppnRes.data.data.ppn;
  recalcTotal();
});

watch(
  () => formData.value.rpSesuai,
  () => recalcSesuaiPpn(),
);
watch(
  () => formData.value.ppn,
  () => recalcSesuaiPpn(),
);

const tabs = [
  { key: "kalkulasi", title: "Kalkulasi" },
  { key: "gramasi", title: "Gramasi" },
  { key: "jeniskain", title: "Jenis Kain" },
  { key: "bordir", title: "Bordir" },
  { key: "cetak", title: "Cetak" },
  { key: "sublim", title: "Sublim" },
  { key: "polyflex", title: "Polyflex" },
  { key: "dtf", title: "DTF" },
  { key: "minta", title: "Permintaan Harga" },
  { key: "gambar", title: "Gambar" },
];

const handleClose = () => {
  // delegasikan ke composable — goBack() sudah menangani browseRoute + fallback history.back()
  executeClose();
};
</script>

<template>
  <BaseForm
    :title="isEditMode ? `Ubah ${lblJudul}` : `Buat ${lblJudul}`"
    menu-id="22"
    :icon="IconCalculator"
    :is-loading="isLoading"
    :is-saving="isSaving"
    :hide-cancel="true"
    item-name="Kalkulasi"
    v-model:show-save-dialog="showSaveDialog"
    v-model:show-cancel-dialog="showCancelDialog"
    v-model:show-close-dialog="showCloseDialog"
    @validate-save="validateSave"
    @confirm-save="executeSave"
    @confirm-cancel="executeCancel"
    @confirm-close="handleClose"
  >
    <div class="pf-container">
      <div class="pf-tab-nav">
        <button
          v-for="(tab, idx) in tabs"
          :key="idx"
          class="pf-tab-btn"
          :class="{ active: activeTab === idx }"
          @click="activeTab = idx"
        >
          {{ tab.title }}
        </button>
      </div>

      <div class="pf-tab-body">
        <div v-show="tabs[activeTab]?.key === 'kalkulasi'" class="pf-tab-pane">
          <KalkulasiTabUtama
            :form-data="formData"
            :is-edit="isEditMode"
            :recalc-total="recalcTotal"
            :recalc-komponen-row="recalcKomponenRow"
            :grid-edit="gridEdit"
            :set-active-tab="setActiveTab"
          />
        </div>
        <div v-show="tabs[activeTab]?.key === 'gramasi'" class="pf-tab-pane">
          <KalkulasiTabGramasi
            :form-data="formData"
            :recalc-total="recalcTotal"
            :recalc-komponen-row="recalcKomponenRow"
            :grid-edit="gridEdit"
            :set-active-tab="setActiveTab"
          />
        </div>
        <div v-show="tabs[activeTab]?.key === 'jeniskain'" class="pf-tab-pane">
          <KalkulasiTabJenisKain
            :form-data="formData"
            :recalc-total="recalcTotal"
            :recalc-komponen-row="recalcKomponenRow"
            :grid-edit="gridEdit"
            :set-active-tab="setActiveTab"
          />
        </div>
        <div v-show="tabs[activeTab]?.key === 'bordir'" class="pf-tab-pane">
          <KalkulasiTabProsesArea
            proses="bordir"
            title="Bordir"
            jenis-biaya="BORDIR"
            :form-data="formData"
            :recalc-total="recalcTotal"
            :set-active-tab="setActiveTab"
          />
        </div>
        <div v-show="tabs[activeTab]?.key === 'cetak'" class="pf-tab-pane">
          <KalkulasiTabCetak :form-data="formData" :recalc-total="recalcTotal" :set-active-tab="setActiveTab" />
        </div>
        <div v-show="tabs[activeTab]?.key === 'sublim'" class="pf-tab-pane">
          <KalkulasiTabSublim :form-data="formData" :recalc-total="recalcTotal" :set-active-tab="setActiveTab" />
        </div>
        <div v-show="tabs[activeTab]?.key === 'polyflex'" class="pf-tab-pane">
          <KalkulasiTabProsesArea
            proses="polyflex"
            title="Polyflex"
            jenis-biaya="POLYFLEX"
            :form-data="formData"
            :recalc-total="recalcTotal"
            :set-active-tab="setActiveTab"
          />
        </div>
        <div v-show="tabs[activeTab]?.key === 'dtf'" class="pf-tab-pane">
          <KalkulasiTabProsesArea
            proses="dtf"
            title="DTF"
            jenis-biaya="DTF"
            :form-data="formData"
            :recalc-total="recalcTotal"
            :set-active-tab="setActiveTab"
          />
        </div>
        <div v-show="tabs[activeTab]?.key === 'minta'" class="pf-tab-pane">
          <KalkulasiTabMinta :form-data="formData" />
        </div>
        <div v-show="tabs[activeTab]?.key === 'gambar'" class="pf-tab-pane">
          <KalkulasiTabGambar :form-data="formData" />
        </div>
      </div>
    </div>
  </BaseForm>
</template>

<style scoped>
.pf-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f4f5f7;
}
.pf-tab-nav {
  display: flex;
  background: #e0e0e0;
  border-bottom: 2px solid #bdbdbd;
  padding: 4px 8px 0;
  flex-wrap: wrap;
}
.pf-tab-btn {
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  background: #eeeeee;
  border: 1px solid #ccc;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  margin-right: 4px;
}
.pf-tab-btn.active {
  background: white;
  color: #1565c0;
  border-color: #bdbdbd;
  border-bottom: 2px solid white;
  margin-bottom: -2px;
}
.pf-tab-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.pf-tab-pane {
  padding: 8px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
