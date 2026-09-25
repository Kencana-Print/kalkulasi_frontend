<script setup lang="ts">
import { ref } from "vue";
import { useToast } from "vue-toastification";
import { IconList } from "@tabler/icons-vue";
import BaseBrowse from "@/components/BaseBrowse.vue";
import { useBrowse } from "@/composables/useBrowse";
import { jenisApi, type JenisKain } from "@/api/master/jenisApi";
import { exportJenisKain } from "@/utils/exportExcel"; // Buat utilitas ini jika diperlukan

const MENU_ID = "9";
const toast = useToast();

const {
  items,
  isLoading,
  selected,
  canInsert,
  canDelete,
  canExport,
  fetchData,
} = useBrowse<JenisKain>({
  menuId: MENU_ID,
  fetchApi: jenisApi.getAll,
});

const headers = [{ title: "Jenis Kain", key: "nama", minWidth: "200px" }];

// ── Dialog ───────────────────────────────────────────────────────────
const dialog = ref(false);
const isSaving = ref(false);
const formNama = ref("");

const openCreate = () => {
  formNama.value = "";
  dialog.value = true;
};

const handleSave = async () => {
  if (!formNama.value.trim()) {
    toast.warning("Nama jenis kain harus diisi.");
    return;
  }

  isSaving.value = true;
  try {
    await jenisApi.save({ nama: formNama.value.trim().toUpperCase() });
    toast.success("Berhasil disimpan.");
    dialog.value = false;
    await fetchData();
  } catch (e: any) {
    toast.error(e.response?.data?.message ?? "Gagal menyimpan.");
  } finally {
    isSaving.value = false;
  }
};

const handleDelete = async (item: JenisKain) => {
  try {
    await jenisApi.delete(item.nama);
    toast.success("Berhasil dihapus.");
    await fetchData();
  } catch (e: any) {
    toast.error(e.response?.data?.message ?? "Gagal menghapus.");
  }
};
</script>

<template>
  <BaseBrowse
    title="Master Jenis Kain"
    :menu-id="MENU_ID"
    :icon="IconList"
    :headers="headers"
    :items="items ?? []"
    :is-loading="isLoading"
    :selected="selected"
    @update:selected="selected = $event"
    item-value="nama"
    :can-insert="canInsert"
    :can-edit="false"
    :can-delete="canDelete"
    :can-export="canExport"
    :export-fn="() => exportJenisKain(items ?? [])"
    search-placeholder="Cari jenis kain..."
    @refresh="fetchData"
    @add="openCreate"
    @delete="handleDelete"
  />

  <!-- ── Dialog Tambah ── -->
  <v-dialog v-model="dialog" max-width="380" persistent>
    <v-card rounded="lg">
      <v-card-title
        class="d-flex align-center gap-2 pa-4 pb-2"
        style="font-size: 14px; font-weight: 700; border-top: 3px solid #2e7d32"
      >
        <IconList :size="18" :stroke-width="1.8" color="#2e7d32" />
        Tambah Jenis Kain
      </v-card-title>

      <v-card-text class="pa-4 pt-3">
        <label class="form-label"
          >Jenis Kain <span class="req">*</span></label
        >
        <v-text-field
          v-model="formNama"
          density="compact"
          variant="outlined"
          hide-details
          placeholder="Contoh: COTTON COMBED 30S"
          autofocus
          style="text-transform: uppercase"
          @keydown.enter="handleSave"
        />
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
.form-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  display: block;
  margin-bottom: 4px;
}
.req {
  color: red;
}
</style>