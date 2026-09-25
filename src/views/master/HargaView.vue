<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { IconTags } from "@tabler/icons-vue";
import BaseBrowse from "@/components/BaseBrowse.vue";
import { useBrowse } from "@/composables/useBrowse";
import { hargaApi, type Harga, type HargaOptions } from "@/api/master/hargaApi";

const MENU_ID = "8"; // Adjust according to your menu ID
const toast = useToast();

const {
  items,
  isLoading,
  selected,
  canInsert,
  canEdit,
  canDelete,
  canExport,
  fetchData,
} = useBrowse<Harga>({ menuId: MENU_ID, fetchApi: hargaApi.getAll });

const headers = [
  { title: "Kode", key: "kode", width: "100px", align: "center" },
  { title: "Jenis Kain", key: "jenisKain", minWidth: "180px" },
  { title: "Warna", key: "warna", minWidth: "140px" },
  { title: "Harga Pabrik", key: "hargaPabrik", width: "140px", align: "right" },
  { title: "Harga Toko", key: "hargaToko", width: "140px", align: "right" },
];

// Options Combo Box
const options = ref<HargaOptions>({ warna: [], jenisKain: [] });

const fetchOptions = async () => {
  try {
    options.value = await hargaApi.getOptions();
  } catch (e: any) {
    toast.error("Gagal memuat opsi warna & jenis kain.");
  }
};

onMounted(() => {
  fetchOptions();
});

// ── Dialog Form ───────────────────────────────────────────────────────
const dialog = ref(false);
const dialogTitle = ref("");
const isSaving = ref(false);

const emptyForm = () => ({
  isEdit: false,
  kode: "",
  jenisKain: "",
  warna: "",
  hargaPabrik: 0,
  hargaToko: 0,
});

const form = ref(emptyForm());

const openCreate = () => {
  form.value = emptyForm();
  if (options.value.jenisKain.length > 0) {
    form.value.jenisKain = options.value.jenisKain[0];
  }
  if (options.value.warna.length > 0) {
    form.value.warna = options.value.warna[0];
  }
  dialogTitle.value = "Tambah Harga Kain";
  dialog.value = true;
};

const openEdit = async (item: Harga) => {
  try {
    const d = await hargaApi.getById(item.kode);
    form.value = {
      isEdit: true,
      kode: d.kode,
      jenisKain: d.jenisKain,
      warna: d.warna,
      hargaPabrik: d.hargaPabrik,
      hargaToko: d.hargaToko,
    };
    dialogTitle.value = "Ubah Harga Kain";
    dialog.value = true;
  } catch (e: any) {
    if (e?.isAuthExpired) return;
    toast.error(e.response?.data?.message ?? "Gagal memuat data.");
  }
};

const handleJenisKainChange = () => {
  if (options.value.warna.length > 0) {
    form.value.warna = options.value.warna[0];
  }
};

const handleSave = async () => {
  if (!form.value.jenisKain) {
    toast.warning("Jenis kain harus dipilih.");
    return;
  }
  if (!form.value.warna) {
    toast.warning("Warna harus dipilih.");
    return;
  }
  if (Number(form.value.hargaPabrik) <= 0) {
    toast.warning("Harga pabrik harus diisi.");
    return;
  }

  isSaving.value = true;
  try {
    const res = await hargaApi.save(form.value);
    toast.success(res.message || "Berhasil disimpan.");
    dialog.value = false;
    await fetchData();
  } catch (e: any) {
    toast.error(e.response?.data?.message ?? "Gagal menyimpan.");
  } finally {
    isSaving.value = false;
  }
};

const handleDelete = async (item: Harga) => {
  if (!confirm(`Yakin ingin menghapus data harga "${item.kode}"?`)) return;
  
  try {
    await hargaApi.delete(item.kode);
    toast.success("Berhasil dihapus.");
    await fetchData();
  } catch (e: any) {
    toast.error(e.response?.data?.message ?? "Gagal menghapus.");
  }
};

// Formatter Rupiah
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};
</script>

<template>
  <BaseBrowse
    title="Master Harga Kain"
    :menu-id="MENU_ID"
    :icon="IconTags"
    :headers="headers"
    :items="items ?? []"
    :is-loading="isLoading"
    :selected="selected"
    @update:selected="selected = $event"
    item-value="kode"
    :can-insert="canInsert"
    :can-edit="canEdit"
    :can-delete="canDelete"
    :can-export="canExport"
    search-placeholder="Cari harga kain..."
    @refresh="fetchData"
    @add="openCreate"
    @edit="openEdit"
    @delete="handleDelete"
  >
    <!-- Format angka di tabel -->
    <template #item.hargaPabrik="{ item }">
      {{ formatCurrency(item.hargaPabrik) }}
    </template>
    <template #item.hargaToko="{ item }">
      {{ formatCurrency(item.hargaToko) }}
    </template>
  </BaseBrowse>

  <!-- ── Dialog Form ── -->
  <v-dialog v-model="dialog" max-width="480" persistent>
    <v-card rounded="lg">
      <v-card-title
        class="d-flex align-center gap-2 pa-4 pb-2"
        style="font-size: 14px; font-weight: 700; border-top: 3px solid #2e7d32"
      >
        <IconTags :size="18" :stroke-width="1.8" color="#2e7d32" />
        {{ dialogTitle }}
      </v-card-title>

      <v-card-text class="pa-4 pt-3">
        <div class="form-grid">
          <!-- Kode (Auto-generated saat tambah) -->
          <div class="form-row" v-if="form.isEdit">
            <label class="form-label">Kode Harga</label>
            <v-text-field
              v-model="form.kode"
              density="compact"
              variant="outlined"
              hide-details
              disabled
            />
          </div>

          <!-- Jenis Kain -->
          <div class="form-row">
            <label class="form-label">Jenis Kain <span class="req">*</span></label>
            <v-select
              v-model="form.jenisKain"
              :items="options.jenisKain"
              density="compact"
              variant="outlined"
              hide-details
              placeholder="Pilih Jenis Kain"
              @update:model-value="handleJenisKainChange"
            />
          </div>

          <!-- Warna -->
          <div class="form-row">
            <label class="form-label">Warna <span class="req">*</span></label>
            <v-select
              v-model="form.warna"
              :items="options.warna"
              density="compact"
              variant="outlined"
              hide-details
              placeholder="Pilih Warna"
            />
          </div>

          <!-- Harga Pabrik -->
          <div class="form-row">
            <label class="form-label">Harga Pabrik <span class="req">*</span></label>
            <v-text-field
              v-model.number="form.hargaPabrik"
              type="number"
              density="compact"
              variant="outlined"
              hide-details
              placeholder="0"
            />
          </div>

          <!-- Harga Toko -->
          <div class="form-row">
            <label class="form-label">Harga Toko</label>
            <v-text-field
              v-model.number="form.hargaToko"
              type="number"
              density="compact"
              variant="outlined"
              hide-details
              placeholder="0"
            />
          </div>
        </div>
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-3">
        <v-spacer />
        <v-btn variant="text" @click="dialog = false" :disabled="isSaving"
          >Batal</v-btn
        >
        <v-btn
          color="primary"
          variant="flat"
          @click="handleSave"
          :loading="isSaving"
          >Simpan</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.form-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.form-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}
.req {
  color: red;
}
</style>