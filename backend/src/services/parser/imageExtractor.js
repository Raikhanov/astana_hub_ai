const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function analyzeImage(imageUrl, prompt) {
  if (!imageUrl) {
    return null;
  }

  try {
    const completion =
      await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 1200,
        temperature: 0,
        response_format: {
          type: 'json_object',
        },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high',
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      });

    const content =
      completion.choices?.[0]?.message?.content;

    if (!content) {
      return null;
    }

    try {
      return JSON.parse(content);
    } catch (jsonError) {
      console.error(
        '[Vision] Невалидный JSON:',
        content
      );
      return null;
    }

  } catch (err) {

    if (
      err?.status === 400 ||
      err?.statusCode === 400
    ) {
      return null;
    }

    console.error(
      '[Vision] Ошибка:',
      err.message
    );

    return null;
  }
}

module.exports = {
  analyzeImage,
};