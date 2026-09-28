<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { IconPhoto } from "@tabler/icons-vue";

const props = defineProps<{ formData: any }>();

const fmt = (v: any) => (Number(v) || 0).toLocaleString("id-ID");

// ── Gambar otomatis (sumber sama persis dengan Tab Gambar) ──
// apathimage + '\mintaharga\' + nomorMH + '.jpg' via proxy same-origin.
const IMAGE_BASE_URL =
  (import.meta as any).env?.VITE_MINTAHARGA_IMAGE_URL || "/api/images/mintaharga";

const nomorMH = computed(
  () => props.formData.mintaHarga?.nomor || props.formData.mintaHargaNomor || "",
);
const imgSrc = computed(() => (nomorMH.value ? `${IMAGE_BASE_URL}/${nomorMH.value}.jpg` : ""));
const imgError = ref(false);
watch(nomorMH, () => (imgError.value = false));

// ── Keterangan auto-height: tumbuh mengikuti isi (tanpa scroll untuk
// teks pendek), tetap scroll vertikal kalau teks melebihi max-height. ──
const ketText = computed(() => props.formData.mintaHarga?.ket || "");
const ketRef = ref<HTMLTextAreaElement | null>(null);
const autoResizeKet = () => {
  const el = ketRef.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
};
watch(ketText, () => nextTick(autoResizeKet));
onMounted(() => nextTick(autoResizeKet));
</script>

