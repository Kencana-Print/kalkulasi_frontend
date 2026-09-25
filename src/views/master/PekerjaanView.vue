<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { IconList } from "@tabler/icons-vue";
import BaseBrowse from "@/components/BaseBrowse.vue";
import { useBrowse } from "@/composables/useBrowse";
import {
  pekerjaanApi,
  warnaLabel,
  type Pekerjaan,
  type PekerjaanDetailRow,
} from "@/api/master/pekerjaanApi";

// men_id 11 = frmBrowPekerjaan (Master Pekerjaan) — sama dengan menu sidebar & backend.
const MENU_ID = "11";
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
} = useBrowse<Pekerjaan>({
  menuId: MENU_ID,
  fetchApi: pekerjaanApi.getAll,
});

const headers = [
  { title: "Kode", key: "kode", width: "110px" },
  { title: "Nama Model", key: "nama", minWidth: "220px" },
  { title: "Warna", key: "warna", width: "110px" },
  { title: "Laba %", key: "laba", width: "100px", align: "right" },
];

// ── Expand master-detail (replikasi SQLDetail UBrowsePekerjaan) ──
const expanded = ref<any[]>([]);
const detailsMap = ref<Record<string, PekerjaanDetailRow[]>>({});
const loadingDetails = ref<Set<string>>(new Set<string>());

const onExpandedChange = async (rows: any[]) => {
  expanded.value = rows;
  for (const r of rows) {
    const raw = r.raw || r;
    const kode: string = raw.kode;
    if (!kode || detailsMap.value[kode] || loadingDetails.value.has(kode)) continue;
    loadingDetails.value.add(kode);
    try {
      const d = await pekerjaanApi.getDetail(kode);
      detailsMap.value[kode] = d.detail;
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Gagal memuat detail.");
    } finally {
      loadingDetails.value.delete(kode);
    }
  }
};

const openCreate = () => router.push({ name: "MasterPekerjaanCreate" });
const openEdit = (item: Pekerjaan) =>
  router.push({ name: "MasterPekerjaanEdit", params: { kode: item.kode } });

const handleDelete = async (item: Pekerjaan) => {
  try {
    await pekerjaanApi.remove(item.kode);
    toast.success("Berhasil dihapus.");
    delete detailsMap.value[item.kode];
    await fetchData();
  } catch (e: any) {
    toast.error(e.response?.data?.message ?? "Gagal menghapus.");
  }
};
</script>

<template>
  <BaseBrowse
    title="Master Pekerjaan"
    :menu-id="MENU_ID"
    :icon="IconList"
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
    :export-fn="() => exportToExcel('Master_Pekerjaan')"
    :show-expand="true"
    :expanded="expanded"
    :loading-details="loadingDetails"
    @update:expanded="onExpandedChange"
    search-placeholder="Cari kode / nama model..."
    @refresh="fetchData"
    @add="openCreate"
    @edit="openEdit"
    @delete="handleDelete"
  >
    <template #item.warna="{ item }">
      {{ warnaLabel((item.raw || item).warna) }}
    </template>

    <template #detail="{ item }">
      <div class="dtl-wrap">
        <div v-if="loadingDetails.has(item.kode)" class="dtl-loading">Memuat detail...</div>
        <table v-else class="dtl-table">
          <thead>
            <tr>
              <th style="width: 36px">No</th>
              <th>Jenis Kain</th>
              <th style="width: 110px">Lengan</th>
              <th style="width: 130px">Gramasi</th>
              <th style="width: 130px" class="text-right">Babaran Body</th>
              <th style="width: 140px" class="text-right">Babaran Lengan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(d, i) in detailsMap[item.kode] ?? []" :key="i">
              <td class="text-center">{{ i + 1 }}</td>
              <td>{{ d.jeniskain }}</td>
              <td>{{ d.lengan }}</td>
              <td>{{ d.gramasi }}</td>
              <td class="text-right">{{ d.babaran }}</td>
              <td class="text-right">{{ d.babaranLengan }}</td>
            </tr>
            <tr v-if="!(detailsMap[item.kode]?.length)">
              <td colspan="6" class="text-center text-grey">Tidak ada detail.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </BaseBrowse>
</template>

<style scoped>
.dtl-wrap {
  padding: 6px 4px;
}
.dtl-loading {
  font-size: 12px;
  color: #757575;
  font-style: italic;
  padding: 6px;
}
.dtl-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  font-size: 11px;
}
.dtl-table thead th {
  background: #e8f5e9;
  color: #2e7d32;
  font-weight: 700;
  padding: 5px 8px;
  border: 1px solid #c8e6c9;
  text-align: left;
}
.dtl-table td {
  border: 1px solid #eeeeee;
  padding: 4px 8px;
  color: #212121;
}
.dtl-table .text-right {
  text-align: right;
}
.dtl-table .text-center {
  text-align: center;
}
.dtl-table .text-grey {
  color: #9e9e9e;
  font-style: italic;
}
</style>
