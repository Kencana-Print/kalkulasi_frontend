<script setup lang="ts">
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { IconTools } from "@tabler/icons-vue";
import BaseBrowse from "@/components/BaseBrowse.vue";
import { useBrowse } from "@/composables/useBrowse";
import { biayaApi, type BiayaPengerjaan } from "@/api/master/biayaApi";

// men_id 12 = frmBrowBpengerjaan (Master Biaya Pengerjaan) — sama dengan menu sidebar & backend.
const MENU_ID = "12";
const router = useRouter();
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
  exportToExcel,
} = useBrowse<BiayaPengerjaan>({
  menuId: MENU_ID,
  fetchApi: biayaApi.getAll,
});

// Replikasi SQLMaster UBrowseBpengerjaan (ORDER BY bp_jenis, bp_ket di server)
const headers = [
  { title: "Kode", key: "kode", width: "90px" },
  { title: "Jenis", key: "jenis", width: "110px" },
  { title: "Keterangan", key: "keterangan", minWidth: "200px" },
  { title: "Satuan", key: "satuan", width: "80px" },
  { title: "Medium", key: "medium", width: "120px", align: "right" },
  { title: "Premium", key: "premium", width: "120px", align: "right" },
  { title: "Biaya Minimal", key: "biayaMinimal", width: "130px", align: "right" },
];

const fmt = (v: any) => Number(v || 0).toLocaleString("id-ID");

const openCreate = () => router.push({ name: "MasterBiayaCreate" });
const openEdit = (item: BiayaPengerjaan) =>
  router.push({ name: "MasterBiayaEdit", params: { kode: item.kode } });

const handleDelete = async (item: BiayaPengerjaan) => {
  try {
    await biayaApi.remove(item.kode);
    toast.success("Berhasil dihapus.");
    await fetchData();
  } catch (e: any) {
    toast.error(e.response?.data?.message ?? "Gagal menghapus.");
  }
};
</script>

<template>
  <BaseBrowse
    title="Master Biaya Pengerjaan"
    :menu-id="MENU_ID"
    :icon="IconTools"
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
    :export-fn="() => exportToExcel('Master_Biaya_Pengerjaan')"
    search-placeholder="Cari kode / jenis / keterangan..."
    @refresh="fetchData"
    @add="openCreate"
    @edit="openEdit"
    @delete="handleDelete"
  >
    <template #item.medium="{ item }">
      <span class="num">{{ fmt((item.raw || item).medium) }}</span>
    </template>
    <template #item.premium="{ item }">
      <span class="num">{{ fmt((item.raw || item).premium) }}</span>
    </template>
    <template #item.biayaMinimal="{ item }">
      <span class="num">{{ fmt((item.raw || item).biayaMinimal) }}</span>
    </template>
  </BaseBrowse>
</template>

<style scoped>
.num {
  font-variant-numeric: tabular-nums;
}
</style>
