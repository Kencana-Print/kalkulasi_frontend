<script setup lang="ts">
const props = defineProps<{ formData: any }>();

const fmt = (v: any) => (Number(v) || 0).toLocaleString("id-ID");
</script>

<template>
  <div class="mt-layout">
    <div v-if="!formData.mintaHarga" class="mt-empty">
      Kalkulasi ini tidak terhubung dengan Permintaan Harga.
    </div>

    <template v-else>
      <div class="section-card">
        <div class="sec-title">Referensi Permintaan Harga</div>
        <div class="fr">
          <label class="lbl">No. Minta Harga</label>
          <input :value="formData.mintaHarga.nomor" readonly class="inp ro" style="width: 160px; font-weight: 700; color: #1565c0" />
          <label class="lbl ml-2" style="width: 55px">Status</label>
          <input :value="formData.mintaHarga.status" readonly class="inp ro" style="width: 110px" />
        </div>
        <div class="fr">
          <label class="lbl">Nama</label>
          <input :value="formData.mintaHarga.nama" readonly class="inp ro flex-1" />
        </div>
        <div class="fr">
          <label class="lbl">Customer</label>
          <input :value="`${formData.mintaHarga.custKode} — ${formData.mintaHarga.custNama}`" readonly class="inp ro flex-1" />
        </div>
        <div class="fr">
          <label class="lbl">Sales</label>
          <input :value="`${formData.mintaHarga.salesKode} — ${formData.mintaHarga.salesNama}`" readonly class="inp ro flex-1" />
          <label class="lbl ml-2" style="width: 55px">Divisi</label>
          <input :value="formData.mintaHarga.divisi" readonly class="inp ro" style="width: 110px" />
        </div>
        <div class="fr">
          <label class="lbl">Tanggal</label>
          <input :value="formData.mintaHarga.tanggal?.substring(0, 10)" readonly class="inp ro" style="width: 120px" />
          <label class="lbl ml-2" style="width: 90px">Last Order</label>
          <input :value="formData.mintaHarga.dateOrder?.substring(0, 10)" readonly class="inp ro" style="width: 120px" />
        </div>
        <div class="fr">
          <label class="lbl">Rencana Order</label>
          <input :value="fmt(formData.mintaHarga.jmlOrder)" readonly class="inp ro tr" style="width: 120px" />
          <label class="lbl ml-2" style="width: 90px">Harga Jual</label>
          <input :value="fmt(formData.mintaHarga.hargaJual)" readonly class="inp ro tr" style="width: 140px" />
          <label class="lbl ml-2" style="width: 60px">Budget</label>
          <input :value="fmt(formData.mintaHarga.budget)" readonly class="inp ro tr" style="width: 140px" />
        </div>
        <div class="fr">
          <label class="lbl">Kain</label>
          <input :value="formData.mintaHarga.kain" readonly class="inp ro flex-1" />
          <label class="lbl ml-2" style="width: 55px">Ukuran</label>
          <input :value="formData.mintaHarga.ukuran" readonly class="inp ro" style="width: 150px" />
        </div>
        <div class="fr">
          <label class="lbl">Panjang x Lebar</label>
          <input :value="formData.mintaHarga.panjang" readonly class="inp ro tr" style="width: 90px" />
          <span class="mx-1">x</span>
          <input :value="formData.mintaHarga.lebar" readonly class="inp ro tr" style="width: 90px" />
          <label class="lbl ml-2" style="width: 60px">Gramasi</label>
          <input :value="formData.mintaHarga.gramasi" readonly class="inp ro" style="width: 100px" />
        </div>
        <div class="fr">
          <label class="lbl">Finishing</label>
          <input :value="formData.mintaHarga.finishing" readonly class="inp ro flex-1" />
          <span v-if="formData.mintaHarga.sublimGrade" class="badge-legacy ml-2">
            Sublim {{ formData.mintaHarga.sublimGrade === "premium" ? "Premium" : "Medium" }}
          </span>
        </div>
        <div class="fr">
          <label class="lbl" style="width: auto">Keterangan</label>
        </div>
        <textarea :value="formData.mintaHarga.ket" readonly class="ket-textarea" style="height: 90px" />
      </div>

      <div v-if="formData.nego" class="section-card mt-2">
        <div class="sec-title" style="color: #7b1fa2">Riwayat Nego — Kalkulasi {{ formData.nego.header?.nomor }}</div>
        <p class="hint">
          Data komponen bahan, aksesoris, dan seluruh proses pada tab lain sudah
          otomatis diisi dari histori kalkulasi nego ini sebagai titik awal —
          silakan sesuaikan sebelum disimpan.
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.mt-layout {
  padding: 8px;
  font-family: "Segoe UI", system-ui, sans-serif;
  font-size: 11px;
}
.mt-empty {
  text-align: center;
  padding: 40px;
  color: #9e9e9e;
  font-style: italic;
}
.section-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 12px 14px;
  max-width: 680px;
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
.mx-1 {
  margin: 0 4px;
  color: #555;
}
.fr {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 6px;
  min-height: 24px;
}
.lbl {
  width: 100px;
  flex-shrink: 0;
  font-weight: 600;
  color: #424242;
  font-size: 11px;
}
.flex-1 {
  flex: 1;
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
.ro {
  background: #f0f0f0 !important;
  color: #555 !important;
}
.tr {
  text-align: right;
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
.ket-textarea {
  width: 100%;
  border: 1px solid #bdbdbd;
  border-radius: 3px;
  padding: 6px 8px;
  font-size: 11px;
  font-family: inherit;
  resize: vertical;
  outline: none;
  color: #555;
  background: #f0f0f0;
  box-sizing: border-box;
}
.hint {
  font-size: 11px;
  color: #616161;
  font-style: italic;
  margin: 0;
}
</style>
