import { query } from "./db.js";
import { randomUUID } from "crypto";
import { sendMagicLink } from "./lib/mail.js";
import { verifyTurnstile } from "./lib/turnstile.js";
import { ISSUE_TYPES } from "./constants.js";

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
      "SELECT id, issue_type_id, description, name, email, upvotes, latitude, longitude, created_at FROM issues WHERE id = $1",
      [id],
    );
    if (!issueResult.rowCount) {
      return app.httpErrors.notFound("Issue not found");
    }
    const commentsResult = await query(
      "SELECT id, name, text, photo_urls, created_at FROM comments WHERE issue_id = $1 ORDER BY created_at ASC",
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
        files.push(part);
      } else {
        body[part.fieldname] = part.value;
      }
    }

    const fields = [
      "issue_type_id",
      "description",
      "name",
      "latitude",
      "longitude",
      "turnstile_token",
    ];
    for (const field of fields) {
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

    let urls = [];
    if (files) {
      for (const file of files) {
        const url = await upload(file);
        urls.push(url);
      }
    }

    await query(
      "INSERT INTO issues (issue_type_id, description, name, latitude, longitude, photo_urls) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        body.issue_type_id,
        body.description,
        body.name,
        body.latitude,
        body.longitude,
        urls,
      ],
    );

    if (body.email) {
      await subscribeToIssue(id, body.email, body.turnstile_token);
    }

    reply.code(204).send();
  });

  app.post("/issues/:id/comments", async (request) => {
    const { id } = request.params;
    const parts = request.parts();
    const body = {};
    const files = [];
    for await (const part of parts) {
      if (part.type === "file") {
        files.push(part);
      } else {
        body[part.fieldname] = part.value;
      }
    }

    const fields = ["name", "text", "turnstile_token"];
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

    let urls = [];
    if (files) {
      for (const file of files) {
        const url = await upload(file);
        urls.push(url);
      }
    }

    await query(
      "INSERT INTO comments (issue_id, name, text, photo_urls) VALUES ($1, $2, $3, $4)",
      [Number(id), body.name, body.text, urls],
    );
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
