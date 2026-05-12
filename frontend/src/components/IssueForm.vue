<template>
  <button class="panel-close" type="button" @click="$emit('close')" aria-label="Schließen">
    ×
  </button>

  <h1>Problemstelle einmelden</h1>

  <div class="secondary">
    <span v-if="addressLoading">
      <progress aria-label="Adresse wird geladen"></progress>
    </span>
    <span v-else>{{ address }}</span> ({{ latitude.toFixed(6) }}, {{ longitude.toFixed(6) }})
  </div>

  <form @submit.prevent="submit">
    <label>
      Typ
      <select v-model="issueTypeId" required>
        <option v-for="type in ISSUE_TYPES" :key="type.id" :value="type.id">
          {{ type.label }}
        </option>
      </select>
    </label>

    <label>
      Beschreibung
      <textarea v-model="beschreibung" rows="4" required></textarea>
    </label>

    <label>
      Fotos (optional)
      <FileUpload v-model="files" :max-upload-size="5 * 1024 * 1024" />
    </label>

    <label>
      Name
      <input v-model="name" type="text" required />
    </label>

    <label>
      E-Mail (optional, für Benachrichtigungen)
      <input v-model="email" type="email" />
    </label>

    <progress v-if="submitting" aria-label="Wird übermittelt"></progress>
    <button v-else type="submit" :aria-busy="submitting">
      Absenden
    </button>
  </form>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { uploadImage } from "../services/api.js";
import FileUpload from "./FileUpload.vue";
import { ISSUE_TYPES } from "../constants.js";

const props = defineProps({
  location: Object,
});
const emits = defineEmits(["selectIssueTypeId", "submit", "close"]);

const issueTypeId = ref("anderes");
const beschreibung = ref("");
const name = ref("");
const email = ref("");
const latitude = ref(props.location.latitude || 48.2082);
const longitude = ref(props.location.longitude || 16.3738);
const files = ref([]);
const address = ref("");
const addressLoading = ref(true);
const submitting = ref(false);


watch(() => props.location,
  (newLocation) => {
    latitude.value = newLocation.latitude;
    longitude.value = newLocation.longitude;
  },
);
watch(issueTypeId, (newTypeId) => emits("selectIssueTypeId", newTypeId));

async function updateAddress() {
  addressLoading.value = true;
  address.value = await getAddress(latitude.value, longitude.value);
  addressLoading.value = false;
}

watch([latitude, longitude], updateAddress);

onMounted(updateAddress);

async function getAddress(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    const data = await response.json();
    if (data && data.address) {
      const road = data.address.road || data.address.pedestrian || data.address.path;
      const houseNumber = data.address.house_number;
      if (road) {
        return houseNumber ? `${road} ${houseNumber}` : road;
      }
    }
    return "unbekannte Adresse";
  } catch (error) {
    console.error(error);
    return "unbekannte Adresse";
  }
}

async function submit() {
  while (addressLoading.value) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  submitting.value = true;

  try {
    let photoUrls;

    if (files.value.length) {
      const uploads = await Promise.all(
        files.value.map((file) => uploadImage(file)),
      );
      photoUrls = uploads.map((result) => result.url);
    }

    emits("submit", {
      issue_type_id: issueTypeId.value,
      beschreibung: beschreibung.value,
      name: name.value,
      email: email.value,
      latitude: latitude.value,
      longitude: longitude.value,
      photos: photoUrls,
    });

    beschreibung.value = "";
    name.value = "";
    email.value = "";
    files.value = [];
  } finally {
    submitting.value = false;
  }
}
</script>
