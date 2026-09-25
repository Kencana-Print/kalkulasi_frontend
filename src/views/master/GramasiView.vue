<script setup lang="ts">
import { ref } from "vue";
import { useToast } from "vue-toastification";
import { IconScale } from "@tabler/icons-vue";
import BaseBrowse from "@/components/BaseBrowse.vue";
import { useBrowse } from "@/composables/useBrowse";
import { gramasiApi, type Gramasi } from "@/api/master/gramasiApi";

const MENU_ID = "8"; // Sesuaikan ID menu
const toast = useToast();

const {
  items,
  isLoading,
  selected,
  canInsert,
  canDelete,
  canExport,
  fetchData,
} = useBrowse<Gramasi>({
  menuId: MENU_ID,
  fetchApi: gramasiApi.getAll,
});

const headers = [{ title: "Gramasi", key: "gramasi", minWidth: "200px" }];

// ── Dialog Tambah Gramasi ─────────────────────────────────────────────
const dialog = ref(false);
const isSaving = ref(false);
const formGramasi = ref("");

const openCreate = () => {
  formGramasi.value = "";
  dialog.value = true;
};

const handleSave = async () => {
  if (!formGramasi.value.trim()) {
    toast.warning("Gramasi harus diisi.");
    return;
  }

  isSaving.value = true;
  try {
    await gramasiApi.save({ gramasi: formGramasi.value.trim() });
    toast.success("Berhasil disimpan.");
    dialog.value = false;
    await fetchData();
  } catch (e: any) {
    toast.error(e.response?.data?.message ?? "Gagal menyimpan.");
  } finally {
    isSaving.value = false;
  }
};

const handleDelete = async (item: Gramasi) => {
  if (!confirm(`Yakin ingin menghapus gramasi "${item.gramasi}"?`)) return;

  try {
    await gramasiApi.delete(item.gramasi);
    toast.success("Berhasil dihapus.");
    await fetchData();
  } catch (e: any) {
    toast.error(e.response?.data?.message ?? "Gagal menghapus.");
  }
};
</script>

<template>
  <BaseBrowse
    title="Master Gramasi"
    :menu-id="MENU_ID"
    :icon="IconScale"
    :headers="headers"
    :items="items ?? []"
    :is-loading="isLoading"
    :selected="selected"
    @update:selected="selected = $event"
    item-value="gramasi"
    :can-insert="canInsert"
    :can-edit="false"
    :can-delete="canDelete"
    :can-export="canExport"
    search-placeholder="Cari gramasi..."
    @refresh="fetchData"
    @add="openCreate"
    @delete="handleDelete"
  />

  <!-- ── Dialog Tambah Gramasi ── -->
  <v-dialog v-model="dialog" max-width="380" persistent>
    <v-card rounded="lg">
      <v-card-title
        class="d-flex align-center gap-2 pa-4 pb-2"
        style="font-size: 14px; font-weight: 700; border-top: 3px solid #2e7d32"
      >
        <IconScale :size="18" :stroke-width="1.8" color="#2e7d32" />
        Tambah Gramasi
      </v-card-title>

      <v-card-text class="pa-4 pt-3">
        <label class="form-label">Gramasi <span class="req">*</span></label>
        <v-text-field
          v-model="formGramasi"
          density="compact"
          variant="outlined"
          hide-details
          placeholder="Contoh: 180-190/45"
          autofocus
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