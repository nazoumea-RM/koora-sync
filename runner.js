// Koora Live — data sync runner for GitHub Actions (Firebase Spark plan).
// Replaces the scheduled Cloud Functions: loops for RUN_MINUTES, polls
// football-data.org every 2 minutes and writes ONLY the matches that changed,
// so the project stays inside Spark's free quota (20k writes / 50k reads per day).
// Also sends the kick-off / goal / full-time push notifications (FCM is free).

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });

const { FOOTBALL_DATA_COMPETITIONS, LEAGUE_NAMES, CHANNELS, isoDay } = require("./sync/config");
const footballData = require("./sync/footballData");
const { syncNews } = require("./sync/news");
const { Timestamp } = require("firebase-admin/firestore");

const FD_KEY = process.env.FOOTBALL_DATA_KEY;
const AF_KEY = process.env.API_FOOTBALL_KEY && process.env.API_FOOTBALL_KEY !== "none"
  ? process.env.API_FOOTBALL_KEY
  : null;
const RUN_MINUTES = Number(process.env.RUN_MINUTES || 195);

const MATCH_EVERY = 2 * 60 * 1000;   // football-data.org: 1 call
const NEWS_EVERY = 30 * 60 * 1000;   // RSS, free
const BOTOLA_EVERY = 60 * 60 * 1000; // API-Football: ~24 calls/day, inside 100/day

const STATUS = {
  SCHEDULED: "scheduled",
  TIMED: "scheduled",
  IN_PLAY: "live",
  PAUSED: "halftime",
  FINISHED: "finished",
  AWARDED: "finished",
  POSTPONED: "postponed",
  SUSPENDED: "postponed",
  CANCELLED: "postponed",
};

const team = (t = {}) => ({
  id: `fd_${t.id}`,
  name: t.shortName || t.name || "TBD",
  logoUrl: t.crest || "",
});

const db = getFirestore();
const cache = new Map(); // matchId -> last state written to Firestore (null = not in Firestore yet)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const stateOf = (d) => ({
  homeScore: d.homeScore ?? 0,
  awayScore: d.awayScore ?? 0,
  status: d.status || "scheduled",
  minute: d.minute ?? 0,
  kickoff: d.kickoff && d.kickoff.toMillis ? d.kickoff.toMillis() : 0,
});

const same = (a, b) => !!a && Object.keys(b).every((k) => a[k] === b[k]);

async function syncMatches() {
  const codes = Object.keys(FOOTBALL_DATA_COMPETITIONS).join(",");
  const url = `https://api.football-data.org/v4/matches?competitions=${codes}&dateFrom=${isoDay(-1)}&dateTo=${isoDay(1)}`;
  const res = await fetch(url, { headers: { "X-Auth-Token": FD_KEY } });
  if (!res.ok) throw new Error(`football-data.org ${res.status}: ${await res.text()}`);
  const data = await res.json();

  const batch = db.batch();
  const changed = [];

  for (const m of data.matches || []) {
    const leagueId = FOOTBALL_DATA_COMPETITIONS[m.competition && m.competition.code];
    if (!leagueId) continue;

    const id = `fd_${m.id}`;
    const ref = db.collection("matches").doc(id);
    const home = team(m.homeTeam);
    const away = team(m.awayTeam);
    const ft = (m.score && m.score.fullTime) || {};

    const doc = {
      leagueId,
      leagueName: LEAGUE_NAMES[leagueId] || m.competition.name,
      homeTeam: home,
      awayTeam: away,
      homeScore: ft.home ?? 0,
      awayScore: ft.away ?? 0,
      status: STATUS[m.status] || "scheduled",
      minute: m.minute ?? 0,
      kickoff: Timestamp.fromDate(new Date(m.utcDate)),
      venue: m.venue || "",
      channels: CHANNELS[leagueId] || [],
      provider: "football-data.org",
      updatedAt: Timestamp.now(),
    };
    const next = stateOf(doc);

    // First time this run sees the match: read it once to know what Firestore already has.
    let isNew = false;
    if (!cache.has(id)) {
      const snap = await ref.get();
      isNew = !snap.exists;
      cache.set(id, snap.exists ? stateOf(snap.data()) : null);
    }

    const prev = cache.get(id);
    if (same(prev, next)) continue; // nothing changed → no write

    batch.set(ref, doc, { merge: true });
    if (isNew) {
      for (const t of [home, away]) {
        batch.set(db.collection("teams").doc(t.id), { name: t.name, logoUrl: t.logoUrl }, { merge: true });
      }
    }
    cache.set(id, next);
    changed.push({ id, prev, doc });
  }

  if (changed.length) await batch.commit();

  for (const c of changed) {
    if (c.prev) await notify(c.id, c.prev, c.doc).catch((e) => console.error("notify:", e.message));
  }

  console.log(`${new Date().toISOString()} matches: ${(data.matches || []).length} fetched, ${changed.length} written`);
}

