<template>
  <div>
    <div class="panel-header">
      <div class="panel-header-row">
        <h2>{{ issue.issue_type }}</h2>
        <button class="panel-close" type="button" @click="$emit('close')" aria-label="Schließen">
          ×
        </button>
      </div>
      <p>von {{ issueDisplayName(issue) }} am {{ formatDateTime(issue.created_at) }}</p>
      <p>{{ issue.beschreibung }}</p>

      <div v-if="issue.photos?.length" class="photo-grid">
        <img v-for="photo in issue.photos" :key="photo.id" :src="photo.url" alt="Issue photo" />
      </div>

      <div class="panel-header-actions">
        <span class="badge">Finde ich auch ({{ issue.upvotes }})</span>
      </div>
    </div>

    <div v-if="issue.comments?.length" class="comments-section">
      <h3>Kommentare</h3>
      <div class="comment-list">
        <div v-for="comment in issue.comments" :key="comment.id" class="comment-card">
          <div>
            <strong>{{ commentDisplayName(comment) }}</strong>
            <p>{{ comment.email }}</p>
          </div>
          <div class="comment-photos" v-if="comment.photos?.length">
            <img v-for="photo in comment.photos" :key="photo.id" :src="photo.url" alt="Comment photo" />
          </div>
        </div>
      </div>
    </div>

    <CommentForm :issueId="issue.id" @created="created" />
  </div>
</template>

<script setup>
import CommentForm from "./CommentForm.vue";

const props = defineProps({
  issue: Object,
  loadIssue: Function,
});
const emits = defineEmits(["commentCreated", "close"]);

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
