export function sendMagicLink(email, token, issueId) {
  const link = `${process.env.FRONTEND_URL}/issues/${issueId}/confirm-subscription?token=${encodeURIComponent(token)}`;
  console.log(`Verification link for ${email}: ${link}`);
  return Promise.resolve({ email, link });
}
