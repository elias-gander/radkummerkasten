export function sendMagicLink(email, token) {
  const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify?token=${encodeURIComponent(token)}`;
  console.log(`Verification link for ${email}: ${link}`);
  return Promise.resolve({ email, link });
}