// Same rules as notifyMatchUpdates in functions/index.js
async function notify(matchId, before, after) {
  const home = after.homeTeam || {};
  const away = after.awayTeam || {};
  if (!home.id || !away.id) return;

  const hs = after.homeScore ?? 0;
  const as = after.awayScore ?? 0;
  const score = `${home.name} ${hs} - ${as} ${away.name}`;
  const minute = after.minute ? ` (${after.minute}')` : "";
  const notes = [];

  if (before.status === "scheduled" && after.status === "live") {
    notes.push({ title: "Kick-off!", body: `${home.name} vs ${away.name} has started` });
  }
  if (hs > (before.homeScore ?? 0)) notes.push({ title: `⚽ GOAL! ${home.name}${minute}`, body: score });
  if (as > (before.awayScore ?? 0)) notes.push({ title: `⚽ GOAL! ${away.name}${minute}`, body: score });
  if (before.status !== "finished" && after.status === "finished") {
    notes.push({ title: "Full time", body: score });
  }
  if (notes.length === 0) return;

  const condition = `'team_${home.id}' in topics || 'team_${away.id}' in topics`;
  for (const notification of notes) {
    await getMessaging().send({
      condition,
      notification,
      data: { matchId },
      android: { priority: "high" },
      apns: { payload: { aps: { sound: "default" } } },
    });
  }
}

async function safe(name, fn) {
  try {
    await fn();
  } catch (e) {
    console.error(`${name}:`, e.message);
  }
}

(async () => {
  if (!FD_KEY) throw new Error("FOOTBALL_DATA_KEY secret is missing");
  const end = Date.now() + RUN_MINUTES * 60 * 1000;

  // Once per run (~every 3 hours): league tables.
  await safe("standings", async () => {
    const n = await footballData.syncStandings(FD_KEY);
    console.log(`standings: ${n} tables`);
  });
  if (AF_KEY) {
    await safe("botola standings", async () => {
      await require("./sync/apiFootball").syncStandings(AF_KEY);
      console.log("botola standings synced");
    });
  }

  let lastNews = 0;
  let lastBotola = 0;

  while (Date.now() < end) {
    const t0 = Date.now();

    await safe("matches", syncMatches);

    if (t0 - lastNews >= NEWS_EVERY) {
      lastNews = t0;
      await safe("news", async () => console.log(`news: ${await syncNews()} articles`));
    }

    if (AF_KEY && t0 - lastBotola >= BOTOLA_EVERY) {
      lastBotola = t0;
      await safe("botola", async () => {
        const n = await require("./sync/apiFootball").syncFixtures(AF_KEY);
        console.log(`botola: ${n} fixtures`);
      });
    }

    await sleep(Math.max(0, MATCH_EVERY - (Date.now() - t0)));
  }

  console.log("Run finished, the next scheduled run takes over.");
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
