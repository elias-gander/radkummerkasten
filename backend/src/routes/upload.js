import fetch from "node-fetch";

export default async function uploadRoutes(app) {
  app.post("/upload", async (request) => {
    const { url } = request.body;
    if (!url) {
      return app.httpErrors.badRequest("url is required");
    }
    if (
      !process.env.CLOUDFLARE_ACCOUNT_ID ||
      !process.env.CLOUDFLARE_API_TOKEN ||
      !process.env.CLOUDFLARE_IMAGES_NAMESPACE
    ) {
      return app.httpErrors.internalServerError(
        "Cloudflare upload is not configured",
      );
    }
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        },
        body: JSON.stringify({
          url,
          metadata: { source: "radkummerkasten" },
        }),
      },
    );
    const data = await response.json();
    if (!data.success) {
      return app.httpErrors.internalServerError("Upload failed");
    }
    return {
      url:
        data.result.variants[0] ||
        data.result.uploadURL ||
        data.result.original_filename ||
        data.result.id,
    };
  });
}
