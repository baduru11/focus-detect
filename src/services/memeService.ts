// Meme service — manages bundled and custom meme images for alarm display
// Bundled memes: Vite-served static assets from /public/memes/defaults/
// Custom memes: Read via Rust IPC from appDataDir/memes/custom/

// Hardcoded manifest of bundled memes (Vite can't scan dirs at runtime)
const BUNDLED_MEMES = [
  '/memes/defaults/focus1.gif',
  '/memes/defaults/focus2.gif',
  '/memes/defaults/focus3.gif',
  '/memes/defaults/focus4.gif',
  '/memes/defaults/focus5.gif',
  '/memes/defaults/focus6.gif',
  '/memes/defaults/focus7.gif',
  '/memes/defaults/focus8.gif',
];

let cachedCustomMemes: string[] = [];
let shuffledQueue: string[] = [];

async function loadCustomMemes(): Promise<string[]> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const paths: string[] = await invoke('list_custom_memes');
    return paths;
  } catch {
    return [];
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function refreshMemeList(): Promise<void> {
  cachedCustomMemes = await loadCustomMemes();
  shuffledQueue = [];
}

export function getRandomMeme(): string | null {
  const allMemes = [...BUNDLED_MEMES, ...cachedCustomMemes];
  if (allMemes.length === 0) return null;

  // No-repeat-until-exhausted: shuffle and pull from queue
  if (shuffledQueue.length === 0) {
    shuffledQueue = shuffleArray(allMemes);
  }

  return shuffledQueue.pop() ?? null;
}

export function getBundledMemes(): string[] {
  return [...BUNDLED_MEMES];
}

export function getCustomMemes(): string[] {
  return [...cachedCustomMemes];
}
