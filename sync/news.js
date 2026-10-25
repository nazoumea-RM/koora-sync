// RSS feeds → Firestore news/. Free, near real-time, no API key.
// Stores headline + short summary + image + link only; the app opens the
// full article on the publisher's site.

const crypto = require("crypto");
const Parser = require("rss-parser");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { NEWS_FEEDS } = require("./config");

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "Mozilla/5.0 (KooraLive news reader)" },
  customFields: { item: [["media:thumbnail", "thumbnail"], ["media:content", "mediaContent"]] },
});

// First <img src="..."> in the article HTML (WordPress feeds like Hespress).
const imgInHtml = (html = "") => {
  const m = /<img[^>]+src=["']([^"']+)["']/i.exec(html);
  return m ? m[1] : "";
};

const imageOf = (item) =>
  item.enclosure?.url ||
  item.thumbnail?.$?.url ||
  item.mediaContent?.$?.url ||
  imgInHtml(item["content:encoded"] || item.content || "");

const clean = (s = "") => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

async function syncNews(perFeed = 15) {
  const db = getFirestore();
  const writer = db.bulkWriter();
  let count = 0;

  for (const feed of NEWS_FEEDS) {
    let n = 0;
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
          lang: feed.lang || "en",
          url: item.link,
          publishedAt: Timestamp.fromDate(item.isoDate ? new Date(item.isoDate) : new Date()),
        }, { merge: true });
        n++;
      }
      console.log(`  news ${feed.source} (${feed.lang}): ${n}`);
    } catch (e) {
      console.warn(`  news feed failed (${feed.source} ${feed.url}): ${e.message}`);
    }
    count += n;
  }

  await writer.close();
  return count;
}

module.exports = { syncNews };
