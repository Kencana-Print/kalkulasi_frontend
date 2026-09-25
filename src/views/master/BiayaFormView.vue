<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { IconTools } from "@tabler/icons-vue";
import { useForm } from "@/composables/useForm";
import BaseForm from "@/components/BaseForm.vue";
import { biayaApi, type BiayaOptions } from "@/api/master/biayaApi";

const MENU_ID = "12";
const route = useRoute();
const router = useRouter();
const toast = useToast();

const isEditMode = computed(() => !!route.params.kode);

interface FormState {
  kode: string;
  jenis: string;
  keterangan: string;
  satuan: string;
  medium: number;
  premium: number;
  biayaMinimal: number;
  options: BiayaOptions;
}

const defaultData: FormState = {
  kode: "",
  jenis: "",
  keterangan: "",
  satuan: "CM2",
  medium: 0,
  premium: 0,
  biayaMinimal: 0,
  options: { jenis: [], satuan: [] },
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
    const options = await biayaApi.getOptions();
    if (isEditMode.value) {
      const d = await biayaApi.getDetail(String(route.params.kode));
      return {
        kode: d.kode,
        jenis: d.jenis,
        keterangan: d.keterangan,
        satuan: d.satuan,
        medium: Number(d.medium),
        premium: Number(d.premium),
        biayaMinimal: Number(d.biayaMinimal),
        options,
      };
    }
    return { ...defaultData, jenis: options.jenis[0] ?? "", satuan: "CM2", options };
  },

  submitApi: async (data: any) => {
    const payload = {
      jenis: (data.jenis || "").trim(),
      keterangan: (data.keterangan || "").trim().toUpperCase(),
      medium: Number(data.medium) || 0,
      premium: Number(data.premium) || 0,
      biayaMinimal: Number(data.biayaMinimal) || 0,
    };
    return isEditMode.value
      ? biayaApi.update(String(route.params.kode), payload)
      : biayaApi.create(payload);
  },

  onSuccess: (res: any) => {
    toast.success(res?.message ?? "Berhasil disimpan.");
    router.push({ name: "MasterBiaya" });
  },
});

// Replikasi cbbJenisChange: JAHIT → PCS, selainnya → CM2
watch(
  () => formData.value?.jenis,
  (j: string) => {
    if (!formData.value) return;
    formData.value.satuan = j === "JAHIT" ? "PCS" : "CM2";
  },
);

// Replikasi validasi btnSimpanClick Delphi
const validateSave = () => {
  const fd: any = formData.value;
  if (!fd.jenis?.trim()) {
    toast.warning("Jenis pengerjaan kosong, tidak dapat disimpan");
    return;
  }
  if (!fd.keterangan?.trim()) {
    toast.warning("Keterangan harus di isi.");
    return;
  }
  if (!(Number(fd.medium) > 0)) {
    toast.warning("Tarif Medium harus diisi.");
    return;
  }
  if (!(Number(fd.premium) > 0)) {
    toast.warning("Tarif Premium harus diisi.");
    return;
  }
  showSaveDialog.value = true;
};

onMounted(async () => {
  await fetchData();
});
</script>

<template>
  <BaseForm
    :title="isEditMode ? 'Ubah Biaya Pengerjaan' : 'Tambah Biaya Pengerjaan'"
    menu-id="12"
    :icon="IconTools"
    :is-loading="isLoading"
    :is-saving="isSaving"
    item-name="Biaya Pengerjaan"
    v-model:show-save-dialog="showSaveDialog"
    v-model:show-cancel-dialog="showCancelDialog"
    v-model:show-close-dialog="showCloseDialog"
    @validate-save="validateSave"
    @confirm-save="executeSave"
    @confirm-cancel="executeCancel"
    @confirm-close="executeClose"
  >
    <div class="bp-wrap">
      <div class="section-card">
        <div class="sec-title">Data Pengerjaan</div>
        <div class="fr">
          <label class="lbl">Kode</label>
          <input
            :value="formData.kode || '(Otomatis)'"
            readonly
            class="inp ro"
            style="width: 140px; font-weight: 700; color: #1565c0"
          />
        </div>
        <div class="fr">
          <label class="lbl">Jenis</label>
          <select v-model="formData.jenis" class="inp" style="width: 220px">
            <option value="">— pilih —</option>
            <option v-for="j in formData.options.jenis" :key="j" :value="j">{{ j }}</option>
          </select>
          <label class="lbl ml-2" style="width: 70px">Satuan</label>
          <input :value="formData.satuan" readonly class="inp ro" style="width: 90px" />
        </div>
        <div class="fr">
          <label class="lbl">Keterangan</label>
          <input
            v-model="formData.keterangan"
            class="inp text-uppercase"
            style="flex: 1; max-width: 420px"
            maxlength="50"
            placeholder="Contoh: MEDIUM 1 WARNA"
          />
        </div>
        <div class="fr">
          <label class="lbl">Tarif Medium</label>
          <input
            v-model.number="formData.medium"
            type="number"
            min="0"
            step="any"
            class="inp text-right"
            style="width: 180px"
          />
        </div>
        <div class="fr">
          <label class="lbl">Tarif Premium</label>
          <input
            v-model.number="formData.premium"
            type="number"
            min="0"
            step="any"
            class="inp text-right"
            style="width: 180px"
          />
        </div>
        <div class="fr">
          <label class="lbl">Biaya Minimal</label>
          <input
            v-model.number="formData.biayaMinimal"
            type="number"
            min="0"
            step="any"
            class="inp text-right"
            style="width: 180px"
          />
        </div>
      </div>
    </div>
  </BaseForm>
</template>

<style scoped>
.bp-wrap {
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
  width: 110px;
  flex-shrink: 0;
  font-weight: 600;
  color: #424242;
  font-size: 11px;
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
select.inp {
  height: 26px;
}
.ro {
  background: #f0f0f0 !important;
  color: #555 !important;
}
.text-right {
  text-align: right;
}
.text-uppercase {
  text-transform: uppercase;
}
.ml-2 {
  margin-left: 8px;
}
</style>
