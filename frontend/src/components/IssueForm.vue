<template>
  <div>
    <h1>Neue Problemstelle</h1>
    <div class="secondary">
      <progress v-if="isLoadingAddress"></progress>
      <span v-else>{{ address }}</span> ({{ props.location.latitude.toFixed(6) }}, {{
        props.location.longitude.toFixed(6)
      }})
    </div>
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
      <textarea v-model="description" rows="4" required></textarea>
    </label>

    <label>
      Fotos (optional)
      <FileUpload v-model="files" v-model:isWithinFileSizeLimit="isWithinFileSizeLimit" />
    </label>

    <label>
      Name
      <input v-model="name" type="text" required />
    </label>

    <label>
      E-Mail (optional, für Benachrichtigungen)
      <input v-model="email" type="email" />
    </label>

    <progress v-if="isSubmitting"></progress>
    <button v-else type="submit" :disabled="!props.turnstileToken || isLoadingAddress || !isWithinFileSizeLimit">
      Absenden
    </button>
  </form>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import FileUpload from "./FileUpload.vue";
import { ISSUE_TYPES } from "../constants.js";
import { createIssue } from "../api.js"

const props = defineProps({
  location: { type: [{ latitude: Number, longitude: Number }, null], required: true },
  turnstileToken: { type: [String, null], required: true },
});
const emits = defineEmits(["selectIssueTypeId", "createIssue"]);

const issueTypeId = ref("anderes");
const description = ref("");
const name = ref("");
const email = ref("");
const files = ref([]);
const address = ref("");
const isLoadingAddress = ref(false);
const isSubmitting = ref(false);
const isWithinFileSizeLimit = ref(true);

watch(issueTypeId, (newTypeId) => emits("selectIssueTypeId", newTypeId));
watch(() => props.location, updateAddress, { immediate: true });

async function updateAddress() {
  isLoadingAddress.value = true;
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${props.location.latitude}&lon=${props.location.longitude}&zoom=18&addressdetails=1`
    );
    const data = await response.json();
    if (data && data.address) {
      const road = data.address.road || data.address.pedestrian || data.address.path;
      const houseNumber = data.address.house_number;
      if (road) {
        address.value = houseNumber ? `${road} ${houseNumber}` : road;
      }
    }
  } catch {
    address.value = "unbekannte Adresse";
  } finally {
    isLoadingAddress.value = false;
  }
}

async function submit() {
  isSubmitting.value = true;
  let newIssue = {
    id: null,
    issue_type_id: issueTypeId.value,
    latitude: props.location.latitude,
    longitude: props.location.longitude,
  };
  newIssue.id = await createIssue({
    issueTypeId: issueTypeId.value,
    latitude: props.location.latitude,
    longitude: props.location.longitude,
    name: name.value,
    description: description.value,
    email: email.value,
    turnstileToken: props.turnstileToken,
    files: files.value
  })
  isSubmitting.value = false;
  emits("createIssue", newIssue);
}
</script>