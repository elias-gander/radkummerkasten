import { query } from "./db.js";
import { randomUUID } from "crypto";
import { sendMagicLink } from "./lib/mail.js";
import { verifyTurnstile } from "./lib/turnstile.js";
import { ISSUE_TYPES } from "./constants.js";
import { upload } from "./lib/upload.js";
import { toBuffer } from "./lib/file.js";

export default async function issueRoutes(app) {
  app.get("/issues", async () => {
    const result = await query(
      "SELECT id, issue_type_id, latitude, longitude FROM issues",
    );
    return result.rows;
  });

  app.get("/issues/:id", async (request) => {
    const { id } = request.params;
    const issueResult = await query(
      "SELECT id, issue_type_id, description, name, email, upvotes, photo_count, latitude, longitude, created_at FROM issues WHERE id = $1",
      [id],
    );
    if (!issueResult.rowCount) {
      return app.httpErrors.notFound("Issue not found");
    }
    const commentsResult = await query(
      "SELECT id, name, text, photo_count, created_at FROM comments WHERE issue_id = $1 ORDER BY created_at ASC",
      [id],
    );
    return {
      ...issueResult.rows[0],
      comments: commentsResult.rows.map((comment) => ({ ...comment })),
    };
  });

  app.post("/issues", async (request, reply) => {
    const parts = request.parts();
    const body = {};
    const files = [];
    for await (const part of parts) {
      if (part.type === "file") {
        files.push({
          mimetype: part.mimetype,
          buffer: await toBuffer(part),
        });
      } else {
        body[part.fieldname] = part.value;
      }
    }

    const requiredFields = [
      "issue_type_id",
      "description",
      "name",
      "latitude",
      "longitude",
      "turnstile_token",
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return app.httpErrors.badRequest(`${field} is required`);
      }
    }
    if (!ISSUE_TYPES.find((item) => item.id === body.issue_type_id)) {
      return app.httpErrors.badRequest("Invalid issue type id");
    }

    try {
      await verifyTurnstile(body.turnstile_token);
    } catch (error) {
      return app.httpErrors.badRequest("Captcha verification failed");
    }

    const result = await query(
      "INSERT INTO issues (issue_type_id, description, name, latitude, longitude, photo_count) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [
        body.issue_type_id,
        body.description,
        body.name,
        body.latitude,
        body.longitude,
        files.length,
      ],
    );

    const id = result.rows[0].id;
    for (const [i, value] of files.entries()) {
      await upload(`${id}-${i}`, files[i].mimetype, files[i].buffer);
    }

    if (body.email) {
      await subscribeToIssue(id, body.email, body.turnstile_token);
    }

    return id;
  });

  app.post("/issues/:issueId/comments", async (request, reply) => {
    const { issueId } = request.params;
    const parts = request.parts();
    const body = {};
    const files = [];
    for await (const part of parts) {
      if (part.type === "file") {
        files.push({
          name: part.filename,
          mimetype: part.mimetype,
          buffer: await toBuffer(part),
        });
      } else {
        body[part.fieldname] = part.value;
      }
    }

    const requiredFields = ["name", "text", "turnstile_token"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return app.httpErrors.badRequest(`${field} is required`);
      }
    }

    const issueResult = await query("SELECT id FROM issues WHERE id = $1", [
      issueId,
    ]);
    if (!issueResult.rowCount) {
      return app.httpErrors.notFound("Issue not found");
    }

    try {
      await verifyTurnstile(body.turnstile_token);
    } catch (error) {
      return app.httpErrors.badRequest("Captcha verification failed");
    }

    const result = await query(
      "INSERT INTO comments (issue_id, name, text, photo_count) VALUES ($1, $2, $3, $4) RETURNING id",
      [Number(issueId), body.name, body.text, files.length],
    );
    const commentId = result.rows[0].id;
    for (const [i, value] of files.entries()) {
      await upload(
        `${issueId}-${commentId}-${i}`,
        files[i].mimetype,
        files[i].buffer,
      );
    }

    reply.code(204).send();
  });

  app.post("/issues/:id/vote", async (request, reply) => {
    const { id } = request.params;
    await query("UPDATE issues SET upvotes = upvotes + 1 WHERE id = $1", [id]);
    reply.code(204).send();
  });

  app.post("/issues/:id/subscribe", async (request, reply) => {
    const { id } = request.params;
    const body = request.body;
    const fields = ["email", "turnstile_token"];
    for (const field of fields) {
      if (!body[field]) {
        return app.httpErrors.badRequest(`${field} is required`);
      }
    }
    await subscribeToIssue(id, body.email, body.turnstile_token);
    reply.code(204).send();
  });

  app.post("/issues/confirm-subscription", async (request, reply) => {
    const { token } = request.body;

    if (!token) {
      return app.httpErrors.badRequest("token is required");
    }

    const pendingSubscription = await query(
      "SELECT id, type, payload FROM subscriptions WHERE token = $1",
      [token],
    );

    if (!pendingSubscription.rowCount) {
      return app.httpErrors.notFound("Verification token not found");
    }

    await query("UPDATE subscriptions SET token = NULL WHERE id = $1", [
      pendingSubscription.rows[0].id,
    ]);
    reply.code(204).send();
  });

  async function subscribeToIssue(issueId, email, turnstileToken) {
    const issueResult = await query("SELECT id FROM issues WHERE id = $1", [
      issueId,
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
      "INSERT INTO subscriptions (token, issue_id, email) VALUES ($1, $2, $3)",
      [token, Number(issueId), body.email],
    );
    await sendMagicLink(body.email, token);
  }
}
