// NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information) educational feed module.
// Always provides verified offline snapshot records with explicit simulation vs scientific labels,
// zero API keys, and optional safe public-endpoint refresh that falls back silently if offline/blocked.

export const SPACE_WEATHER_SOURCE = {
  label: 'REAL_SCIENTIFIC_FACT',
  provider: 'NASA Community Coordinated Modeling Center (CCMC) — DONKI & SCaN',
  url: 'https://ccmc.gsfc.nasa.gov/tools/DONKI/',
  commsUrl: 'https://www.nasa.gov/directorates/somd/space-communications-navigation-program/',
  earthMoonDistanceKm: 384400,
  oneWayLightSec: 1.28,
  roundTripLightSec: 2.56,
  unitsNotice:
    'Gameplay percentages and wattage numbers are Training Simulation Units calibrated for 7-day classroom scenarios; real lunar constants below remain exact NASA references.',
};

export const OFFLINE_DONKI_EVENTS = [
  {
    id: 'DONKI-SEP-2026-01',
    eventType: 'SEP',
    title: 'Solar Energetic Particle Watch',
    severity: 'high',
    kpOrFluxLabel: 'Simulation Threshold: Moderate-High Proton Flux',
    summaryKid:
      'Active sunspot region released fast solar protons! On the Moon, crews move into storm shelters and verify Communications Relay beacons.',
    recommendedAction: 'Enter Storm Shelter, add Regolith Shielding, and verify Comms Dish alignment.',
    sourceNote: 'Offline NASA DONKI Educational Record (Zero-network fallback)',
    label: 'TRAINING_SIMULATION_RECORD',
  },
  {
    id: 'DONKI-CME-2026-02',
    eventType: 'CME',
    title: 'Coronal Mass Ejection Transit',
    severity: 'medium',
    kpOrFluxLabel: 'Simulation Transit Window: 18-36 hrs',
    summaryKid:
      'A glowing cloud of solar plasma is sweeping past Earth-Moon space. Thick Moon-soil walls and water bladders help block energetic particles.',
    recommendedAction: 'Pack Regolith Shield (+1 level) and balance battery reserves.',
    sourceNote: 'Offline NASA DONKI Educational Record (Zero-network fallback)',
    label: 'TRAINING_SIMULATION_RECORD',
  },
  {
    id: 'DONKI-FLR-2026-03',
    eventType: 'FLR',
    title: 'Radio Blackout R2 Brief Disturbance',
    severity: 'medium',
    kpOrFluxLabel: 'Simulation Signal Noise: +15% Packet Loss Risk',
    summaryKid:
      'An X-ray flare adds static to space radio waves across the 384,400 km gap to Earth. Aiming the high-gain dish keeps telemetry clear.',
    recommendedAction: 'Run Earth-Moon Signal Relay or tune Communications Relay power.',
    sourceNote: 'Offline NASA DONKI Educational Record (Zero-network fallback)',
    label: 'TRAINING_SIMULATION_RECORD',
  },
  {
    id: 'DONKI-GCR-2026-04',
    eventType: 'GCR',
    title: 'Quiet Sun • Steady Cosmic Ray Baseline',
    severity: 'low',
    kpOrFluxLabel: 'Simulation Baseline: Normal Polar Exposure',
    summaryKid:
      'Solar storms are quiet right now, so solar panels generate steady power while steady cosmic rays still reward thick habitat walls.',
    recommendedAction: 'Keep Lab and Greenhouse humming while collecting Research Points!',
    sourceNote: 'Offline NASA DONKI Educational Record (Zero-network fallback)',
    label: 'TRAINING_SIMULATION_RECORD',
  },
];

export function getSpaceWeatherAdvisory({ seed = 1, day = 1, activeEvents = [] } = {}) {
  const hasStorm = Array.isArray(activeEvents) && activeEvents.some((e) => e.eventId === 'solarStorm');
  if (hasStorm) {
    return OFFLINE_DONKI_EVENTS[0];
  }
  const index = Math.abs((Number(seed) || 1) + (Number(day) || 1)) % OFFLINE_DONKI_EVENTS.length;
  return OFFLINE_DONKI_EVENTS[index];
}

// Optional non-blocking fetch to NASA DONKI demo endpoint; always degrades safely to offline records.
export async function fetchOptionalDonkiSnapshot({ timeoutMs = 2500 } = {}) {
  if (typeof fetch !== 'function' || typeof AbortController !== 'function') {
    return { online: false, record: OFFLINE_DONKI_EVENTS[0], fallbackUsed: true };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(
      'https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/notifications?type=SEP',
      { signal: controller.signal }
    );
    if (!res.ok) {
      return { online: false, record: OFFLINE_DONKI_EVENTS[0], fallbackUsed: true };
    }
    const data = await res.json();
    const latest = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (!latest) {
      return { online: true, record: OFFLINE_DONKI_EVENTS[3], fallbackUsed: true };
    }
    return {
      online: true,
      fallbackUsed: false,
      record: {
        id: latest.messageID || 'DONKI-LIVE',
        eventType: latest.messageType || 'SEP',
        title: `NASA DONKI ${latest.messageType || 'Space Weather'} Notice`,
        severity: 'medium',
        kpOrFluxLabel: latest.messageIssueTime ? `Issued: ${latest.messageIssueTime.slice(0, 10)}` : 'Live CCMC Feed',
        summaryKid: String(latest.messageBody || '').slice(0, 180) || OFFLINE_DONKI_EVENTS[0].summaryKid,
        recommendedAction: 'Monitor radiation shielding and communications relay readiness.',
        sourceNote: 'Live NASA CCMC DONKI Public Notification',
        label: 'REAL_SCIENTIFIC_FACT',
      },
    };
  } catch (_) {
    return { online: false, record: OFFLINE_DONKI_EVENTS[0], fallbackUsed: true };
  } finally {
    clearTimeout(timer);
  }
}

