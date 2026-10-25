# ReadSmarter (React)

Read PDFs in focused bursts, then rest to your own music.

## Run it on your computer
    npm install
    npm run dev

## Build for hosting
    npm run build
This creates a `dist` folder. Upload that folder to any static host:
- **Netlify:** drag the `dist` folder onto app.netlify.com/drop
- **Cloudflare Pages / Vercel / GitHub Pages:** build command `npm run build`, output folder `dist`

The app uses hash routing (`#/read`), so it works on any static host with no extra setup.

## Where things are
- `src/store.jsx`   timer, break music, settings and progress (shared state)
- `src/pages/`      Home, Read, Focus, Music, Library, Progress, Settings
- `src/lib/`        sentence splitting, saved library (IndexedDB), stats helpers
- `src/styles.css`  all colours live in the `:root` variables at the top

## Not included
The AI quiz after each break needs a server to call an AI service, so it is left out here.
