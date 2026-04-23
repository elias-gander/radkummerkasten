<template>
  <div class="app-shell">
    <header class="app-header">
      <div>
        <h1>Radkummerkasten</h1>
        <p>Wiener Fahrradprobleme finden, melden und besprechen.</p>
      </div>
      <button class="primary-button" @click="openCreate">Neuer Eintrag</button>
    </header>

    <main class="app-body">
      <section class="map-column">
        <IssueMap
          :issues="issues"
          :selectedIssueId="selectedIssue?.id"
          @selectIssue="selectIssue"
          @mapClick="setCreateLocation"
        />
      </section>

      <section class="panel-column">
        <div class="panel-scroll">
          <template v-if="selectedIssue">
            <IssuePanel
              :issue="selectedIssue"
              :loadIssue="loadSelectedIssue"
              @commentCreated="onCommentCreated"
            />
          </template>
          <template v-else>
            <div class="empty-state">
              <p>
                Wähle einen Eintrag auf der Karte oder erstelle einen neuen
                Bericht.
              </p>
            </div>
          </template>

          <IssueForm
            v-if="createOpen"
            :location="createLocation"
            :issueTypes="issueTypes"
            @submit="onCreateIssue"
            @close="createOpen = false"
          />

          <EmailVerificationDialog
            v-if="pendingToken || tokenToVerify"
            :token="tokenToVerify || pendingToken"
            @verified="onVerified"
          />
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
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
  loadSelectedIssue(issue.id);
}

function openCreate() {
  createOpen.value = true;
}

function setCreateLocation(coords) {
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
