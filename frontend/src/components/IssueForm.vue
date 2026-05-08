<template>
  <div>
    <div class="panel-header">
      <div class="panel-header-row">
        <h2>Problemstelle einmelden</h2>
        <button class="panel-close" type="button" @click="$emit('close')" aria-label="Schließen">
          ×
        </button>
      </div>
    </div>

    <div>
      Position: {{ latitude.toFixed(6) }}, {{ longitude.toFixed(6) }}
    </div>
    <div>
      Adresse:
      <span v-if="addressLoading">
        <progress aria-label="Adresse wird geladen"></progress>
      </span>
      <span v-else>{{ address }}</span>
    </div>

    <form @submit.prevent="submit">
      <label>
        Typ
        <select v-model="issue_type">
          <option v-for="type in issueTypes" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </label>

      <label>
        Beschreibung
        <textarea v-model="beschreibung" rows="4" required></textarea>
      </label>

      <label>
        Name
        <input v-model="name" type="text" required />
      </label>

      <label>
        E-Mail
        <input v-model="email" type="email" required />
      </label>

      <label>
        Fotos hochladen
        <input
          ref="filesInput"
          type="file"
          accept="image/*"
          multiple
          @change="onFilesChange"
        />
      </label>

      <div class="file-list" v-if="files.length">
        <div v-for="(file, index) in files" :key="file.name + index" class="file-item">
          <span>{{ file.name }} ({{ formatFileSize(file.size) }})</span>
          <button type="button" class="secondary-button" @click="removeFile(index)">
            ×
          </button>
        </div>
        <p v-if="fileSizeError" class="field-error">{{ fileSizeError }}</p>
        <p v-else-if="totalFileSize > 0" class="file-info">
          {{ formatFileSize(totalFileSize) }} / {{ formatFileSize(MAX_UPLOAD_SIZE) }}
        </p>
      </div>

      <progress v-if="submitting" aria-label="Wird übermittelt"></progress>
      <button
        v-else
        type="submit"
        class="primary-button"
        :aria-busy="submitting"
      >
        Absenden
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from "vue";
import { uploadImage } from "../services/api.js";

const props = defineProps({
  issueTypes: Array,
  location: Object,
});
const emits = defineEmits(["submit", "close"]);

const issue_type = ref(props.issueTypes?.[0] || "Gefahrenstelle");
const beschreibung = ref("");
const name = ref("");
const email = ref("");
const latitude = ref(props.location.latitude || 48.2082);
const longitude = ref(props.location.longitude || 16.3738);
const files = ref([]);
const filesInput = ref(null);
const address = ref("");
const addressLoading = ref(true);
const submitting = ref(false);
const fileSizeError = ref("");

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB in bytes

const totalFileSize = computed(() =>
  files.value.reduce((sum, file) => sum + file.size, 0),
);

watch(
  () => props.location,
  (newLocation) => {
    latitude.value = newLocation.latitude;
    longitude.value = newLocation.longitude;
  },
);

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
    return "Unnbekannt";
  } catch (error) {
    console.error("Error fetching address:", error);
    return "Unbekannt";
  }
}

function onFilesChange(event) {
  const newFiles = Array.from(event?.target?.files ?? []);
  const potentialTotal = totalFileSize.value + newFiles.reduce((sum, f) => sum + f.size, 0);
  files.value.push(...newFiles);
  const dt = new DataTransfer()
  files.value.forEach(file => {
    dt.items.add(file)
  })
  filesInput.value.files = dt.files
  fileSizeError.value = potentialTotal > MAX_UPLOAD_SIZE ? 'Dateigröße überschritten. Maximal 5MB zulässig.' : '';
}

function removeFile(index) {
  files.value.splice(index, 1);
  onFilesChange(null);
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + sizes[i];
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
      issue_type: issue_type.value,
      beschreibung: beschreibung.value,
      vorname: name.value,
      nachname: "",
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
