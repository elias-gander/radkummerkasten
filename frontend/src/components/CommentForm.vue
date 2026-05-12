<template>
  <form @submit.prevent="submit">
    <label>
      Kommentar
      <textarea v-model="comment" rows="4" required></textarea>
    </label>

    <label>
      Fotos (optional)
      <FileUpload v-model="files" :max-upload-size="MAX_UPLOAD_SIZE" @files-changed="onFilesChanged" />
    </label>

    <label>
      Name
      <input v-model="name" type="text" />
    </label>

    <button type="submit" :disabled="submitting">
      <span v-if="submitting">Wird übermittelt...</span>
      <span v-else>Kommentar abschicken</span>
    </button>
  </form>
</template>

<script setup>
import { ref } from "vue";
import { createComment, uploadImage } from "../services/api.js";
import FileUpload from "./FileUpload.vue";

const props = defineProps({ issueId: Number });
const emits = defineEmits(["created"]);

const name = ref("");
const files = ref([]);
const submitting = ref(false);

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB in bytes

function onFilesChanged(updatedFiles) {
  files.value = updatedFiles;
}

async function submit() {
  submitting.value = true;

  try {
    let photoUrls;

    if (files.value.length) {
      const uploads = await Promise.all(
        files.value.map((file) => uploadImage(file)),
      );
      photoUrls = uploads.map((result) => result.url);
    }

    const payload = {
      name: name.value,
      photos: photoUrls,
    };
    await createComment(props.issueId, payload);
    name.value = "";
    files.value = [];
    emits("created");
  } finally {
    submitting.value = false;
  }
}
</script>
