<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { IconPlus, IconTrash, IconShirt } from "@tabler/icons-vue";
import { useForm } from "@/composables/useForm";
import BaseForm from "@/components/BaseForm.vue";
import {
  pekerjaanApi,
  type PekerjaanDetailRow,
  type PekerjaanOptions,
} from "@/api/master/pekerjaanApi";

const MENU_ID = "11";
const route = useRoute();
const router = useRouter();
const toast = useToast();

const isEditMode = computed(() => !!route.params.kode);

interface FormState {
  kode: string;
  nama: string;
  warna: number; // 1 = 1 Warna, 2 = 2 Warna (rb1/rb2 di Delphi, default rb1)
  laba: number; // default 15 (edtlaba.Text := '15')
  detail: PekerjaanDetailRow[];
  options: PekerjaanOptions;
}

const blankRow = (): PekerjaanDetailRow => ({
  jeniskain: "",
  lengan: "",
  gramasi: "",
  babaran: 0,
  babaranLengan: 0,
});

const defaultData: FormState = {
  kode: "",
  nama: "",
  warna: 1,
  laba: 15,
  detail: [blankRow()],
  options: { jenisKain: [], lengan: [], gramasi: [] },
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
  menuId: MENU_ID,
  initialData: defaultData,

  fetchApi: async () => {
    const options = await pekerjaanApi.getOptions();
    if (isEditMode.value) {
      const d = await pekerjaanApi.getDetail(String(route.params.kode));
      return {
        kode: d.kode,
        nama: d.nama,
        warna: Number(d.warna),
        laba: Number(d.laba),
        detail: d.detail.length ? d.detail : [blankRow()],
        options,
      };
    }
    return { ...defaultData, detail: [blankRow()], options };
  },

  submitApi: async (data: any) => {
    const payload = {
      nama: data.nama.trim().toUpperCase(),
      warna: Number(data.warna),
      laba: Number(data.laba) || 0,
      // Baris tanpa gramasi dilewati (replikasi simpandata Delphi)
      detail: data.detail
        .filter((d: PekerjaanDetailRow) => d.gramasi?.trim())
        .map((d: PekerjaanDetailRow) => ({
          jeniskain: d.jeniskain.trim(),
          lengan: d.lengan.trim(),
          gramasi: d.gramasi.trim(),
          babaran: Number(d.babaran) || 0,
          babaranLengan: Number(d.babaranLengan) || 0,
        })),
    };
    return isEditMode.value
      ? pekerjaanApi.update(String(route.params.kode), payload)
      : pekerjaanApi.create(payload);
  },

  onSuccess: (res: any) => {
    toast.success(res?.message ?? "Berhasil disimpan.");
    router.push({ name: "MasterPekerjaan" });
  },
});

// Replikasi validasi btnSimpanClick Delphi
const validateSave = () => {
  if (!formData.value.nama?.trim()) {
    toast.warning("Nama Pekerjaan kosong, tidak dapat disimpan");
    return;
  }
  const isi = formData.value.detail.filter((d) => d.gramasi?.trim());
  if (isi.length === 0) {
    toast.warning("Detail harus diisi.");
    return;
  }
  for (const d of isi) {
    if (!d.jeniskain?.trim() || !d.lengan?.trim()) {
      toast.warning("Tiap baris detail wajib isi Jenis Kain dan Lengan.");
      return;
    }
  }
  showSaveDialog.value = true;
};

const addRow = () => formData.value.detail.push(blankRow());
const removeRow = (idx: number) => {
  if (formData.value.detail.length <= 1) {
    formData.value.detail[0] = blankRow();
    return;
  }
  formData.value.detail.splice(idx, 1);
};

onMounted(async () => {
  await fetchData();
});
</script>

