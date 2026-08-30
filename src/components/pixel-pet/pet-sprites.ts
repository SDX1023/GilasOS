export function darken(hex: string): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 40);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 40);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 40);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export const PET_BGS: Record<string, { sky: string; grass: string; name: string; emoji: string }> = {
  night: { sky: "linear-gradient(180deg, #0c1445 0%, #1a1a3e 40%, #1e3a5f 100%)", grass: "linear-gradient(180deg, #166534 0%, #14532d 100%)", name: "Night", emoji: "🌙" },
  sunset: { sky: "linear-gradient(180deg, #1e1b4b 0%, #7c2d12 50%, #f97316 100%)", grass: "linear-gradient(180deg, #365314 0%, #1a2e05 100%)", name: "Sunset", emoji: "🌅" },
  ocean: { sky: "linear-gradient(180deg, #0c4a6e 0%, #075985 50%, #0ea5e9 100%)", grass: "linear-gradient(180deg, #164e63 0%, #0e3a4d 100%)", name: "Ocean", emoji: "🌊" },
  sakura: { sky: "linear-gradient(180deg, #4c1d95 0%, #831843 50%, #ec4899 100%)", grass: "linear-gradient(180deg, #166534 0%, #14532d 100%)", name: "Sakura", emoji: "🌸" },
  forest: { sky: "linear-gradient(180deg, #14532d 0%, #166534 50%, #22c55e 100%)", grass: "linear-gradient(180deg, #064e3b 0%, #065f46 100%)", name: "Forest", emoji: "🌲" },
  snow: { sky: "linear-gradient(180deg, #cbd5e1 0%, #e2e8f0 50%, #f8fafc 100%)", grass: "linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)", name: "Snow", emoji: "❄️" },
};

const OLAF_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" shape-rendering="crispEdges">
  <rect x="6" y="0" width="1" height="2" fill="#93c5fd"/><rect x="9" y="0" width="1" height="2" fill="#93c5fd"/><rect x="12" y="0" width="1" height="2" fill="#93c5fd"/>
  <rect x="5" y="0" width="14" height="2" fill="#3b82f6"/>
  <rect x="4" y="2" width="16" height="1" fill="#2563eb"/>
  <rect x="3" y="3" width="18" height="14" fill="#f8fafc"/>
  <rect x="1" y="5" width="3" height="7" fill="#111"/>
  <rect x="20" y="5" width="3" height="7" fill="#111"/>
  <rect x="2" y="6" width="2" height="5" fill="#111"/><rect x="20" y="6" width="2" height="5" fill="#111"/>
  <rect x="4" y="4" width="16" height="2" fill="#e2e8f0"/>
  <rect x="5" y="6" width="5" height="5" fill="#111"/><rect x="14" y="6" width="5" height="5" fill="#111"/>
  <rect x="6" y="6" width="3" height="3" fill="#f1f5f9"/><rect x="15" y="6" width="3" height="3" fill="#f1f5f9"/>
  <rect x="7" y="7" width="1" height="1" fill="#fff"/><rect x="16" y="7" width="1" height="1" fill="#fff"/>
  <rect x="11" y="11" width="2" height="2" fill="#111"/>
  <rect x="11" y="13" width="2" height="1" fill="#94a3b8"/>
  <rect x="10" y="14" width="1" height="1" fill="#ef4444"/><rect x="13" y="14" width="1" height="1" fill="#ef4444"/>
  <rect x="6" y="12" width="2" height="2" fill="#f9a8d4"/><rect x="16" y="12" width="2" height="2" fill="#f9a8d4"/>
  <rect x="4" y="17" width="16" height="2" fill="#f8fafc"/>
  <rect x="5" y="17" width="14" height="1" fill="#e2e8f0"/>
  <rect x="5" y="19" width="6" height="3" fill="#f8fafc"/><rect x="13" y="19" width="6" height="3" fill="#f8fafc"/>
  <rect x="6" y="19" width="4" height="1" fill="#e2e8f0"/><rect x="14" y="19" width="4" height="1" fill="#e2e8f0"/>
  <rect x="6" y="22" width="4" height="2" fill="#f8fafc"/><rect x="14" y="22" width="4" height="2" fill="#f8fafc"/>
  <rect x="7" y="23" width="2" height="1" fill="#111"/><rect x="15" y="23" width="2" height="1" fill="#111"/>
