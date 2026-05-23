export async function toBuffer(filePart) {
  const chunks = [];
  for await (const chunk of filePart.file) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
