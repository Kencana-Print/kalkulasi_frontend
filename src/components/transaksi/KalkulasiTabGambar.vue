<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { IconPhoto } from "@tabler/icons-vue";

// Padanan tab "Gambar" di Delphi (Image2, duplikat tampilan dari Image1 di
// Tab Permintaan Harga). Replikasi ufrmKalkulasi.pas ~4311:
//   apathimage + '\mintaharga\' + nomorMH + '.jpg'
// Selalu lewat proxy backend same-origin (/api/images/...) supaya tidak kena
// mixed-content saat aplikasi dibuka via HTTPS — backend yang mengambilkan
// file dari server gambar (103.94.238.252:8182/images/mintaharga). Bisa
// dioverride via env VITE_MINTAHARGA_IMAGE_URL bila ingin langsung.
const IMAGE_BASE_URL =
  (import.meta as any).env?.VITE_MINTAHARGA_IMAGE_URL || "/api/images/mintaharga";

const props = defineProps<{ formData: any }>();

const nomorMH = computed(
  () => props.formData.mintaHarga?.nomor || props.formData.mintaHargaNomor || "",
);
const imgSrc = computed(() => (nomorMH.value ? `${IMAGE_BASE_URL}/${nomorMH.value}.jpg` : ""));
const imgError = ref(false);
watch(nomorMH, () => (imgError.value = false));
</script>

<template>
  <div class="gb-layout">
    <div class="section-card img-card">
      <div class="sec-title">Gambar Desain</div>
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

<style scoped>
.gb-layout {
  padding: 8px;
  font-family: "Segoe UI", system-ui, sans-serif;
  font-size: 11px;
  height: 100%;
}
.section-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 12px 14px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.sec-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #1565c0;
  margin-bottom: 8px;
}
.img-card {
  max-width: 640px;
}
.img-box {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 3px;
  background: #fafafa;
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
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
</style>
