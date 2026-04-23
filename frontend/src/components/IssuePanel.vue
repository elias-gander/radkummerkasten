<template>
  <div class="panel-card">
    <div class="panel-header">
      <div>
        <h2>{{ issue.issue_type }}</h2>
        <p>{{ issue.beschreibung }}</p>
      </div>
      <span class="badge">Votes {{ issue.upvotes }}</span>
    </div>
    <div class="panel-meta">
      <p>{{ issue.vorname }} {{ issue.nachname }}</p>
      <p>{{ issue.email }}</p>
      <p>Standort: {{ issue.latitude }}, {{ issue.longitude }}</p>
    </div>

    <div v-if="issue.photos?.length" class="photo-grid">
      <img
        v-for="photo in issue.photos"
        :key="photo.id"
        :src="photo.url"
        alt="Issue photo"
      />
    </div>

    <div class="comments-section">
      <h3>Kommentare</h3>
      <div v-if="issue.comments?.length" class="comment-list">
        <div
          v-for="comment in issue.comments"
          :key="comment.id"
          class="comment-card"
        >
          <div>
            <strong>{{ comment.vorname }} {{ comment.nachname }}</strong>
            <p>{{ comment.email }}</p>
          </div>
          <div class="comment-photos" v-if="comment.photos?.length">
            <img
              v-for="photo in comment.photos"
              :key="photo.id"
              :src="photo.url"
              alt="Comment photo"
            />
          </div>
        </div>
      </div>
      <p v-else>Keine Kommentare vorhanden.</p>
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
const emits = defineEmits(["commentCreated"]);

function created() {
  emits("commentCreated");
}
</script>
