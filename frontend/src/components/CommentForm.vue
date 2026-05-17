<template>
  <form @submit.prevent="submit">
    <label>
      Name
      <input v-model="name" type="text" required />
    </label>

    <label>
      Kommentar
      <textarea v-model="text" rows="4" required></textarea>
    </label>

    <label>
      Fotos (optional)
      <FileUpload v-model="files" :max-upload-size="MAX_UPLOAD_SIZE" />
    </label>

    <progress v-if="submitting"></progress>
    <button v-else type="submit" :disabled="!props.turnstileToken">Kommentar abschicken</button>
  </form>
</template>

<script setup>
import { ref } from "vue";
import { createComment } from "../api.js";
import FileUpload from "./FileUpload.vue";

const props = defineProps({ issueId: Number, turnstileToken: String });
const emits = defineEmits(["created"]);

const name = ref("");
const files = ref([]);
const submitting = ref(false);

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const text = ref("");

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
      text: text.value,
      photos: photoUrls,
      turnstile_token: props.turnstileToken,
    };
    await createComment(props.issueId, payload);
    name.value = "";
    text.value = "";
    files.value = [];
    emits("created");
  } finally {
    submitting.value = false;
  }
}
</script>
