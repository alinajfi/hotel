import axios from "axios";
import { createObjectCsvWriter } from "csv-writer";
import fs from "fs";

// -------------------- CONFIG --------------------
const API_KEY = "AIzaSyCvdQWypUSTHv7SIoOLBbJ9BRbcwqXiDEc"; // <-- ADD YOUR API KEY

const SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels";
const OUTPUT_FILE = "self_improvement_channels_under_1000.csv";
const PROGRESS_FILE = "scraper_progress.json";

const COUNTRIES = [
  "US",
  "GB",
  "AU",
  "CA",
  "NZ",
  "IE",
  "SE",
  "NO",
  "BE",
  "AT",
  "FI",
  "DK",
];
const KEYWORDS = ["business"]; // Change this daily
const MAX_PAGES_PER_KEYWORD = 30;
const MAX_RESULTS_PER_PAGE = 50;

// Quota tracking
let quotaUsed = 0;
const QUOTA_COSTS = {
  search: 100,
  channels: 1,
};

// Track channels we've already saved to avoid duplicates
const savedChannelIds = new Set();

// -------------------- CSV WRITER SETUP --------------------
const csvWriter = createObjectCsvWriter({
  path: OUTPUT_FILE,
  header: [
    { id: "name", title: "Channel Name" },
    { id: "subscribers", title: "Subscribers" },
    { id: "channelId", title: "Channel ID" },
    { id: "country", title: "Country" },
    { id: "keyword", title: "Keyword" },
    { id: "url", title: "Channel URL" },
    { id: "handleUrl", title: "Handle URL" },
  ],
  append: false, // Will be set to true after first write
});

// -------------------- PROGRESS TRACKING --------------------
function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = fs.readFileSync(PROGRESS_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.log("No previous progress found, starting fresh.");
  }
  return {};
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function getProgressKey(keyword, country) {
  return `${keyword}_${country}`;
}

// -------------------- LOAD EXISTING CHANNEL IDS --------------------
function loadExistingChannelIds() {
  try {
    if (fs.existsSync(OUTPUT_FILE)) {
      const content = fs.readFileSync(OUTPUT_FILE, "utf8");
      const lines = content.split("\n").slice(1); // Skip header

      for (const line of lines) {
        const match = line.match(/,"([^"]+)",/); // Extract channel ID
        if (match && match[1]) {
          savedChannelIds.add(match[1]);
        }
      }
      console.log(
        `📂 Loaded ${savedChannelIds.size} existing channel IDs from CSV`,
      );
    }
  } catch (err) {
    console.log("No existing CSV found, starting fresh.");
  }
}

// -------------------- APPEND TO CSV --------------------
async function appendToCSV(channels) {
  if (!channels.length) return;

  // Filter out already-saved channels
  const newChannels = channels.filter(
    (ch) => !savedChannelIds.has(ch.channelId),
  );

  if (!newChannels.length) {
    console.log(`   ⚠️  All channels already in CSV, skipping write`);
    return;
  }

  // Mark these as saved
  newChannels.forEach((ch) => savedChannelIds.add(ch.channelId));

  const writer = createObjectCsvWriter({
    path: OUTPUT_FILE,
    header: [
      { id: "name", title: "Channel Name" },
      { id: "subscribers", title: "Subscribers" },
      { id: "channelId", title: "Channel ID" },
      { id: "country", title: "Country" },
      { id: "keyword", title: "Keyword" },
      { id: "url", title: "Channel URL" },
      { id: "handleUrl", title: "Handle URL" },
    ],
    append: savedChannelIds.size > newChannels.length, // Append if file already has data
  });

  await writer.writeRecords(newChannels);
  console.log(`   💾 Saved ${newChannels.length} new channels to CSV`);
}

