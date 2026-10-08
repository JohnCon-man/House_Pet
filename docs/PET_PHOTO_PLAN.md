# Photo → virtual pet: what shipped and how to go further

## Phase 1: shipped (no API, runs on the device)
When you add a photo of a real pet in Setup or ⚙️ Settings, `src/photo.js`:
1. Crops the middle of the photo into a 240 px square and saves it as a small JPEG (about 5–25 KB) inside the save data. It shows as a polaroid next to the virtual pet.
2. Groups the colors in the middle of the photo (where the pet usually is) and picks:
   - **body**: the most common color
   - **belly**: the most common clearly lighter color, or a lightened body color if there isn't one
   - **dark-coat handling**: colored irises, a lighter muzzle and white whiskers so the face stays readable
3. Paints the cat or dog SVG with those colors. Tapping any preset coat switches back to presets.

Nothing leaves the device. This also works offline.

**Limits:** it only reads colors. It can't tell ear shape, fur length or exact markings. Busy backgrounds (a red couch) can win the color vote, which is why the preset coats stay one tap away.

## Phase 2: "describe my pet" with a vision model (needs an API)
**Goal:** read the pet's real features from the photo, then keep drawing it with our own animated SVG so every expression, the blinking and the outfits still work.

1. **A small server holds the API key.** The site is static, so an API key can't ship in it. A tiny serverless function (for example a Cloudflare Worker or Vercel function, both with free tiers):
   - accepts a downscaled photo (about 512 px)
   - calls a vision-capable model with a fixed prompt
   - returns JSON
   - stores nothing
2. **The prompt asks for structured output only:**
   ```json
   { "kind": "cat|dog", "pattern": "solid|tabby|tuxedo|calico|spotted|bicolor|pointed",
     "colors": { "body": "#hex", "belly": "#hex", "markings": ["#hex"] },
     "ears": "pointy|floppy|folded|upright", "fur": "short|long|curly",
     "eyes": "#hex", "notes": "e.g. white socks, one ear darker" }
   ```
3. **Grow the SVG parts to match.** Add ear shapes (folded, upright dog ears), a fluffy-fur outline, socks, a face mask (Siamese/husky) and patterns such as stripes and points. The renderer already takes a `coat` object, so new fields slot in.
4. **Opt-in and privacy:**
   - It's a separate "✨ Make it look like my pet" button with a note that the photo is sent for analysis.
   - It falls back to the Phase 1 result if offline or if the request fails.
5. **Cost:** one small image request per pet setup, so a fraction of a cent each. Add a simple rate limit on the server function.

## Phase 3 (optional): AI-drawn portrait
Use an image-generation model to draw a sticker-style portrait from the photo. Shown as the framed picture, it would replace the polaroid.

The animated pet should stay SVG. Generated images can't blink, change expression or wear hats consistently, and each new pose would cost another generation. This needs the same server function plus image storage, since a portrait is larger than our save data should hold. Sync across devices would also need a backend.

## Recommendation
Phase 1 is enough to make pets feel personal today. If people love it, do Phase 2 next. It's the best value: the cost is tiny and it fits the existing art. Hold off on Phase 3 unless portraits become a headline feature.
