<template>
  <div class="app-shell">
    <header class="app-header">
      <h1>Radkummerkasten</h1>
    </header>

    <main class="app-body">
      <section class="map-column">
        <IssueMap
          :issues="issues"
          :selectedIssueId="selectedIssue?.id"
          :createLocation="createLocation"
          :createOpen="createOpen"
          @selectIssue="selectIssue"
          @mapClick="setCreateLocation"
        />
      </section>

      <section class="panel-column" :class="{ open: panelOpen }">
        <template v-if="selectedIssue">
          <IssuePanel
            :issue="selectedIssue"
            :loadIssue="loadSelectedIssue"
            @commentCreated="onCommentCreated"
            @close="closePanel"
          />
        </template>

        <template v-else-if="createOpen">
          <IssueForm
            :location="createLocation"
            :issueTypes="issueTypes"
            @submit="onCreateIssue"
            @close="closePanel"
          />
        </template>

        <EmailVerificationDialog
          v-if="pendingToken || tokenToVerify"
          :token="tokenToVerify || pendingToken"
          @verified="onVerified"
        />
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import IssueMap from "./components/IssueMap.vue";
import IssuePanel from "./components/IssuePanel.vue";
import IssueForm from "./components/IssueForm.vue";
import EmailVerificationDialog from "./components/EmailVerificationDialog.vue";
import {
  loadIssues,
  loadIssue,
  createIssue,
  verifyToken,
} from "./services/api.js";

const issues = ref([]);
const selectedIssue = ref(null);
const createOpen = ref(false);
const createLocation = ref({ latitude: 48.2082, longitude: 16.3738 });
const tokenToVerify = ref(null);
const pendingToken = ref(null);

const panelOpen = computed(() => !!selectedIssue.value || createOpen.value);

const issueTypes = [
  "Gefahrenstelle",
  "Lückenschluss",
  "Einbahn öffnen",
  "Radbügel",
  "Markierung oder Schild",
  "Ampel",
  "Hindernis",
  "Anderes",
];

async function refreshIssues() {
  issues.value = await loadIssues();
}

async function loadSelectedIssue(id) {
  selectedIssue.value = await loadIssue(id);
}

function selectIssue(issue) {
  selectedIssue.value = null;
  createOpen.value = false;
  loadSelectedIssue(issue.id);
}

function closePanel() {
  selectedIssue.value = null;
  createOpen.value = false;
}

function setCreateLocation(coords) {
  selectedIssue.value = null;
  createLocation.value = coords;
  createOpen.value = true;
}

async function onCreateIssue(payload) {
  const result = await createIssue(payload);
  pendingToken.value = result.token;
}

async function onVerified() {
  pendingToken.value = null;
  tokenToVerify.value = null;
  await refreshIssues();
}

async function onCommentCreated() {
  if (selectedIssue.value) {
    await loadSelectedIssue(selectedIssue.value.id);
  }
}

onMounted(async () => {
  await refreshIssues();
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (token) {
    tokenToVerify.value = token;
  }
});
</script>