// -------------------- FUNCTIONS --------------------
async function searchChannelsByKeywordAndCountry(
  keyword,
  country,
  startPage = 0,
) {
  let nextPageToken = null;

  const progress = loadProgress();
  const progressKey = getProgressKey(keyword, country);

  // Load saved page token if resuming
  if (startPage > 0 && progress[progressKey]?.pageToken) {
    nextPageToken = progress[progressKey].pageToken;
    console.log(
      `📌 Resuming from page ${startPage} for "${keyword}" in ${country}`,
    );
  }

  for (let page = startPage; page < MAX_PAGES_PER_KEYWORD; page++) {
    console.log(
      `\n🔍 Page ${page + 1}/${MAX_PAGES_PER_KEYWORD} | Keyword: "${keyword}" | Country: ${country}`,
    );

    const searchParams = {
      part: "snippet",
      type: "channel",
      q: keyword,
      relevanceLanguage: "en",
      maxResults: MAX_RESULTS_PER_PAGE,
      pageToken: nextPageToken,
      regionCode: country,
      key: API_KEY,
    };

    try {
      const searchRes = await axios.get(SEARCH_URL, { params: searchParams });
      quotaUsed += QUOTA_COSTS.search;

      const items = searchRes.data.items || [];
      console.log(`   Found ${items.length} channels on this page`);

      const channelIds = items.map((item) => item.id.channelId);
      if (!channelIds.length) {
        console.log(`   ⚠️  No more channels found, stopping.`);
        break;
      }

      // Fetch channel statistics
      const statsRes = await axios.get(CHANNELS_URL, {
        params: {
          part: "snippet,statistics",
          id: channelIds.join(","),
          key: API_KEY,
        },
      });
      quotaUsed += QUOTA_COSTS.channels;

      const channelsToSave = [];
      let channelsUnder1000 = 0;

      for (const channel of statsRes.data.items) {
        const stats = channel.statistics;
        const snippet = channel.snippet;

        if (stats.hiddenSubscriberCount) continue;

        const subs = parseInt(stats.subscriberCount, 10);

        if (subs < 1000) {
          channelsUnder1000++;

          // Fix: Remove @ from customUrl if it exists
          let handleUrl;
          if (snippet.customUrl) {
            const cleanHandle = snippet.customUrl.startsWith("@")
              ? snippet.customUrl.slice(1)
              : snippet.customUrl;
            handleUrl = `https://www.youtube.com/@${cleanHandle}`;
          } else {
            handleUrl = `https://www.youtube.com/channel/${channel.id}`;
          }

          channelsToSave.push({
            name: snippet.title,
            subscribers: subs,
            channelId: channel.id,
            country: country,
            keyword: keyword,
            url: `https://www.youtube.com/channel/${channel.id}`,
            handleUrl: handleUrl,
          });
        }
      }

      // 💾 SAVE TO CSV IMMEDIATELY
      await appendToCSV(channelsToSave);

      console.log(`   ✅ Channels under 1000 subs: ${channelsUnder1000}`);
      console.log(`   📊 Quota used so far: ${quotaUsed} units`);

      nextPageToken = searchRes.data.nextPageToken;

      // Save progress after each page
      progress[progressKey] = {
        lastPage: page,
        pageToken: nextPageToken,
        timestamp: new Date().toISOString(),
      };
      saveProgress(progress);

      if (!nextPageToken) {
        console.log(`   ℹ️  No more pages available.`);
        break;
      }

      // Reduced delay for faster execution
      await new Promise((resolve) => setTimeout(resolve, 50));
    } catch (err) {
      console.error(
        `   ❌ Error on page ${page + 1}:`,
        err.response?.data || err.message,
      );

      // Save progress before stopping
      progress[progressKey] = {
        lastPage: page,
        pageToken: nextPageToken,
        timestamp: new Date().toISOString(),
        error: err.message,
      };
      saveProgress(progress);

      throw err;
    }
  }

  // Clear progress for this keyword-country combo when done
  if (progress[progressKey]) {
    delete progress[progressKey];
    saveProgress(progress);
  }
}

async function fetchAllChannels() {
  const progress = loadProgress();

  for (const country of COUNTRIES) {
    for (const keyword of KEYWORDS) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🚀 Starting search: "${keyword}" in ${country}`);
      console.log(`${"=".repeat(60)}`);

      const progressKey = getProgressKey(keyword, country);
      const startPage = progress[progressKey]?.lastPage
        ? progress[progressKey].lastPage + 1
        : 0;

      await searchChannelsByKeywordAndCountry(keyword, country, startPage);
    }
  }
}

function printQuotaSummary() {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📊 QUOTA SUMMARY`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Total quota used: ${quotaUsed} units`);
  console.log(`Remaining today (out of 10,000): ${10000 - quotaUsed} units`);
  console.log(`Percentage used: ${((quotaUsed / 10000) * 100).toFixed(2)}%`);
  console.log(`${"=".repeat(60)}\n`);
}

// -------------------- MAIN --------------------
(async () => {
  try {
    console.log(`\n🎬 YouTube Channel Scraper Started`);
    console.log(`⏰ ${new Date().toLocaleString()}\n`);

    // Load existing channel IDs to avoid duplicates
    loadExistingChannelIds();

    await fetchAllChannels();

    console.log(`\n${"=".repeat(60)}`);
    console.log(`🎉 SCRAPING COMPLETED`);
    console.log(`${"=".repeat(60)}`);
    console.log(`Total unique channels saved: ${savedChannelIds.size}`);
    console.log(`📁 Results saved to: ${OUTPUT_FILE}`);

    printQuotaSummary();

    console.log(`✅ All done!`);
  } catch (err) {
    console.error("\n❌ Fatal Error:", err.response?.data || err.message);
    printQuotaSummary();
    console.log(
      `\n💡 Don't worry! All fetched data has been saved to ${OUTPUT_FILE}`,
    );
    console.log(
      `💡 Progress saved. You can resume by running the script again.`,
    );
  }
})();