</svg>`;

const OLAF_SVG_SLEEP = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" shape-rendering="crispEdges">
  <rect x="5" y="1" width="14" height="2" fill="#3b82f6"/>
  <rect x="4" y="3" width="16" height="1" fill="#2563eb"/>
  <rect x="3" y="4" width="18" height="13" fill="#f8fafc"/>
  <rect x="1" y="6" width="3" height="6" fill="#111"/>
  <rect x="20" y="6" width="3" height="6" fill="#111"/>
  <rect x="2" y="7" width="2" height="4" fill="#111"/><rect x="20" y="7" width="2" height="4" fill="#111"/>
  <rect x="4" y="5" width="16" height="2" fill="#e2e8f0"/>
  <rect x="5" y="7" width="5" height="4" fill="#475569"/><rect x="14" y="7" width="5" height="4" fill="#475569"/>
  <rect x="6" y="7" width="3" height="3" fill="#94a3b8"/><rect x="15" y="7" width="3" height="3" fill="#94a3b8"/>
  <rect x="11" y="11" width="2" height="2" fill="#111"/>
  <rect x="11" y="13" width="2" height="1" fill="#94a3b8"/>
  <rect x="6" y="13" width="2" height="2" fill="#f9a8d4"/><rect x="16" y="13" width="2" height="2" fill="#f9a8d4"/>
  <rect x="4" y="17" width="16" height="2" fill="#f8fafc"/>
  <rect x="5" y="19" width="6" height="3" fill="#f8fafc"/><rect x="13" y="19" width="6" height="3" fill="#f8fafc"/>
  <rect x="6" y="22" width="4" height="2" fill="#f8fafc"/><rect x="14" y="22" width="4" height="2" fill="#f8fafc"/>
  <rect x="7" y="23" width="2" height="1" fill="#111"/><rect x="15" y="23" width="2" height="1" fill="#111"/>
</svg>`;

