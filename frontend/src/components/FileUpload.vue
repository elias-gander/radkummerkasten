<template>
  <input type="file" accept="image/*" multiple @change="onFilesChange" />

  <div v-if="!isWithinFileSizeLimit" class="filesize-error">
    {{ formatFileSize(totalFileSize) }} /
    {{ formatFileSize(MAX_UPLOAD_SIZE) }}
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
  isWithinFileSizeLimit: {
    type: Boolean,
    required: true
  },
});

const emit = defineEmits(["update:modelValue", "update:isWithinFileSizeLimit"]);

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const totalFileSize = computed(() =>
  props.modelValue.reduce((sum, file) => sum + file.size, 0)
);
const isWithinFileSizeLimit = computed(
  () => totalFileSize.value <= MAX_UPLOAD_SIZE
);

watch(
  isWithinFileSizeLimit,
  (value) => {
    emit("update:isWithinFileSizeLimit", value);
  },
  { immediate: true }
);

function onFilesChange(event) {
  emit("update:modelValue", Array.from(event?.target?.files ?? []));
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    Math.round((bytes / Math.pow(k, i)) * 100) / 100 +
    " " +
    sizes[i]
  );
}
</script>