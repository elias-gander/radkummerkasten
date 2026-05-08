import fetch from "node-fetch";

export default async function uploadRoutes(app) {
  app.post("/upload", async (request) => {
    const { url, base64, filename, contentType } = request.body || {};
    if (!url && !base64) {
      return app.httpErrors.badRequest("url or base64 file data is required");
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

    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`;
    let response;

    if (url) {
      response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          metadata: { source: "radkummerkasten" },
        }),
      });
    } else {
      if (!filename) {
        return app.httpErrors.badRequest(
          "filename is required for file uploads",
        );
      }
      const buffer = Buffer.from(base64, "base64");
      const formData = new FormData();
      const file = contentType
        ? new Blob([buffer], { type: contentType })
        : buffer;
      formData.append("file", file, filename);
      formData.append(
        "metadata",
        JSON.stringify({ source: "radkummerkasten" }),
      );

      response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        },
        body: formData,
      });
    }

    const data = await response.json();
    if (!data.success) {
      return app.httpErrors.internalServerError("Upload failed");
    }
    return {
      url:
        data.result.variants?.[0] ||
        data.result.uploadURL ||
        data.result.original_filename ||
        data.result.id,
    };
  });
}