export const PET_SPRITES: Record<string, (c: string) => string> = {
  cat: (c) => {
    const d = darken(c);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" shape-rendering="crispEdges">
    <rect x="4" y="1" width="3" height="5" fill="${c}"/><rect x="17" y="1" width="3" height="5" fill="${c}"/>
    <rect x="5" y="2" width="1" height="3" fill="#fca5a5"/><rect x="18" y="2" width="1" height="3" fill="#fca5a5"/>
    <rect x="5" y="5" width="14" height="13" fill="${c}"/>
    <rect x="6" y="4" width="12" height="1" fill="${c}"/>
    <rect x="7" y="5" width="10" height="2" fill="${d}"/>
    <rect x="7" y="7" width="4" height="4" fill="#111"/><rect x="13" y="7" width="4" height="4" fill="#111"/>
    <rect x="8" y="7" width="2" height="2" fill="#fff"/><rect x="14" y="7" width="2" height="2" fill="#fff"/>
    <rect x="11" y="10" width="2" height="1" fill="#f472b6"/>
    <rect x="6" y="11" width="2" height="2" fill="#f9a8d4"/><rect x="16" y="11" width="2" height="2" fill="#f9a8d4"/>
    <rect x="6" y="13" width="12" height="3" fill="${d}"/>
    <rect x="7" y="16" width="10" height="2" fill="${c}"/>
    <rect x="7" y="18" width="3" height="2" fill="${c}"/><rect x="14" y="18" width="3" height="2" fill="${c}"/>
    <rect x="5" y="19" width="3" height="1" fill="${c}"/><rect x="16" y="19" width="3" height="1" fill="${c}"/>
    <rect x="5" y="20" width="2" height="1" fill="${d}"/><rect x="17" y="20" width="2" height="1" fill="${d}"/>
  </svg>`;
  },
  dog: (c) => {
    const d = darken(c);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" shape-rendering="crispEdges">
    <rect x="2" y="3" width="4" height="8" fill="${c}"/><rect x="18" y="3" width="4" height="8" fill="${c}"/>
    <rect x="3" y="4" width="2" height="5" fill="${d}"/><rect x="19" y="4" width="2" height="5" fill="${d}"/>
    <rect x="5" y="5" width="14" height="13" fill="${c}"/>
    <rect x="6" y="4" width="12" height="1" fill="${c}"/>
    <rect x="7" y="5" width="10" height="2" fill="${d}"/>
    <rect x="7" y="7" width="4" height="4" fill="#111"/><rect x="13" y="7" width="4" height="4" fill="#111"/>
    <rect x="8" y="7" width="2" height="2" fill="#fff"/><rect x="14" y="7" width="2" height="2" fill="#fff"/>
    <rect x="10" y="11" width="4" height="3" fill="#111"/>
    <rect x="11" y="14" width="2" height="1" fill="#f472b6"/>
    <rect x="6" y="11" width="2" height="2" fill="#f9a8d4"/><rect x="16" y="11" width="2" height="2" fill="#f9a8d4"/>
    <rect x="6" y="13" width="12" height="3" fill="${d}"/>
    <rect x="7" y="16" width="10" height="2" fill="${c}"/>
    <rect x="7" y="18" width="3" height="2" fill="${c}"/><rect x="14" y="18" width="3" height="2" fill="${c}"/>
    <rect x="5" y="19" width="3" height="1" fill="${c}"/><rect x="16" y="19" width="3" height="1" fill="${c}"/>
    <rect x="5" y="20" width="2" height="1" fill="${d}"/><rect x="17" y="20" width="2" height="1" fill="${d}"/>
  </svg>`;
  },
  fox: (c) => {
    const d = darken(c);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" shape-rendering="crispEdges">
    <rect x="4" y="0" width="3" height="6" fill="${c}"/><rect x="17" y="0" width="3" height="6" fill="${c}"/>
    <rect x="5" y="1" width="1" height="4" fill="#fff"/><rect x="18" y="1" width="1" height="4" fill="#fff"/>
    <rect x="5" y="5" width="14" height="13" fill="${c}"/>
    <rect x="6" y="4" width="12" height="1" fill="${c}"/>
    <rect x="7" y="5" width="10" height="2" fill="#fff"/>
    <rect x="7" y="7" width="4" height="4" fill="#111"/><rect x="13" y="7" width="4" height="4" fill="#111"/>
    <rect x="8" y="7" width="2" height="2" fill="#fff"/><rect x="14" y="7" width="2" height="2" fill="#fff"/>
    <rect x="11" y="11" width="2" height="1" fill="#111"/>
    <rect x="6" y="11" width="2" height="2" fill="#f9a8d4"/><rect x="16" y="11" width="2" height="2" fill="#f9a8d4"/>
    <rect x="6" y="13" width="12" height="3" fill="#fff"/>
    <rect x="7" y="16" width="10" height="2" fill="${c}"/>
    <rect x="7" y="18" width="3" height="2" fill="#fff"/><rect x="14" y="18" width="3" height="2" fill="#fff"/>
    <rect x="5" y="19" width="3" height="1" fill="#fff"/><rect x="16" y="19" width="3" height="1" fill="#fff"/>
    <rect x="5" y="20" width="2" height="1" fill="${d}"/><rect x="17" y="20" width="2" height="1" fill="${d}"/>
    <rect x="21" y="11" width="2" height="2" fill="${c}"/><rect x="22" y="10" width="1" height="3" fill="${c}"/>
  </svg>`;
  },
  bunny: (c) => {
    const d = darken(c);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" shape-rendering="crispEdges">
    <rect x="7" y="0" width="3" height="8" fill="${c}"/><rect x="14" y="0" width="3" height="8" fill="${c}"/>
    <rect x="8" y="1" width="1" height="6" fill="#f9a8d4"/><rect x="15" y="1" width="1" height="6" fill="#f9a8d4"/>
    <rect x="5" y="7" width="14" height="13" fill="${c}"/>
    <rect x="6" y="6" width="12" height="1" fill="${c}"/>
    <rect x="7" y="7" width="10" height="2" fill="${d}"/>
    <rect x="7" y="9" width="4" height="4" fill="#111"/><rect x="13" y="9" width="4" height="4" fill="#111"/>
    <rect x="8" y="9" width="2" height="2" fill="#fff"/><rect x="14" y="9" width="2" height="2" fill="#fff"/>
    <rect x="11" y="13" width="2" height="1" fill="#f9a8d4"/>
    <rect x="6" y="13" width="2" height="2" fill="#f9a8d4"/><rect x="16" y="13" width="2" height="2" fill="#f9a8d4"/>
    <rect x="6" y="15" width="12" height="3" fill="${d}"/>
    <rect x="7" y="18" width="10" height="2" fill="${c}"/>
    <rect x="7" y="20" width="3" height="1" fill="#fff"/><rect x="14" y="20" width="3" height="1" fill="#fff"/>
    <rect x="9" y="19" width="6" height="2" fill="#fff"/>
  </svg>`;
  },
  penguin: (c) => {
    const d = darken(c);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" shape-rendering="crispEdges">
    <rect x="5" y="3" width="14" height="14" fill="#334155"/>
    <rect x="6" y="2" width="12" height="1" fill="#475569"/>
    <rect x="6" y="5" width="12" height="11" fill="#f1f5f9"/>
    <rect x="7" y="5" width="10" height="2" fill="#e2e8f0"/>
    <rect x="7" y="7" width="4" height="4" fill="#111"/><rect x="13" y="7" width="4" height="4" fill="#111"/>
    <rect x="8" y="7" width="2" height="2" fill="#fff"/><rect x="14" y="7" width="2" height="2" fill="#fff"/>
    <rect x="11" y="11" width="2" height="2" fill="${c}"/>
    <rect x="11" y="13" width="2" height="1" fill="#111"/>
    <rect x="6" y="11" width="2" height="2" fill="#f9a8d4"/><rect x="16" y="11" width="2" height="2" fill="#f9a8d4"/>
    <rect x="2" y="7" width="4" height="7" fill="#334155"/><rect x="18" y="7" width="4" height="7" fill="#334155"/>
    <rect x="3" y="8" width="2" height="5" fill="#475569"/><rect x="19" y="8" width="2" height="5" fill="#475569"/>
    <rect x="5" y="17" width="14" height="2" fill="#334155"/>
    <rect x="6" y="19" width="5" height="2" fill="${c}"/><rect x="13" y="19" width="5" height="2" fill="${c}"/>
    <rect x="7" y="20" width="2" height="1" fill="#111"/><rect x="15" y="20" width="2" height="1" fill="#111"/>
  </svg>`;
  },
  owl: (c) => {
    const d = darken(c);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" shape-rendering="crispEdges">
    <rect x="5" y="0" width="3" height="4" fill="${c}"/><rect x="16" y="0" width="3" height="4" fill="${c}"/>
    <rect x="6" y="1" width="1" height="2" fill="${d}"/><rect x="17" y="1" width="1" height="2" fill="${d}"/>
    <rect x="5" y="4" width="14" height="14" fill="${c}"/>
    <rect x="6" y="3" width="12" height="1" fill="${d}"/>
    <rect x="6" y="4" width="12" height="3" fill="${d}"/>
    <rect x="6" y="7" width="5" height="5" fill="#111"/><rect x="13" y="7" width="5" height="5" fill="#111"/>
    <rect x="7" y="7" width="3" height="3" fill="#f5f5f4"/><rect x="14" y="7" width="3" height="3" fill="#f5f5f4"/>
    <rect x="8" y="8" width="1" height="1" fill="#fff"/><rect x="15" y="8" width="1" height="1" fill="#fff"/>
    <rect x="11" y="10" width="2" height="2" fill="${d}"/>
    <rect x="6" y="12" width="2" height="2" fill="#f9a8d4"/><rect x="16" y="12" width="2" height="2" fill="#f9a8d4"/>
    <rect x="6" y="14" width="12" height="2" fill="${d}"/>
    <rect x="7" y="14" width="10" height="1" fill="#f5f5f4"/>
    <rect x="8" y="15" width="2" height="1" fill="#f5f5f4"/><rect x="14" y="15" width="2" height="1" fill="#f5f5f4"/>
    <rect x="10" y="16" width="4" height="1" fill="${d}"/>
    <rect x="3" y="8" width="3" height="6" fill="${c}"/><rect x="18" y="8" width="3" height="6" fill="${c}"/>
    <rect x="4" y="9" width="1" height="4" fill="${d}"/><rect x="19" y="9" width="1" height="4" fill="${d}"/>
    <rect x="5" y="18" width="14" height="2" fill="${c}"/>
    <rect x="6" y="20" width="4" height="2" fill="#f97316"/><rect x="14" y="20" width="4" height="2" fill="#f97316"/>
    <rect x="7" y="21" width="2" height="1" fill="#111"/><rect x="15" y="21" width="2" height="1" fill="#111"/>
  </svg>`;
  },
  olaf: () => OLAF_SVG,
};

