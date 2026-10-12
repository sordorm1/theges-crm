/**
 * GitHub Pages project-site base path (repo name). Build with
 * NEXT_PUBLIC_CUSTOM_DOMAIN=1 to serve from the root of a custom domain
 * instead (e.g. theglobalexam.uz). Must match next.config.ts.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_CUSTOM_DOMAIN ? "" : "/theges-crm";
