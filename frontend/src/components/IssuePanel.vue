<template>
  <progress v-if="isLoadingIssue"></progress>

  <template v-else>
    <div>
      <h1>{{ISSUE_TYPES.find(t => t.id === issue?.issue_type_id)?.label}}</h1>
      <div class="secondary">von {{ issue?.name }} am {{ formatDateTime(issue?.created_at) }}</div>
    </div>

    <div class="text-body">{{ issue?.description }}</div>

    <div v-if="issue?.photo_count > 0" class="photo-grid">
      <img v-for="(_, index) in issue.photo_count" :key="index" :src="`${cloudflarePublicUrl}/${issue?.id}-${index}`"
        @click="emits('openPhoto', `${cloudflarePublicUrl}/${issue?.id}-${index}`)" />
    </div>

    <button :disabled="isVoting || hasVoted" @click="vote" type="button">
      Finde ich auch ({{ issue?.upvotes }})
    </button>

    <h2>Kommentare ({{ issue?.comments?.length || 0 }})</h2>

    <div v-for="comment in issue?.comments" :key="comment.id" class="comment-container">
      <div class="secondary">von {{ comment.name }} am {{ formatDateTime(comment.created_at) }}</div>
      <div class="comment-body">
        <div class="text-body">{{ comment.text }}</div>
        <div class="photo-grid" v-if="comment.photo_count > 0">
          <img v-for="(_, index) in comment.photo_count" :key="index"
            :src="`${cloudflarePublicUrl}/${issue?.id}-${comment.id}-${index}`"
            @click="emits('openPhoto', `${cloudflarePublicUrl}/${issue?.id}-${comment.id}-${index}`)" />
        </div>
      </div>
    </div>

    <progress v-if="isSubscribing"></progress>
    <span class="secondary" v-if="confirmationLinkSentTo">Bestätigungslink gesendet an {{ confirmationLinkSentTo
    }}</span>

    <button v-else :disabled="!props.turnstileToken" @click="subscribe" type="button">
      Abonnieren
    </button>

    <h3>Neuer Kommentar</h3>
    <CommentForm :issueId="props.issueId" :turnstileToken="props.turnstileToken" @created="refreshIssue" />
  </template>
</template>

<script setup>
import CommentForm from "./CommentForm.vue";
import { voteIssue, subscribeToIssue, loadIssue } from "../api.js";
import { ref, onMounted, watch } from "vue";
import { ISSUE_TYPES } from "../constants.js";

const props = defineProps({
  issueId: { type: Number, required: true },
  turnstileToken: { type: [String, null], required: true },
});
const emits = defineEmits(["openPhoto"]);

const cloudflarePublicUrl = import.meta.env.VITE_CLOUDFLARE_PUBLIC_URL;
const isLoadingIssue = ref(false);
const issue = ref(null);
const isVoting = ref(false);
const hasVoted = ref(false);
const isSubscribing = ref(false);
const confirmationLinkSentTo = ref(null);

watch(() => props.issueId, refreshIssue, { immediate: true });

function getVotedIssues() {
  const voted = localStorage.getItem('votedIssues');
  return voted ? JSON.parse(voted) : [];
}

async function refreshIssue() {
  isLoadingIssue.value = true;
  issue.value = await loadIssue(props.issueId);
  hasVoted.value = getVotedIssues().includes(props.issueId);
  isLoadingIssue.value = false;
}

function setVotedIssue(issueId) {
  const voted = getVotedIssues();
  voted.push(issueId);
  localStorage.setItem('votedIssues', JSON.stringify(voted));
}

async function vote() {
  isVoting.value = true;
  try {
    await voteIssue(props.issueId);
    setVotedIssue(props.issueId);
    hasVoted.value = true;
    issue.value.upvotes += 1;
  } finally {
    isVoting.value = false;
  }
}

async function subscribe() {
  let email;
  do {
    email = prompt("Gib deine E-Mail-Adresse ein:");
    if (email === null) {
      return;
    }
  } while (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

  isSubscribing.value = true;
  try {
    await subscribeToIssue(props.issueId, email, props.turnstileToken);
    confirmationLinkSentTo.value = email;
  } catch (error) {
    console.error(error);
    alert("Fehler beim Abonnieren");
  } finally {
    isSubscribing.value = false;
  }
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>
