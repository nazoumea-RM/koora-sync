// API-Football (api-sports.io) v3 → Firestore, for leagues football-data.org
// doesn't cover (e.g. Botola Pro).
// Free plan: 100 requests/day and a limited set of seasons — check in your
// dashboard that the season you configure is available on your plan.

const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { API_FOOTBALL_LEAGUES, CHANNELS, isoDay } = require("./config");

const { withAr, leagueAr } = require("./arabic");

const BASE = "https://v3.football.api-sports.io";

async function af(path, key) {
  const res = await fetch(BASE + path, { headers: { "x-apisports-key": key } });
  if (!res.ok) throw new Error(`API-Football ${res.status}: ${await res.text()}`);
  const json = await res.json();
  // API-Football returns 200 with an `errors` object for quota/plan problems.
  const errors = json.errors && (Array.isArray(json.errors) ? json.errors : Object.values(json.errors));
  if (errors && errors.length) throw new Error(`API-Football: ${JSON.stringify(json.errors)}`);
  return json;
}

// fixture.status.short → app status
function status(short) {
  if (["NS", "TBD"].includes(short)) return "scheduled";
  if (short === "HT") return "halftime";
  if (["1H", "2H", "ET", "BT", "P", "LIVE", "INT"].includes(short)) return "live";
  if (["FT", "AET", "PEN", "AWD", "WO"].includes(short)) return "finished";
  return "postponed"; // PST, CANC, ABD, SUSP
}

const team = (t = {}) => withAr({ id: `af_${t.id}`, name: t.name || "TBD", logoUrl: t.logo || "" });

/** Today's fixtures: 1 request per league. */
async function syncFixtures(key) {
  const db = getFirestore();
  const writer = db.bulkWriter();
  let count = 0;

  for (const l of API_FOOTBALL_LEAGUES) {
    const { response = [] } = await af(`/fixtures?league=${l.apiId}&season=${l.season}&date=${isoDay(0)}`, key);
    for (const f of response) {
      const home = team(f.teams.home);
      const away = team(f.teams.away);
      writer.set(db.collection("matches").doc(`af_${f.fixture.id}`), {
        leagueId: l.leagueId,
        leagueName: l.name,
        leagueNameAr: leagueAr(l.leagueId, l.name),
        homeTeam: home,
        awayTeam: away,
        homeScore: f.goals.home ?? 0,
        awayScore: f.goals.away ?? 0,
        status: status(f.fixture.status.short),
        minute: f.fixture.status.elapsed ?? 0,
        kickoff: Timestamp.fromDate(new Date(f.fixture.date)),
        venue: f.fixture.venue?.name || "",
        channels: CHANNELS[l.leagueId] || [],
        provider: "api-football",
      }, { merge: true });
      for (const t of [home, away]) {
        writer.set(db.collection("teams").doc(t.id), { name: t.name, nameAr: t.nameAr, logoUrl: t.logoUrl }, { merge: true });
      }
      count++;
    }
  }

  await writer.close();
  return count;
}

/** League table: 1 request per league. */
async function syncStandings(key) {
  const db = getFirestore();
  for (const l of API_FOOTBALL_LEAGUES) {
    const { response = [] } = await af(`/standings?league=${l.apiId}&season=${l.season}`, key);
    const rows = response[0]?.league?.standings?.[0] || [];
    if (!rows.length) continue;

    await db.collection("standings").doc(l.leagueId).set({
      season: `${l.season}/${String(l.season + 1).slice(2)}`,
      table: rows.map((r) => ({
        position: r.rank,
        team: team(r.team),
        played: r.all.played,
        won: r.all.win,
        drawn: r.all.draw,
        lost: r.all.lose,
        goalsFor: r.all.goals.for,
        goalsAgainst: r.all.goals.against,
        points: r.points,
        form: r.form || "",
      })),
      updatedAt: Timestamp.now(),
      provider: "api-football",
    });
  }
}

module.exports = { syncFixtures, syncStandings };
