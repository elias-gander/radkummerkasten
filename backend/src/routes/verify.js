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
        "INSERT INTO issues (issue_type_id, beschreibung, name, email, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [
          body.issue_type_id,
          body.beschreibung,
          body.name,
          body.email || null,
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
      if (body.email) {
        await query(
          "INSERT INTO subscriptions (issue_id, email) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [result.rows[0].id, body.email],
        );
      }
      return { status: "created", issue_id: result.rows[0].id };
    }
    if (submission.type === "comment") {
      const body = submission.payload;
      const result = await query(
        "INSERT INTO comments (issue_id, name) VALUES ($1, $2) RETURNING id",
        [body.issue_id, body.name],
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
    if (submission.type === "subscription") {
      const body = submission.payload;
      await query(
        "INSERT INTO subscriptions (issue_id, email) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [body.issue_id, body.email],
      );
      return { status: "subscribed" };
    }
    return app.httpErrors.badRequest("Unknown submission type");
  });
}