<template>
  <BaseForm
    :title="isEditMode ? 'Ubah Pekerjaan' : 'Tambah Pekerjaan'"
    menu-id="11"
    :icon="IconShirt"
    :is-loading="isLoading"
    :is-saving="isSaving"
    item-name="Pekerjaan"
    v-model:show-save-dialog="showSaveDialog"
    v-model:show-cancel-dialog="showCancelDialog"
    v-model:show-close-dialog="showCloseDialog"
    @validate-save="validateSave"
    @confirm-save="executeSave"
    @confirm-cancel="executeCancel"
    @confirm-close="executeClose"
  >
    <div class="pk-wrap">
      <!-- ── Header (edtKode / edtNama / rb1-rb2 / edtlaba) ── -->
      <div class="section-card">
        <div class="sec-title">Data Pekerjaan</div>
        <div class="fr">
          <label class="lbl">Kode</label>
          <input
            :value="formData.kode || '(Otomatis)'"
            readonly
            class="inp ro"
            style="width: 140px; font-weight: 700; color: #1565c0"
          />
          <label class="lbl ml-2">Laba %</label>
          <input
            v-model.number="formData.laba"
            type="number"
            step="0.01"
            class="inp text-right"
            style="width: 110px"
          />
        </div>
        <div class="fr">
          <label class="lbl">Nama Model</label>
          <input
            v-model="formData.nama"
            class="inp text-uppercase"
            style="flex: 1; max-width: 380px"
            maxlength="50"
            placeholder="Contoh: KAOS 2 WARNA"
          />
        </div>
        <div class="fr">
          <label class="lbl">Warna</label>
          <label class="radio-lbl">
            <input v-model.number="formData.warna" type="radio" :value="1" />
            1 Warna
          </label>
          <label class="radio-lbl ml-2">
            <input v-model.number="formData.warna" type="radio" :value="2" />
            2 Warna
          </label>
        </div>
      </div>

      <!-- ── Detail grid (cxGrdMaster: jeniskain/lengan/gramasi/babaran) ── -->
      <div class="section-card mt-2 flex-grow-1">
        <div class="sec-title d-flex justify-space-between align-center">
          <span>Detail Kain</span>
          <button type="button" class="btn-action blue" @click="addRow">
            <IconPlus :size="13" class="mr-1" /> Tambah Baris
          </button>
        </div>
        <div class="ll-table-wrap">
          <table class="ll-table">
            <thead>
              <tr>
                <th style="width: 36px" class="text-center">No</th>
                <th>Jenis Kain</th>
                <th style="width: 130px">Lengan</th>
                <th style="width: 150px">Gramasi</th>
                <th style="width: 140px" class="text-right">Babaran Body</th>
                <th style="width: 150px" class="text-right">Babaran Lengan</th>
                <th style="width: 44px" class="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in formData.detail" :key="idx">
                <td class="ll-td-ctr ll-td-lbl">{{ idx + 1 }}</td>
                <td class="ll-td-inp">
                  <select v-model="row.jeniskain" class="ll-cell">
                    <option value="">— pilih —</option>
                    <option v-for="j in formData.options.jenisKain" :key="j" :value="j">{{ j }}</option>
                  </select>
                </td>
                <td class="ll-td-inp">
                  <select v-model="row.lengan" class="ll-cell">
                    <option value="">— pilih —</option>
                    <option v-for="l in formData.options.lengan" :key="l" :value="l">{{ l }}</option>
                  </select>
                </td>
                <td class="ll-td-inp">
                  <select v-model="row.gramasi" class="ll-cell">
                    <option value="">— pilih —</option>
                    <option v-for="g in formData.options.gramasi" :key="g" :value="g">{{ g }}</option>
                  </select>
                </td>
                <td class="ll-td-inp">
                  <input v-model.number="row.babaran" type="number" step="0.01" class="ll-cell tr" />
                </td>
                <td class="ll-td-inp">
                  <input v-model.number="row.babaranLengan" type="number" step="0.01" class="ll-cell tr" />
                </td>
                <td class="ll-td-ctr">
                  <button type="button" class="btn-del" title="Hapus Baris" @click="removeRow(idx)">
                    <IconTrash :size="14" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </BaseForm>
</template>

<style scoped>
.pk-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: "Segoe UI", system-ui, sans-serif;
  font-size: 11px;
  padding: 8px;
  overflow-y: auto;
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
.lbl {
  width: 100px;
  flex-shrink: 0;
  font-weight: 600;
  color: #424242;
  font-size: 11px;
}
.radio-lbl {
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
  color: #424242;
  cursor: pointer;
}
.radio-lbl input {
  accent-color: #1565c0;
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
.ro {
  background: #f0f0f0 !important;
  color: #555 !important;
}
.text-right {
  text-align: right;
}
.text-center {
  text-align: center;
}
.text-uppercase {
  text-transform: uppercase;
}
.flex-grow-1 {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}
.ml-2 {
  margin-left: 8px;
}
.mr-1 {
  margin-right: 3px;
}
.mt-2 {
  margin-top: 8px;
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
  text-align: left;
}
.ll-table td {
  border: 1px solid #eeeeee;
}
.ll-table tr:nth-of-type(even) td {
  background: #fafafa;
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
.ll-cell.tr {
  text-align: right;
}
</style>