const PET_SPRITES_SLEEP: Record<string, (c: string) => string> = {
  cat: (c) => {
    const d = darken(c);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" shape-rendering="crispEdges">
    <rect x="4" y="1" width="3" height="5" fill="${c}"/><rect x="17" y="1" width="3" height="5" fill="${c}"/>
    <rect x="5" y="5" width="14" height="13" fill="${c}"/>
    <rect x="7" y="8" width="4" height="2" fill="#475569"/><rect x="13" y="8" width="4" height="2" fill="#475569"/>
    <rect x="11" y="11" width="2" height="1" fill="#f472b6"/>
    <rect x="6" y="11" width="2" height="2" fill="#f9a8d4"/><rect x="16" y="11" width="2" height="2" fill="#f9a8d4"/>
    <rect x="6" y="13" width="12" height="3" fill="${d}"/>
    <rect x="7" y="16" width="10" height="2" fill="${c}"/>
    <rect x="7" y="18" width="3" height="2" fill="${c}"/><rect x="14" y="18" width="3" height="2" fill="${c}"/>
  </svg>`;
  },
  olaf: () => OLAF_SVG_SLEEP,
};

export function getSpriteUrl(pet: { pet_type: string; color: string; sprite_url: string | null }, sleeping?: boolean): string {
  if (pet.sprite_url && !sleeping) return pet.sprite_url;
  if (sleeping && PET_SPRITES_SLEEP[pet.pet_type]) {
    return `data:image/svg+xml,${encodeURIComponent(PET_SPRITES_SLEEP[pet.pet_type](pet.color))}`;
  }
  const spriteFn = PET_SPRITES[pet.pet_type] || PET_SPRITES.cat;
  return `data:image/svg+xml,${encodeURIComponent(spriteFn(pet.color))}`;
}
