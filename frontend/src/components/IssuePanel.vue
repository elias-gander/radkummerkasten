<template>
  <button class="panel-close" type="button" @click="$emit('close')" aria-label="Schließen">
    ×
  </button>

  <h1>{{ issue.issue_type }}</h1>

  <div class="secondary">von {{ issueDisplayName(issue) }} am {{ formatDateTime(issue.created_at) }}</div>
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
      <strong>{{ commentDisplayName(comment) }}</strong>
      <p>{{ comment.email }}</p>
    </div>
    <div class="comment-photos" v-if="comment.photos?.length">
      <img v-for="photo in comment.photos" :key="photo.id" :src="photo.url" alt="Comment photo" />
    </div>
  </div>

  <h3>Neuer Kommentar</h3>
  <CommentForm :issueId="issue.id" @created="created" />
</template>

<script setup>
import CommentForm from "./CommentForm.vue";
import { voteIssue } from "../services/api.js";
import { ref, onMounted } from "vue";

const props = defineProps({
  issue: Object,
  loadIssue: Function,
});
const emits = defineEmits(["commentCreated", "close"]);

const voting = ref(false);
const hasVoted = ref(false);

function getVotedIssues() {
  const voted = localStorage.getItem('votedIssues');
  return voted ? JSON.parse(voted) : [];
}

function setVotedIssue(issueId) {
  const voted = getVotedIssues();
  voted.push(issueId);
  localStorage.setItem('votedIssues', JSON.stringify(voted));
}

onMounted(() => {
  const votedIssues = getVotedIssues();
  hasVoted.value = votedIssues.includes(props.issue.id);
});

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

function issueDisplayName(issue) {
  return issue.nachname
    ? `${issue.vorname} ${issue.nachname}`
    : issue.vorname || "Unbekannt";
}

function commentDisplayName(comment) {
  return comment.nachname
    ? `${comment.vorname} ${comment.nachname}`
    : comment.vorname || "Unbekannt";
}
</script>
