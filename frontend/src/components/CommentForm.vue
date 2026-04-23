<template>
  <div class="panel-card form-card">
    <h3>Neuen Kommentar schreiben</h3>
    <form @submit.prevent="submit">
      <label>
        Vorname
        <input v-model="vorname" type="text" />
      </label>
      <label>
        Nachname
        <input v-model="nachname" type="text" />
      </label>
      <label>
        E-Mail
        <input v-model="email" type="email" />
      </label>
      <label>
        Foto-URL
        <input v-model="photoUrl" type="url" placeholder="https://..." />
      </label>
      <button type="submit" class="primary-button">Kommentar abschicken</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { createComment } from "../services/api.js";

const props = defineProps({ issueId: Number });
const emits = defineEmits(["created"]);

const vorname = ref("");
const nachname = ref("");
const email = ref("");
const photoUrl = ref("");

async function submit() {
  const payload = {
    vorname: vorname.value,
    nachname: nachname.value,
    email: email.value,
    photos: photoUrl.value ? [photoUrl.value.trim()] : undefined,
  };
  await createComment(props.issueId, payload);
  vorname.value = "";
  nachname.value = "";
  email.value = "";
  photoUrl.value = "";
  emits("created");
}
</script>
