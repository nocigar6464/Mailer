export async function verifyRecaptcha(token?: string, ip?: string) {
  if (process.env.DEV_BYPASS_CAPTCHA === "true") return true;
  if (!token) return false;

  const secret = process.env.RECAPTCHA_SECRET_KEY ?? "";
  const resp = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret,
      response: token,
      remoteip: ip ?? ""
    })
  });
  const data = await resp.json();
  return Boolean(data?.success);
}
