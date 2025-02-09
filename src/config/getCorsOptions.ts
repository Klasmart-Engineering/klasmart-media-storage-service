export default function getCorsOptions(domain: string) {
  const domainRegex = new RegExp(
    `^http(s)?://(.*\\.)?${escapeRegex(domain)}(:\\d{1,5})?$`,
  )

  const corsOptions = {
    allowedHeaders: ['Authorization', 'Content-Type', 'live-authorization'],
    credentials: true,
    origin: domainRegex,
  }
  return corsOptions
}

function escapeRegex(s: string) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
}
