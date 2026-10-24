// football-data.org v4 → Firestore (matches/, standings/, teams/)
// Free tier: 12 competitions, 10 calls/minute, scores slightly delayed.
// Live scores need their paid "livescores" add-on — the code is the same.

const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { FOOTBALL_DATA_COMPETITIONS, LEAGUE_NAMES, CHANNELS, isoDay } = require("./config");

const BASE = "https://api.football-data.org/v4";

async function fd(path, key) {
  const res = await fetch(BASE + path, { headers: { "X-Auth-Token": key } });
  if (res.status === 429) throw new Error("football-data.org: rate limit reached (10 calls/min on free tier)");
  if (!res.ok) throw new Error(`football-data.org ${res.status}: ${await res.text()}`);
  return res.json();
}

// football-data.org status → app status
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

// Prefix ids so provider ids never clash with each other or with demo data.
const team = (t = {}) => ({
  id: `fd_${t.id}`,
  name: t.shortName || t.name || "TBD",
  logoUrl: t.crest || "",
});

/** Yesterday → tomorrow for all configured competitions, in ONE API call. */
async function syncMatches(key) {
  const codes = Object.keys(FOOTBALL_DATA_COMPETITIONS).join(",");
  const data = await fd(`/matches?competitions=${codes}&dateFrom=${isoDay(-1)}&dateTo=${isoDay(1)}`, key);

  const db = getFirestore();
  const writer = db.bulkWriter();
  let count = 0;

  for (const m of data.matches || []) {
    const leagueId = FOOTBALL_DATA_COMPETITIONS[m.competition?.code];
    if (!leagueId) continue;
    const home = team(m.homeTeam);
    const away = team(m.awayTeam);
    const ft = m.score?.fullTime || {};

    writer.set(db.collection("matches").doc(`fd_${m.id}`), {
      leagueId,
      leagueName: LEAGUE_NAMES[leagueId] || m.competition.name,
      homeTeam: home,
      awayTeam: away,
      homeScore: ft.home ?? 0,
      awayScore: ft.away ?? 0,
      status: STATUS[m.status] || "scheduled",
      minute: m.minute ?? 0, // filled on live-score plans
      kickoff: Timestamp.fromDate(new Date(m.utcDate)),
      venue: m.venue || "",
      channels: CHANNELS[leagueId] || [],
      provider: "football-data.org",
    }, { merge: true }); // merge: keeps events/stats you add from elsewhere

    for (const t of [home, away]) {
      writer.set(db.collection("teams").doc(t.id), { name: t.name, logoUrl: t.logoUrl }, { merge: true });
    }
    count++;
  }

  await writer.close();
  return count;
}

/** One call per competition (6 calls). */
async function syncStandings(key) {
  const db = getFirestore();
  let count = 0;

  for (const [code, leagueId] of Object.entries(FOOTBALL_DATA_COMPETITIONS)) {
    const data = await fd(`/competitions/${code}/standings`, key);
    const total = (data.standings || []).find((s) => s.type === "TOTAL");
    if (!total) continue;

    const table = total.table.map((r) => ({
      position: r.position,
      team: team(r.team),
      played: r.playedGames,
      won: r.won,
      drawn: r.draw,
      lost: r.lost,
      goalsFor: r.goalsFor,
      goalsAgainst: r.goalsAgainst,
      points: r.points,
      form: (r.form || "").replace(/,/g, ""), // "W,D,L" -> "WDL"
    }));

    const s = data.season || {};
    const season = s.startDate && s.endDate
      ? `${s.startDate.slice(0, 4)}/${s.endDate.slice(2, 4)}`
      : "";

    await db.collection("standings").doc(leagueId).set({
      season,
      table,
      updatedAt: Timestamp.now(),
      provider: "football-data.org",
    });
    count++;
  }
  return count;
}

module.exports = { syncMatches, syncStandings };
