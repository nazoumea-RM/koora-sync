// RSS feeds → Firestore news/. Free, near real-time, no API key.
// Stores headline + short summary + image + link only; the app opens the
// full article on the publisher's site.

const crypto = require("crypto");
const Parser = require("rss-parser");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");
const { NEWS_FEEDS } = require("./config");

const parser = new Parser({
  timeout: 10000,
  customFields: { item: [["media:thumbnail", "thumbnail"], ["media:content", "mediaContent"]] },
});

const imageOf = (item) =>
  item.enclosure?.url || item.thumbnail?.$?.url || item.mediaContent?.$?.url || "";

const clean = (s = "") => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

async function syncNews(perFeed = 15) {
  const db = getFirestore();
  const writer = db.bulkWriter();
  let count = 0;

  for (const feed of NEWS_FEEDS) {
    try {
      const f = await parser.parseURL(feed.url);
      for (const item of (f.items || []).slice(0, perFeed)) {
        if (!item.link || !item.title) continue;
        // Stable id from the link, so re-running never duplicates articles.
        const id = crypto.createHash("sha1").update(item.link).digest("hex").slice(0, 20);
        writer.set(db.collection("news").doc(id), {
          title: clean(item.title),
          summary: clean(item.contentSnippet || item.content || "").slice(0, 280),
          body: "",
          imageUrl: imageOf(item),
          leagueName: feed.leagueName || "",
          source: feed.source,
          url: item.link,
          publishedAt: Timestamp.fromDate(item.isoDate ? new Date(item.isoDate) : new Date()),
        }, { merge: true });
        count++;
      }
    } catch (e) {
      logger.warn(`News feed failed (${feed.url}): ${e.message}`);
    }
  }

  await writer.close();
  return count;
}

module.exports = { syncNews };
