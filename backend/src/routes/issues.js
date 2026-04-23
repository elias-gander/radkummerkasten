import { query } from "../db.js";
import { randomUUID } from "crypto";
import { sendMagicLink } from "../lib/mailer.js";

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

export default async function issueRoutes(app) {
  app.get("/issues", async () => {
    const result = await query(
      "SELECT id, issue_type, beschreibung, upvotes, latitude, longitude FROM issues ORDER BY created_at DESC LIMIT 50000",
    );
    return result.rows;
  });

  app.get("/issues/:id", async (request) => {
    const { id } = request.params;
    const result = await query(
      "SELECT id, issue_type, beschreibung, vorname, nachname, email, upvotes, latitude, longitude, created_at FROM issues WHERE id = $1",
      [id],
    );
    if (!result.rowCount) {
      return app.httpErrors.notFound("Issue not found");
    }
    const comments = await query(
      "SELECT id, vorname, nachname, email, created_at FROM comments WHERE issue_id = $1 ORDER BY created_at ASC",
      [id],
    );
    const photoRows = await query(
      "SELECT id, url, issue_id, comment_id FROM photos WHERE issue_id = $1",
      [id],
    );
    const issuePhotos = photoRows.rows.filter(
      (photo) => photo.comment_id === null,
    );
    const commentPhotos = photoRows.rows.filter(
      (photo) => photo.comment_id !== null,
    );
    return {
      ...result.rows[0],
      comments: comments.rows.map((comment) => ({
        ...comment,
        photos: commentPhotos.filter(
          (photo) => photo.comment_id === comment.id,
        ),
      })),
      photos: issuePhotos,
    };
  });

  app.post("/issues", async (request) => {
    const body = request.body;
    const fields = [
      "issue_type",
      "beschreibung",
      "vorname",
      "nachname",
      "email",
      "latitude",
      "longitude",
    ];
    for (const field of fields) {
      if (!body[field]) {
        return app.httpErrors.badRequest(`${field} is required`);
      }
    }
    if (!issueTypes.includes(body.issue_type)) {
      return app.httpErrors.badRequest("Invalid issue type");
    }
    const token = randomUUID();
    await query(
      "INSERT INTO pending_submissions (token, type, payload) VALUES ($1, $2, $3)",
      [token, "issue", body],
    );
    await sendMagicLink(body.email, token);
    return { status: "pending", token };
  });
}
