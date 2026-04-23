<template>
  <div class="panel-card form-card">
    <div class="panel-header">
      <div>
        <h2>Neues Problem melden</h2>
        <p>Tippe auf die Karte, um den Standort zu setzen.</p>
      </div>
      <button class="secondary-button" @click="$emit('close')">
        Schließen
      </button>
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
        <textarea v-model="beschreibung" rows="4"></textarea>
      </label>

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

      <div class="field-row">
        <label>
          Breite
          <input v-model.number="latitude" type="number" step="0.000001" />
        </label>
        <label>
          Länge
          <input v-model.number="longitude" type="number" step="0.000001" />
        </label>
      </div>

      <div class="photo-input-group">
        <label>
          Foto-URL hinzufügen
          <input v-model="photoUrl" type="url" placeholder="https://..." />
        </label>
        <button type="button" class="secondary-button" @click="addPhotoUrl">
          Hinzufügen
        </button>
      </div>

      <div class="photo-list" v-if="photoUrls.length">
        <div v-for="(url, index) in photoUrls" :key="index" class="photo-item">
          <span>{{ url }}</span>
          <button type="button" @click="removePhoto(index)">Entfernen</button>
        </div>
      </div>

      <button type="submit" class="primary-button">
        Erstellen und Link prüfen
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  issueTypes: Array,
  location: Object,
});
const emits = defineEmits(["submit", "close"]);

const issue_type = ref(props.issueTypes?.[0] || "Gefahrenstelle");
const beschreibung = ref("");
const vorname = ref("");
const nachname = ref("");
const email = ref("");
const latitude = ref(props.location.latitude || 48.2082);
const longitude = ref(props.location.longitude || 16.3738);
const photoUrl = ref("");
const photoUrls = ref([]);

watch(
  () => props.location,
  (newLocation) => {
    latitude.value = newLocation.latitude;
    longitude.value = newLocation.longitude;
  },
);

function addPhotoUrl() {
  if (photoUrl.value.trim()) {
    photoUrls.value.push(photoUrl.value.trim());
    photoUrl.value = "";
  }
}

function removePhoto(index) {
  photoUrls.value.splice(index, 1);
}

function submit() {
  emits("submit", {
    issue_type: issue_type.value,
    beschreibung: beschreibung.value,
    vorname: vorname.value,
    nachname: nachname.value,
    email: email.value,
    latitude: latitude.value,
    longitude: longitude.value,
    photos: photoUrls.value.length ? photoUrls.value : undefined,
  });
  beschreibung.value = "";
  vorname.value = "";
  nachname.value = "";
  email.value = "";
  photoUrls.value = [];
}
</script>
