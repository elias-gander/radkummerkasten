<template>
  <div class="verification-card">
    <h3>E-Mail-Verifizierung</h3>
    <p>
      Bitte bestätige den Link in der E-Mail. Falls du den Link direkt hast,
      klicke hier.
    </p>
    <button @click="verify" :disabled="loading">
      {{ loading ? "Prüfung..." : "Verifizieren" }}
    </button>
    <p v-if="message" class="verification-message">{{ message }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { verifyToken } from "../services/api.js";

const props = defineProps({ token: String });
const emits = defineEmits(["verified"]);
const loading = ref(false);
const message = ref("");

async function verify() {
  if (!props.token) {
    message.value = "Token fehlt.";
    return;
  }
  loading.value = true;
  try {
    await verifyToken(props.token);
    message.value = "Verifiziert. Die Daten sind jetzt veröffentlicht.";
    emits("verified");
  } catch (error) {
    message.value = error.message || "Verifizierung fehlgeschlagen.";
  } finally {
    loading.value = false;
  }
}
</script>
