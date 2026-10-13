# Kinetic Text Studio (60s to 3min Animations)

A high-performance kinetic typography studio built with HTML, Vanilla CSS, JavaScript, and TypeScript. Designed for creating kinetic text animations for social media videos (YouTube Shorts, Instagram Reels, TikTok, and standard widescreen videos).

## Features

- **Custom Script Input & Formatting**:
  - Paste any script directly into the **Script Studio** editor.
  - Wrap any word or phrase in `*text*` to make it glow in vibrant **neon yellow**.
  - Automatic detection of numbers (animated counters) and acronyms (neon accents).
- **Auto Duration & Dynamic Pacing**:
  - Automatically calculates optimal target duration (from 15s up to 180s / 3 minutes) and reading speed based on script word count.
  - Manual duration slider with preset pills (`60s / 1m`, `120s / 2m`, `180s / 3m`).
- **6 Kinetic Animation Styles**:
  - **Slide Up**: Clean vertical kinetic typography.
  - **Typewriter**: Letter-by-letter kinetic typing effect.
  - **Pop Zoom**: Dynamic scale pop entrance.
  - **Blur Focus**: Cinematic blur-to-sharp depth focus.
  - **3D Flip**: Perspective card flip entrance.
  - **Glitch**: High-energy RGB split displacement.
- **Custom Font Selector**:
  - **Inter**: Clean, modern sans-serif.
  - **Outfit**: Premium geometric display typography.
  - **JetBrains Mono**: Technical monospaced kinetic style.
  - **Montserrat**: Bold headline typography.
- **Dynamic Aspect Ratio Framing (1.91:1 to 9:16)**:
  - **9:16 Vertical**: Instagram Reels, TikTok, YouTube Shorts.
  - **4:5 Portrait**: Instagram Feed posts.
  - **1:1 Square**: Multi-platform square posts.
  - **16:9 Landscape**: Standard YouTube & presentation format.
  - **1.91:1 Widescreen**: Twitter/X and banner ads format.
  - Responsive font fitting (`autoShrinkLines()`) to ensure no text overflowing in any ratio.
- **Bidirectional Timeline Scrubber & Player Controls**:
  - Interactive scrubbing line with glowing thumb handle (drag forward or backward).
  - Hover tooltip with live timestamp.
  - `-5s` and `+5s` quick jump buttons and keyboard shortcuts (<kbd>←</kbd> / <kbd>→</kbd> / <kbd>Space</kbd>).
  - Real-time custom speed slider (`0.25x` to `3.0x`) with quick preset buttons (`0.5x`, `1.0x`, `1.5x`, `2.0x`).
  - Play, Pause, and Replay controls.
- **TypeScript Architecture**:
  - Complete TypeScript implementation in [script.ts](file:///c:/Users/srava/Downloads/after%20effects/script.ts).
  - Runtime JavaScript build in [script.js](file:///c:/Users/srava/Downloads/after%20effects/script.js).

## How to Run

1. Open `index.html` in any modern web browser or run a local static server:
   ```bash
   npx serve . -l 3456
   ```
2. Navigate to `http://localhost:3456/`.
3. Open the **Script Studio** panel, write or paste your script, select your style and aspect ratio, and click **Animate Script**!

