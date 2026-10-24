// ─────────────────────────────────────────────────────────────────────────
// Which provider competitions feed which league in the app.
// The app's league ids must match the docs in leagues/ (see scripts/seed.js).
// ─────────────────────────────────────────────────────────────────────────

/** football-data.org competition code -> app league id. All 6 are in the free tier. */
exports.FOOTBALL_DATA_COMPETITIONS = {
  PL: "premier",
  PD: "laliga",
  SA: "seriea",
  BL1: "bundesliga",
  FL1: "ligue1",
  CL: "ucl",
};

/**
 * API-Football leagues (used for competitions football-data.org doesn't cover,
 * e.g. Botola Pro). Find the right id with:
 *   curl -H "x-apisports-key: KEY" "https://v3.football.api-sports.io/leagues?country=Morocco"
 * `season` is the year the season starts (2026 for 2026/27).
 */
exports.API_FOOTBALL_LEAGUES = [
  { apiId: 200, season: 2026, leagueId: "botola", name: "Botola Pro" }, // ← verify the id
];

/** Display names used in the app (matches leagues/ docs). */
exports.LEAGUE_NAMES = {
  botola: "Botola Pro",
  premier: "Premier League",
  laliga: "LaLiga",
  seriea: "Serie A",
  bundesliga: "Bundesliga",
  ligue1: "Ligue 1",
  ucl: "Champions League",
};

/**
 * Broadcasters. No free API provides TV rights, so they're configured here
 * per competition. Replace with the real rights holders in your region.
 */
exports.CHANNELS = {
  botola: [{ name: "Arryadia", free: true }, { name: "Al Aoula", free: true }],
  premier: [{ name: "beIN SPORTS 1" }],
  laliga: [{ name: "beIN SPORTS 2" }],
  seriea: [{ name: "beIN SPORTS 1" }],
  bundesliga: [{ name: "beIN SPORTS 2" }],
  ligue1: [{ name: "beIN SPORTS 1" }],
  ucl: [{ name: "beIN SPORTS 1" }],
};

/**
 * RSS feeds for the news tab. The app stores only the headline, a short
 * summary, the image and a link — the full article opens on the publisher's
 * site. Check each publisher's terms before going to production.
 */
exports.NEWS_FEEDS = [
  { url: "https://feeds.bbci.co.uk/sport/football/rss.xml", source: "BBC Sport", leagueName: "" },
  { url: "https://www.theguardian.com/football/rss", source: "The Guardian", leagueName: "" },
];

/** Small shared helpers. */
exports.isoDay = (offsetDays) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};
