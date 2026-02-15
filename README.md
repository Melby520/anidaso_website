# anidaso_website

Static multi-page website for Anidaso.

## Chatbot (Ask Anidaso)

This site includes a lightweight, client-side chatbot that answers questions using the content of the site’s pages (no backend required).

- Widget UI is injected site-wide by `script.js`
- Chat logic + indexing lives in `assets/chatbot.js`
- Pages to index are listed in `assets/content_manifest.json`

### Update what the bot can answer

1. Edit `assets/content_manifest.json`
2. Add (or remove) page paths you want the bot to search (examples: `"about.html"`, `"membership/uk.html"`).

Notes:
- Keep paths relative to the site root.
- After updating the manifest, hard-refresh the browser to rebuild the bot’s in-memory index.

### How answers are generated (high level)

- The bot fetches the pages in the manifest and extracts the main content (it tries to avoid nav/footer/scripts).
- It ranks pages using keyword scoring (with light normalization + a few synonyms).
- It responds with a short summary (2–4 bullet points) plus a link to the best matching page and a couple of related pages.