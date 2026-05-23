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
      <FileUpload v-model="files" v-model:isWithinFileSizeLimit="isWithinFileSizeLimit" />
    </label>

    <progress v-if="isSubmitting"></progress>
    <button v-else type="submit" :disabled="!props.turnstileToken || !isWithinFileSizeLimit">Kommentar
      abschicken</button>
  </form>
</template>

<script setup>
import { ref } from "vue";
import { createComment } from "../api.js";
import FileUpload from "./FileUpload.vue";

const props = defineProps({ issueId: { type: Number, required: true }, turnstileToken: { type: [String, null], required: true } });
const emits = defineEmits(["created"]);

const name = ref("");
const files = ref([]);
const isSubmitting = ref(false);
const text = ref("");
const isWithinFileSizeLimit = ref(true);

async function submit() {
  isSubmitting.value = true;
  console.log(files.value);
  try {
    const payload = {
      name: name.value,
      text: text.value,
      files: files.value,
      turnstileToken: props.turnstileToken,
    };
    await createComment(props.issueId, payload);
    name.value = "";
    text.value = "";
    files.value = [];
    emits("created");
  } finally {
    isSubmitting.value = false;
  }
}
</script>
