export async function upload(files) {
  const formData = new FormData();
  const buffer = await data.toBuffer();
  const file = new Blob([buffer], {
    type: data.mimetype,
  });
  formData.append("file", file, data.filename);
  formData.append("metadata", JSON.stringify({ source: "radkummerkasten" }));
  const response = await fetch(CLOUDFLARE_ENDPOINT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    },
    body: formData,
  });

  const result = await response.json();
  if (!result.success) {
    console.error(result);
    return app.httpErrors.internalServerError("Upload failed");
  }

  return result.result.variants?.[0];
}
