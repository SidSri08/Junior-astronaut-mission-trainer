// Custom illustrated SVG icons, building miniatures, NASA badge,
// and state-machine driven "Commander Astro" robot mascot for Ages 7–12.

export function renderBrandEmblem() {
  return `
    <svg class="brand-emblem-svg" viewBox="0 0 48 48" width="40" height="40" aria-hidden="true">
      <defs>
        <radialGradient id="moonGrad" cx="38%" cy="34%" r="65%">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="55%" stop-color="#cbd5e1"/>
          <stop offset="100%" stop-color="#64748b"/>
        </radialGradient>
        <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="50%" stop-color="#22d3ee"/>
          <stop offset="100%" stop-color="#fbbf24"/>
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="13.5" fill="url(#moonGrad)" stroke="rgba(255,255,255,0.45)" stroke-width="1"/>
      <circle cx="19" cy="19" r="2.6" fill="rgba(100,116,139,0.55)"/>
      <circle cx="28" cy="26" r="3.2" fill="rgba(100,116,139,0.45)"/>
      <circle cx="20.5" cy="29" r="1.6" fill="rgba(100,116,139,0.5)"/>
      <ellipse cx="24" cy="24" rx="21" ry="7.2" transform="rotate(-24 24 24)" fill="none" stroke="url(#orbitGrad)" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="40.5" cy="15.5" r="2.6" fill="#fde047"/>
    </svg>
  `;
}

export function renderResourceIcon(key) {
  switch (key) {
    case 'oxygen':
      return `
        <svg viewBox="0 0 28 28" width="22" height="22" aria-hidden="true">
          <path d="M4 11h13a3 3 0 1 0-3-3" fill="none" stroke="#38bdf8" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M3 16h18a3.2 3.2 0 1 1-3.2 3.2" fill="none" stroke="#67e8f9" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M6 21h7" fill="none" stroke="#a5f3fc" stroke-width="2.2" stroke-linecap="round"/>
        </svg>
      `;
    case 'water':
      return `
        <svg viewBox="0 0 28 28" width="22" height="22" aria-hidden="true">
          <defs>
            <linearGradient id="dropG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#67e8f9"/>
              <stop offset="100%" stop-color="#0284c7"/>
            </linearGradient>
          </defs>
          <path d="M14 3.5C14 3.5 6.5 12 6.5 17.2a7.5 7.5 0 0 0 15 0C21.5 12 14 3.5 14 3.5z" fill="url(#dropG)" stroke="#bae6fd" stroke-width="1.2"/>
          <path d="M11 16.5c0 2.2 1.3 3.8 3 4.3" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      `;
    case 'food':
      return `
        <svg viewBox="0 0 28 28" width="22" height="22" aria-hidden="true">
          <path d="M6 21C6 12 12 6 22 6c0 10-5 15-14 15z" fill="#22c55e" stroke="#86efac" stroke-width="1.2"/>
          <path d="M5 23c4-4 8.5-8 14-12" fill="none" stroke="#dcfce7" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      `;
    case 'battery':
      return `
        <svg viewBox="0 0 28 28" width="22" height="22" aria-hidden="true">
          <path d="M15.8 3L7 15.5h6.2L11.8 25L21 12.2h-6.3L15.8 3z" fill="#facc15" stroke="#fef08a" stroke-width="1.2" stroke-linejoin="round"/>
        </svg>
      `;
    case 'crew':
      return `
        <svg viewBox="0 0 28 28" width="22" height="22" aria-hidden="true">
          <circle cx="9" cy="10" r="3" fill="#67e8f9"/>
          <circle cx="19" cy="10" r="3" fill="#67e8f9"/>
          <circle cx="14" cy="9" r="3.4" fill="#bae6fd"/>
          <path d="M4.5 21.5c0-3 2.2-5 4.8-5M23.5 21.5c0-3-2.2-5-4.8-5M8.5 22c0-3.4 2.5-5.6 5.5-5.6s5.5 2.2 5.5 5.6" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round"/>
        </svg>
      `;
    case 'radiation':
      return `
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M12 2.5L4.5 5.8v5.7c0 4.9 3.2 9.2 7.5 10.5 4.3-1.3 7.5-5.6 7.5-10.5V5.8L12 2.5z" fill="#1e3a8a" stroke="#60a5fa" stroke-width="1.6"/>
          <path d="M12 5.5v13.2" stroke="#93c5fd" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
      `;
    case 'research':
      return `
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M9.5 3.5h5M10.5 3.5v4.8L5.6 17.6A2.2 2.2 0 0 0 7.5 20.8h9a2.2 2.2 0 0 0 1.9-3.2L13.5 8.3V3.5" fill="none" stroke="#e9d5ff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M7.2 15.2h9.6l1.3 2.4a1.4 1.4 0 0 1-1.2 2.1H7.1a1.4 1.4 0 0 1-1.2-2.1l1.3-2.4z" fill="#c084fc"/>
        </svg>
      `;
    case 'repairKits':
      return `
        <svg viewBox="0 0 28 28" width="22" height="22" aria-hidden="true">
          <rect x="4" y="9" width="20" height="14" rx="3" fill="#ea580c" stroke="#fed7aa" stroke-width="1.3"/>
          <path d="M10 9V6.5A1.5 1.5 0 0 1 11.5 5h5A1.5 1.5 0 0 1 18 6.5V9" fill="none" stroke="#fde68a" stroke-width="2"/>
          <rect x="4" y="14" width="20" height="2" fill="#9a3412"/>
          <rect x="12" y="12.5" width="4" height="4.5" rx="1" fill="#fde047"/>
        </svg>
      `;
    default:
      return '';
  }
}

