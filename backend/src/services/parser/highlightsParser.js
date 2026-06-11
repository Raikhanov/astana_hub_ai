const { ApifyClient } = require('apify-client');
const { extractStaffFromPost } = require('./staffExtractor');
const staffRepo = require('../../db/staffRepo');

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

async function parseHighlights(hub) {
  console.log(`[Highlights] Парсим highlights @${hub.handle}...`);

  try {
    const run = await client.actor('apify/instagram-highlight-scraper').call({
      username:     hub.handle,
      resultsLimit: 30,
    });

    const { items } = await client
      .dataset(run.defaultDatasetId)
      .listItems();

    console.log(`[Highlights] @${hub.handle} — получено ${items.length} stories`);

    for (const item of items) {
      // Highlight это массив stories внутри
      const stories = item.items || item.stories || [item];

      for (const story of stories) {
        const fakePost = {
          id:          story.id || item.id,
          caption:     story.caption || item.title || '',
          displayUrl:  story.displayUrl || story.url || null,
          thumbnailUrl: story.thumbnailUrl || null,
        };

        const staff = await extractStaffFromPost(fakePost, hub.city, hub.handle);

        if (staff.length) {
          staff.forEach(s => {
            staffRepo.upsert({ ...s, source_type: 'highlight' });
            console.log(`  👤 [Highlight] ${s.name} · ${s.role}`);
          });
        }
      }
    }

  } catch (err) {
    // Highlights могут быть недоступны — не роняем весь парсинг
    console.warn(`[Highlights] @${hub.handle} недоступны:`, err.message);
  }
}

module.exports = { parseHighlights };