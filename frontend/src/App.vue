<template>
  <main>
    <section class="map-column">
      <IssueMap :issues="issues" :newIssueLocation="newIssueLocation" :newIssueTypeId="newIssueTypeId"
        :selectedIssueId="selectedIssue?.id" @selectIssue="selectIssue" @mapClick="setNewIssueLocation" />
    </section>

    <section class="panel-column" :class="{ open: selectedIssue || newIssueLocation }">
      <template v-if="isLoadingSelectedIssue">
        <progress></progress>
      </template>

      <template v-if="selectedIssue">
        <IssuePanel :issue="selectedIssue" :loadIssue="loadSelectedIssue" @commentCreated="onCommentCreated"
          @close="closePanel" />
      </template>

      <template v-else-if="newIssueLocation">
        <IssueForm :location="newIssueLocation" @selectIssueTypeId="setNewIssueTypeId" @submit="onCreateIssue"
          @close="closePanel" />
      </template>

      <EmailVerificationDialog v-if="pendingToken || tokenToVerify" :token="tokenToVerify || pendingToken"
        @verified="onVerified" />
    </section>
  </main>
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
const isLoadingSelectedIssue = ref(false);
const newIssueLocation = ref(null);
const newIssueTypeId = ref("anderes");
const tokenToVerify = ref(null);
const pendingToken = ref(null);

async function selectIssue(issue) {
  newIssueLocation.value = null;
  newIssueTypeId.value = "anderes";
  isLoadingSelectedIssue.value = true;
  selectedIssue.value = await loadIssue(issue.id);
  isLoadingSelectedIssue.value = false;
}

function closePanel() {
  selectedIssue.value = null;
  newIssueLocation.value = null;
  newIssueTypeId.value = "anderes";
}

function setNewIssueLocation(coords) {
  selectedIssue.value = null;
  newIssueLocation.value = coords;
}

function setNewIssueTypeId(issueTypeId) {
  newIssueTypeId.value = issueTypeId;
}

async function onCreateIssue(payload) {
  const result = await createIssue(payload);
  pendingToken.value = result.token;
}

async function onVerified() {
  pendingToken.value = null;
  tokenToVerify.value = null;
}

async function onCommentCreated() {
  selectedIssue.value = await loadIssue(selectedIssue.value.id);
}

onMounted(async () => {
  issues.value = await loadIssues();
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (token) {
    tokenToVerify.value = token;
  }
});
</script>