export function renderBuildingIllustration(id, size = 34) {
  switch (id) {
    case 'habitat':
      return `
        <svg class="b-svg" viewBox="0 0 44 44" width="${size}" height="${size}" aria-hidden="true">
          <ellipse cx="22" cy="36" rx="17" ry="3.2" fill="rgba(15,23,42,0.55)"/>
          <path d="M8 34v-4c0-9 6.2-16 14-16s14 7 14 16v4H8z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.4"/>
          <path d="M22 14v20M13.5 18.5c2 3.5 3 8.5 3 15.5M30.5 18.5c-2 3.5-3 8.5-3 15.5" stroke="#94a3b8" stroke-width="1.1" fill="none" opacity="0.6"/>
          <rect x="17" y="25" width="10" height="9" rx="2" fill="#f59e0b" stroke="#475569" stroke-width="1.2"/>
          <rect x="11" y="26" width="3.5" height="3.2" rx="0.8" fill="#fde047"/>
          <rect x="29.5" y="26" width="3.5" height="3.2" rx="0.8" fill="#fde047"/>
          <circle cx="22" cy="11" r="2.2" fill="#facc15"/>
        </svg>
      `;
    case 'lifeSupport':
      return `
        <svg class="b-svg" viewBox="0 0 44 44" width="${size}" height="${size}" aria-hidden="true">
          <rect x="7" y="22" width="30" height="13" rx="3" fill="#cbd5e1" stroke="#64748b" stroke-width="1.3"/>
          <rect x="10" y="13" width="14" height="19" rx="5" fill="#e2e8f0" stroke="#475569" stroke-width="1.3"/>
          <path d="M17 17.5s-3.5 4.2-3.5 6.8a3.5 3.5 0 0 0 7 0c0-2.6-3.5-6.8-3.5-6.8z" fill="#0ea5e9"/>
          <rect x="26" y="15" width="8" height="17" rx="3" fill="#0284c7" stroke="#7dd3fc" stroke-width="1.1"/>
          <circle cx="30" cy="20" r="1.8" fill="#22d3ee"/>
        </svg>
      `;
    case 'solar':
      return `
        <svg class="b-svg" viewBox="0 0 44 44" width="${size}" height="${size}" aria-hidden="true">
          <rect x="19" y="29" width="6" height="8" rx="1" fill="#64748b"/>
          <rect x="12" y="35" width="20" height="3" rx="1.5" fill="#475569"/>
          <g transform="rotate(-8 22 18)">
            <rect x="7" y="9" width="30" height="20" rx="2.5" fill="#1d4ed8" stroke="#93c5fd" stroke-width="1.5"/>
            <path d="M7 15.6h30M7 22.3h30M14.5 9v20M22 9v20M29.5 9v20" stroke="#60a5fa" stroke-width="1.1"/>
          </g>
        </svg>
      `;
    case 'greenhouse':
      return `
        <svg class="b-svg" viewBox="0 0 44 44" width="${size}" height="${size}" aria-hidden="true">
          <rect x="6" y="31" width="32" height="5" rx="2" fill="#94a3b8"/>
          <path d="M8 31v-6c0-7.5 6.2-13 14-13s14 5.5 14 13v6H8z" fill="rgba(217,70,239,0.28)" stroke="#f0abfc" stroke-width="1.5"/>
          <path d="M22 12v19M14.5 14.5v16.5M29.5 14.5v16.5" stroke="#94a3b8" stroke-width="1.1"/>
          <circle cx="15" cy="27" r="3.4" fill="#22c55e"/>
          <circle cx="22" cy="26" r="3.8" fill="#4ade80"/>
          <circle cx="29" cy="27" r="3.4" fill="#22c55e"/>
          <line x1="12" y1="17" x2="32" y2="17" stroke="#f472b6" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;
    case 'lab':
      return `
        <svg class="b-svg" viewBox="0 0 44 44" width="${size}" height="${size}" aria-hidden="true">
          <rect x="7" y="18" width="22" height="16" rx="3" fill="#e2e8f0" stroke="#64748b" stroke-width="1.3"/>
          <rect x="7" y="18" width="22" height="4" rx="1" fill="#0284c7"/>
          <path d="M16.5 23.5h3M17.2 23.5v2.6l-2.6 4.4a1.2 1.2 0 0 0 1 1.8h4.8a1.2 1.2 0 0 0 1-1.8l-2.6-4.4v-2.6" fill="#a855f7" stroke="#7e22ce" stroke-width="1"/>
          <rect x="26" y="25" width="12" height="7" rx="2" fill="#f8fafc" stroke="#475569" stroke-width="1.2"/>
          <rect x="28" y="23" width="6" height="3" rx="1" fill="#eab308"/>
          <circle cx="29" cy="34" r="2.4" fill="#334155"/>
          <circle cx="35.5" cy="34" r="2.4" fill="#334155"/>
          <path d="M15 11a5 5 0 0 1 8 0" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="19" y1="12" x2="19" y2="18" stroke="#64748b" stroke-width="1.8"/>
        </svg>
      `;
    case 'comms':
      return `
        <svg class="b-svg" viewBox="0 0 44 44" width="${size}" height="${size}" aria-hidden="true">
          <rect x="13" y="30" width="18" height="6" rx="2" fill="#94a3b8" stroke="#475569" stroke-width="1.2"/>
          <rect x="19" y="20" width="6" height="11" rx="1" fill="#64748b"/>
          <path d="M11 16c4 7 18 7 22 0" fill="#e2e8f0" stroke="#38bdf8" stroke-width="1.6"/>
          <line x1="22" y1="19" x2="22" y2="11" stroke="#334155" stroke-width="2" stroke-linecap="round"/>
          <circle cx="22" cy="10" r="2.4" fill="#38bdf8"/>
          <path d="M16 7a8 8 0 0 1 12 0" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      `;
    default:
      return '';
  }
}

export function renderNasaGuideBadge() {
  return `
    <svg viewBox="0 0 32 32" width="20" height="20" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="#0b3d91" stroke="#60a5fa" stroke-width="1.5"/>
      <path d="M4.5 18.5c7-5.5 16-7.5 23-3" fill="none" stroke="#ef4444" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="11" cy="11" r="1" fill="#fff"/>
      <circle cx="22" cy="12" r="1.2" fill="#fff"/>
      <circle cx="20" cy="22" r="0.9" fill="#fff"/>
      <text x="16" y="19" text-anchor="middle" font-size="7.5" font-weight="800" fill="#ffffff" font-family="Outfit, sans-serif">NASA</text>
    </svg>
  `;
}

// Rive-style State-Machine Character ("Commander Astro" Robot Companion)
// States supported: 'idle' | 'happy' | 'alert' | 'celebrate'
export function renderCommanderRobot(machineState = 'idle') {
  const state = ['idle', 'happy', 'alert', 'celebrate'].includes(machineState)
    ? machineState
    : 'idle';

  const palette =
    state === 'alert'
      ? { glow: '#f43f5e', visor: '#fecdd3', eyeFill: '#fb7185', bodyAccent: '#f97316' }
      : state === 'celebrate'
      ? { glow: '#facc15', visor: '#fef08a', eyeFill: '#4ade80', bodyAccent: '#fbbf24' }
      : state === 'happy'
      ? { glow: '#22d3ee', visor: '#a5f3fc', eyeFill: '#38bdf8', bodyAccent: '#22c55e' }
      : { glow: '#38bdf8', visor: '#bae6fd', eyeFill: '#22d3ee', bodyAccent: '#38bdf8' };

  const eyeShape =
    state === 'happy' || state === 'celebrate'
      ? `
        <path class="robo-eye-happy" d="M23 30c1.4-2.5 4.2-2.5 5.6 0" fill="none" stroke="${palette.eyeFill}" stroke-width="2.8" stroke-linecap="round"/>
        <path class="robo-eye-happy" d="M35.4 30c1.4-2.5 4.2-2.5 5.6 0" fill="none" stroke="${palette.eyeFill}" stroke-width="2.8" stroke-linecap="round"/>
      `
      : state === 'alert'
      ? `
        <rect class="robo-eye" x="23" y="26.5" width="4.5" height="5.5" rx="2" fill="${palette.eyeFill}"/>
        <rect class="robo-eye" x="36.5" y="26.5" width="4.5" height="5.5" rx="2" fill="${palette.eyeFill}"/>
      `
      : `
        <ellipse class="robo-eye" cx="25.8" cy="29" rx="2.6" ry="3.2" fill="${palette.eyeFill}"/>
        <ellipse class="robo-eye" cx="38.2" cy="29" rx="2.6" ry="3.2" fill="${palette.eyeFill}"/>
      `;

  const mouth =
    state === 'alert'
      ? `<path d="M28 35.5 L36 35.5" stroke="${palette.visor}" stroke-width="2" stroke-linecap="round"/>`
      : `<path d="M27.5 34.5 Q32 38.5 36.5 34.5" stroke="${palette.visor}" stroke-width="2" fill="none" stroke-linecap="round"/>`;

  return `
    <svg class="commander-robot-svg is-${state}" data-rive-state="${state}" viewBox="0 0 64 64" width="58" height="58" aria-hidden="true">
      <defs>
        <linearGradient id="suitG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#cbd5e1"/>
        </linearGradient>
      </defs>
      <!-- Antenna -->
      <line x1="32" y1="6" x2="32" y2="14" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
      <circle class="robo-antenna" cx="32" cy="5.5" r="3.4" fill="${palette.glow}"/>
      <!-- Left Ear Pod -->
      <rect x="11" y="24" width="4.5" height="10" rx="2.2" fill="#38bdf8"/>
      <rect x="48.5" y="24" width="4.5" height="10" rx="2.2" fill="#38bdf8"/>
      <!-- Waving Right Arm -->
      <g class="robo-arm-wave">
        <path d="M46 46 Q56 41 56 31" fill="none" stroke="#e2e8f0" stroke-width="5.5" stroke-linecap="round"/>
        <circle cx="56" cy="30" r="3.5" fill="${palette.bodyAccent}"/>
      </g>
      <!-- Left Arm -->
      <path d="M18 46 Q11 49 11 54" fill="none" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round"/>
      <!-- Body Torso -->
      <rect x="20" y="42" width="24" height="16" rx="7" fill="url(#suitG)" stroke="#94a3b8" stroke-width="1.4"/>
      <rect x="27" y="46.5" width="10" height="6.5" rx="2" fill="#0f172a" stroke="${palette.glow}" stroke-width="1.2"/>
      <circle cx="32" cy="49.7" r="1.8" fill="${palette.glow}"/>
      <!-- Helmet Head -->
      <rect x="14.5" y="13" width="35" height="30" rx="14" fill="url(#suitG)" stroke="#94a3b8" stroke-width="1.5"/>
      <!-- Visor -->
      <rect x="18.5" y="19" width="27" height="20" rx="9" fill="#071124" stroke="${palette.glow}" stroke-width="1.8"/>
      ${eyeShape}
      ${mouth}
      <!-- Visor shine -->
      <path d="M22 22.5h5" stroke="rgba(255,255,255,0.45)" stroke-width="1.6" stroke-linecap="round"/>
    </svg>
  `;
}

