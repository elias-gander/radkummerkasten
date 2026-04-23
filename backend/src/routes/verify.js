import { query } from "../db.js";

export default async function verifyRoutes(app) {
  app.post("/verify", async (request) => {
    const { token } = request.body;
    if (!token) {
      return app.httpErrors.badRequest("token is required");
    }
    const pending = await query(
      "SELECT id, type, payload FROM pending_submissions WHERE token = $1",
      [token],
    );
    if (!pending.rowCount) {
      return app.httpErrors.notFound("Verification token not found");
    }
    const submission = pending.rows[0];
    await query("DELETE FROM pending_submissions WHERE id = $1", [
      submission.id,
    ]);
    if (submission.type === "issue") {
      const body = submission.payload;
      const result = await query(
        "INSERT INTO issues (issue_type, beschreibung, vorname, nachname, email, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
        [
          body.issue_type,
          body.beschreibung,
          body.vorname,
          body.nachname,
          body.email,
          body.latitude,
          body.longitude,
        ],
      );
      if (body.photos && Array.isArray(body.photos)) {
        for (const url of body.photos) {
          await query("INSERT INTO photos (issue_id, url) VALUES ($1, $2)", [
            result.rows[0].id,
            url,
          ]);
        }
      }
      return { status: "created", issue_id: result.rows[0].id };
    }
    if (submission.type === "comment") {
      const body = submission.payload;
      const result = await query(
        "INSERT INTO comments (issue_id, vorname, nachname, email) VALUES ($1, $2, $3, $4) RETURNING id",
        [body.issue_id, body.vorname, body.nachname, body.email],
      );
      if (body.photos && Array.isArray(body.photos)) {
        for (const url of body.photos) {
          await query("INSERT INTO photos (comment_id, url) VALUES ($1, $2)", [
            result.rows[0].id,
            url,
          ]);
        }
      }
      return { status: "created", comment_id: result.rows[0].id };
    }
    return app.httpErrors.badRequest("Unknown submission type");
  });
}
