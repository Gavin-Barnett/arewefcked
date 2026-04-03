const fallbackSiteUrl = "https://arewefcked.com";

function normalizeSiteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

export function getSiteUrl() {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    fallbackSiteUrl;
  return normalizeSiteUrl(configured);
}
