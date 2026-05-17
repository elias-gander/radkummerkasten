<template>
  <main>
    <progress class="loading-issues-indicator" v-if="isLoadingIssues"></progress>

    <section class="map-column">
      <IssueMap :issues="issues" :newIssueLocation="newIssueLocation" :newIssueTypeId="newIssueTypeId"
        :selectedIssueId="selectedIssueId" @doneLoading="hideMapLoadingIndicator" @selectIssue="onSelectIssue"
        @mapClick="onMapClick" />
    </section>

    <section class="panel-column" :class="{ open: selectedIssueId || newIssueLocation }">
      <div>
        <button class="panel-close" type="button" @click="closePanel">
          ×
        </button>

        <template v-if="selectedIssueId">
          <IssuePanel :issueId="selectedIssueId" :turnstileToken="turnstileToken" />
        </template>

        <template v-else-if="newIssueLocation">
          <IssueForm :location="newIssueLocation" :turnstileToken="turnstileToken"
            @selectIssueTypeId="setNewIssueTypeId" @createIssue="onCreateIssue" />
        </template>

        <VueTurnstile :site-key="turnstileSiteKey" v-model="turnstileToken" theme="light" appearance="interaction-only"
          language="de" />
      </div>
    </section>
  </main>
</template>

<script setup>
import VueTurnstile from "vue-turnstile";
import { ref, watch, onMounted } from "vue";
import IssueMap from "./components/IssueMap.vue";
import IssuePanel from "./components/IssuePanel.vue";
import IssueForm from "./components/IssueForm.vue";
import {
  loadIssues,
  confirmSubscription,
} from "./api.js";

const isLoadingIssues = ref(false);
const issues = ref([]);
const selectedIssueId = ref(null);
const newIssueLocation = ref(null);
const newIssueTypeId = ref("anderes");
const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const turnstileToken = ref("");

watch(selectedIssueId, (newValue) => {
  const url = new URL(window.location.href)
  if (newValue) {
    url.searchParams.set("issue", newValue)
  } else {
    url.searchParams.delete("issue")
  }
  window.history.replaceState({}, '', url)
});

async function onSelectIssue(id) {
  newIssueLocation.value = null;
  newIssueTypeId.value = "anderes";
  selectedIssueId.value = id;
}

async function onCreateIssue(issue) {
  issues.value.push(issue);
  selectedIssueId.value = issue.id;
}

function closePanel() {
  selectedIssueId.value = null;
  newIssueLocation.value = null;
  newIssueTypeId.value = "anderes";
}

function onMapClick(coords) {
  if (selectedIssueId.value) {
    selectedIssueId.value = null;
  } else {
    newIssueLocation.value = coords;
  }
}

function setNewIssueTypeId(issueTypeId) {
  newIssueTypeId.value = issueTypeId;
}

function hideMapLoadingIndicator() {
  isLoadingIssues.value = false;
}

onMounted(async () => {
  isLoadingIssues.value = true;
  issues.value = await loadIssues();

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (token) {
    try {
      await confirmSubscription(token);
    } catch (error) {
      alert("E-Mail-Bestätigungslink ist ungültig oder abgelaufen.");
    } finally {
      params.delete("token");
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", newUrl);
    }
  }
  const issueId = Number(params.get("issue"));
  if (issueId) {
    onSelectIssue(issueId);
  }
});
</script>
