const { ApifyClient } = require('apify-client');

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

async function scrapeInstagram(handle, limit = 30) {
  console.log(`[Apify] Scraping @${handle} (limit: ${limit})...`);

  const run = await client.actor('apify/instagram-post-scraper').call({
    username:     [handle],
    resultsLimit: limit,
  });

  const { items } = await client
    .dataset(run.defaultDatasetId)
    .listItems();

  console.log(
    `[Apify] @${handle} — получено ${items.length} постов`
  );

  return items;
}

module.exports = { scrapeInstagram };