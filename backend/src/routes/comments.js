import { query } from "../db.js";
import { randomUUID } from "crypto";
import { verifyTurnstile } from "../lib/turnstile.js";
import { sendMagicLink } from "../lib/mailer.js";

export default async function commentRoutes(app) {
  app.get("/issues/:id/comments", async (request) => {
    const { id } = request.params;
    const result = await query(
      "SELECT id, name, created_at FROM comments WHERE issue_id = $1 ORDER BY created_at ASC",
      [id],
    );
    return result.rows;
  });

  app.post("/issues/:id/comments", async (request) => {
    const { id } = request.params;
    const body = request.body;
    const fields = ["name", "turnstile_token"];
    for (const field of fields) {
      if (!body[field]) {
        return app.httpErrors.badRequest(`${field} is required`);
      }
    }
    const issueResult = await query("SELECT id FROM issues WHERE id = $1", [
      id,
    ]);
    if (!issueResult.rowCount) {
      return app.httpErrors.notFound("Issue not found");
    }

    try {
      await verifyTurnstile(body.turnstile_token);
    } catch (error) {
      return app.httpErrors.badRequest("Captcha verification failed");
    }

    const token = randomUUID();
    await query(
      "INSERT INTO pending_submissions (token, type, payload) VALUES ($1, $2, $3)",
      [token, "comment", { issue_id: Number(id), ...body }],
    );
    return { status: "pending", token };
  });
}
