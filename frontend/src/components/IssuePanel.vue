<template>
  <button class="panel-close" type="button" @click="$emit('close')" aria-label="Schließen">
    ×
  </button>

  <h1>{{ISSUE_TYPES.find((t) => t.id === issue.issue_type_id)?.label}}</h1>

  <div class="secondary">von {{ issue.name }} am {{ formatDateTime(issue.created_at) }}</div>
  <div>{{ issue.beschreibung }}</div>

  <div v-if="issue.photos?.length" class="photo-grid">
    <img v-for="photo in issue.photos" :key="photo.id" :src="photo.url" alt="Issue photo" />
  </div>

  <button :disabled="voting || hasVoted" @click="vote" type="button">
    Finde ich auch ({{ issue.upvotes }})
  </button>


  <h2>Kommentare ({{ issue.comments?.length || 0 }})</h2>

  <div v-for="comment in issue.comments" :key="comment.id" class="comment-card">
    <div>
      <strong>{{ comment.name }}</strong>
    </div>
    <div class="comment-photos" v-if="comment.photos?.length">
      <img v-for="photo in comment.photos" :key="photo.id" :src="photo.url" alt="Comment photo" />
    </div>
  </div>

  <progress v-if="isSubscribing"></progress>
  <span class="secondary" v-if="confirmationLinkSentTo">Bestätigungslink gesendet an {{ confirmationLinkSentTo }}</span>
  <button v-else :disabled="isSubscribing" @click="subscribe" type="button">
    Abonnieren
  </button>

  <h3>Neuer Kommentar</h3>
  <CommentForm :issueId="issue.id" @created="created" />
</template>

<script setup>
import CommentForm from "./CommentForm.vue";
import { voteIssue, subscribeToIssue } from "../services/api.js";
import { ref, onMounted, watch } from "vue";
import { ISSUE_TYPES } from "../constants.js";

const props = defineProps({
  issue: Object
});
const emits = defineEmits(["commentCreated", "close"]);

const voting = ref(false);
const hasVoted = ref(false);
const isSubscribing = ref(false);
const confirmationLinkSentTo = ref(null);

onMounted(() => {
  const votedIssues = getVotedIssues();
  hasVoted.value = votedIssues.includes(props.issue.id);
});

watch(() => props.issue.id, (newId) => { hasVoted.value = getVotedIssues().includes(newId) });

function getVotedIssues() {
  const voted = localStorage.getItem('votedIssues');
  return voted ? JSON.parse(voted) : [];
}

function setVotedIssue(issueId) {
  const voted = getVotedIssues();
  voted.push(issueId);
  localStorage.setItem('votedIssues', JSON.stringify(voted));
}

async function vote() {
  if (voting.value || hasVoted.value) return;

  voting.value = true;
  try {
    await voteIssue(props.issue.id);
    setVotedIssue(props.issue.id);
    hasVoted.value = true;
    props.issue.upvotes += 1;
  } catch (error) {
    console.error(error);
  } finally {
    voting.value = false;
  }
}

function created() {
  emits("commentCreated");
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
    await subscribeToIssue(props.issue.id, email);
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
