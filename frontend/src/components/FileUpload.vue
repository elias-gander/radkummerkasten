<template>
  <input ref="filesInput" type="file" accept="image/*" multiple @change="onFilesChange" />
  <div v-if="totalFileSize > maxUploadSize" class="filesize-error">
    {{ formatFileSize(totalFileSize) }} / {{ formatFileSize(maxUploadSize) }}
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  maxUploadSize: {
    type: Number
  },
  modelValue: {
    type: Array,
    default: () => [],
  },
});

const files = ref([...props.modelValue]);
const filesInput = ref(null);

const totalFileSize = computed(() =>
  files.value.reduce((sum, file) => sum + file.size, 0),
);

function onFilesChange(event) {
  const newFiles = Array.from(event?.target?.files ?? []);
  files.value = newFiles;
  const dt = new DataTransfer();
  files.value.forEach(file => {
    dt.items.add(file);
  });
  filesInput.value.files = dt.files;
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + sizes[i];
}
</script>