<template>
  <div class="mt-layout">
    <div v-if="!formData.mintaHarga" class="mt-empty">
      Kalkulasi ini tidak terhubung dengan Permintaan Harga.
    </div>

    <template v-else>
      <div class="mt-columns">
        <div class="section-card mt-main">
          <div class="sec-title">Referensi Permintaan Harga</div>
          <div class="form-grid">
            <div class="fr">
              <div class="grp g-nomor">
                <label class="lbl lbl-main">No. Minta Harga</label>
                <input :value="formData.mintaHarga.nomor" readonly class="inp ro flex-1 inp-bold" />
              </div>
              <div class="grp g-status">
                <label class="lbl lbl-sub">Status</label>
                <input :value="formData.mintaHarga.status" readonly class="inp ro flex-1" />
              </div>
            </div>
            <div class="fr">
              <div class="grp">
                <label class="lbl lbl-main">Nama</label>
                <input :value="formData.mintaHarga.nama" readonly class="inp ro flex-1" />
              </div>
            </div>
            <div class="fr">
              <div class="grp">
                <label class="lbl lbl-main">Customer</label>
                <input :value="`${formData.mintaHarga.custKode} — ${formData.mintaHarga.custNama}`" readonly class="inp ro flex-1" />
              </div>
            </div>
            <div class="fr">
              <div class="grp g-sales">
                <label class="lbl lbl-main">Sales</label>
                <input :value="`${formData.mintaHarga.salesKode} — ${formData.mintaHarga.salesNama}`" readonly class="inp ro flex-1" />
              </div>
              <div class="grp g-divisi">
                <label class="lbl lbl-sub">Divisi</label>
                <input :value="formData.mintaHarga.divisi" readonly class="inp ro flex-1" />
              </div>
            </div>
            <div class="fr">
              <div class="grp">
                <label class="lbl lbl-main">Tanggal</label>
                <input :value="formData.mintaHarga.tanggal?.substring(0, 10)" readonly class="inp ro flex-1" />
              </div>
              <div class="grp">
                <label class="lbl lbl-sub2">Last Order</label>
                <input :value="formData.mintaHarga.dateOrder?.substring(0, 10)" readonly class="inp ro flex-1" />
              </div>
            </div>
            <div class="fr">
              <div class="grp">
                <label class="lbl lbl-main">Rencana Order</label>
                <input :value="fmt(formData.mintaHarga.jmlOrder)" readonly class="inp ro tr flex-1" />
              </div>
              <div class="grp">
                <label class="lbl lbl-sub2">Harga Jual</label>
                <input :value="fmt(formData.mintaHarga.hargaJual)" readonly class="inp ro tr flex-1" />
              </div>
              <div class="grp">
                <label class="lbl lbl-sub">Budget</label>
                <input :value="fmt(formData.mintaHarga.budget)" readonly class="inp ro tr flex-1" />
              </div>
            </div>
            <div class="fr">
              <div class="grp g-kain">
                <label class="lbl lbl-main">Kain</label>
                <input :value="formData.mintaHarga.kain" readonly class="inp ro flex-1" />
              </div>
              <div class="grp g-ukuran">
                <label class="lbl lbl-sub">Ukuran</label>
                <input :value="formData.mintaHarga.ukuran" readonly class="inp ro flex-1" />
              </div>
            </div>
            <div class="fr">
              <div class="grp g-panjang">
                <label class="lbl lbl-main">Panjang x Lebar</label>
                <input :value="formData.mintaHarga.panjang" readonly class="inp ro tr flex-1" />
                <span class="mx-1">x</span>
                <input :value="formData.mintaHarga.lebar" readonly class="inp ro tr flex-1" />
              </div>
              <div class="grp g-gramasi">
                <label class="lbl lbl-sub">Gramasi</label>
                <input :value="formData.mintaHarga.gramasi" readonly class="inp ro flex-1" />
              </div>
            </div>
            <div class="fr">
              <div class="grp">
                <label class="lbl lbl-main">Finishing</label>
                <input :value="formData.mintaHarga.finishing" readonly class="inp ro flex-1" />
                <span v-if="formData.mintaHarga.sublimGrade" class="badge-legacy ml-2">
                  Sublim {{ formData.mintaHarga.sublimGrade === "premium" ? "Premium" : "Medium" }}
                </span>
              </div>
            </div>
            <div class="fr">
              <label class="lbl lbl-main">Keterangan</label>
            </div>
            <textarea ref="ketRef" :value="formData.mintaHarga.ket" readonly class="ket-textarea" rows="6" />
          </div>
        </div>

        <div class="section-card mt-img-card">
          <div class="sec-title">Gambar</div>
          <div class="img-box">
            <img
              v-if="imgSrc && !imgError"
              :src="imgSrc"
              class="img-photo"
              alt="Gambar desain"
              @error="imgError = true"
            />
            <div v-else class="img-empty">
              <IconPhoto :size="48" color="#bdbdbd" />
              <div v-if="!nomorMH">Belum ada sumber gambar untuk Minta Harga -</div>
              <div v-else>Gambar tidak ditemukan: {{ imgSrc }}</div>
            </div>
          </div>
        </div>
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
  min-width: 0;
  box-sizing: border-box;
}
.mt-columns {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.mt-main {
  flex: 1;
  min-width: 0;
  max-width: 680px;
}
.mt-img-card {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}
.img-box {
  border: 1px solid #e0e0e0;
  border-radius: 3px;
  background: #fafafa;
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.img-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #bdbdbd;
  font-size: 11px;
  text-align: center;
  padding: 16px;
}
.img-photo {
  max-width: 100%;
  max-height: 560px;
  object-fit: contain;
  border-radius: 2px;
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
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
.fr {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
  min-height: 26px;
  box-sizing: border-box;
}
.grp {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
}
/* Proporsi antar grup agar tepi kanan selalu sejajar & presisi */
.g-nomor { flex: 1.55; }
.g-status { flex: 1; }
.g-sales { flex: 1.65; }
.g-divisi { flex: 1; }
.g-kain { flex: 1.7; }
.g-ukuran { flex: 1; }
.g-panjang { flex: 1.7; }
.g-gramasi { flex: 1; }
.lbl {
  flex-shrink: 0;
  font-weight: 600;
  color: #424242;
  font-size: 11px;
  white-space: nowrap;
  box-sizing: border-box;
}
/* Kolom label kiri disamakan → semua textbox mulai di X yang sama */
.lbl-main { width: 110px; }
.lbl-sub { width: 52px; }
.lbl-sub2 { width: 72px; }
.flex-1 {
  flex: 1;
  min-width: 0;
  width: 100%;
}
.inp-bold {
  font-weight: 700;
  color: #1565c0 !important;
}
.inp {
  height: 26px;
  border: 1px solid #cfcfcf;
  border-radius: 4px;
  padding: 0 8px;
  font-size: 11px;
  outline: none;
  background: white;
  color: #212121;
  font-family: inherit;
  box-sizing: border-box;
  min-width: 0;
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
  min-height: 140px;
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid #bdbdbd;
  border-radius: 3px;
  padding: 6px 8px;
  font-size: 11px;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  color: #555;
  background: #f0f0f0;
  box-sizing: border-box;
}
@media (max-width: 900px) {
  .mt-columns {
    flex-direction: column;
  }
  .mt-main {
    max-width: 100%;
    width: 100%;
  }
  .mt-img-card {
    width: 100%;
  }
}
</style>
