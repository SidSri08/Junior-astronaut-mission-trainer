import { TRAINING_TASKS } from '../data/trainingTasks.js';
import { commanderLevel } from '../systems/ProgressionSystem.js';
import { SOUNDS } from './soundFx.js';
import { renderCommanderRobot } from './icons.js';

const CHAPTERS = {
  approach: { title: 'A new home, far from home', lines: [
    ['MISSION CONTROL', 'Commander, we are approaching the Moon. Four astronauts are counting on you.'],
    ['NOVA', 'Hi! I’m Nova, your lunar assistant. We’ll build a safe home, solve problems, and learn together.'],
    ['COMMANDER', 'Crew ready. Let’s bring our ship down safely.'],
  ], action: 'Begin lunar approach' },
  inspection: { title: 'First base inspection', lines: [
    ['NOVA', 'Touchdown! Every building has a job. The habitat protects us, and life support keeps our air and water moving.'],
    ['CREW ENGINEER', 'Commander, the hull sensor has found an air leak. Can you help us patch it?'],
    ['NOVA', 'Follow the scanner signal. We can practice before the countdown starts. Mistakes are a chance to learn.'],
  ], action: 'Inspect the oxygen system', task: 'leakHunter' },
  sustainable: { title: 'A settlement that works together', lines: [
    ['NOVA', 'Good work. Now the bigger challenge: power, air, water, and food all depend on each other.'],
    ['MISSION CONTROL', 'Complete five scenario runs before the journey home. A whole scenario counts as one run, even when some repairs need more work.'],
    ['NOVA', 'Open Missions for your next scenario, or try the workshops in Training Games. Your results change our real base reserves.'],
  ], action: 'Take command of the base' },
  storm: { title: 'A warning from the Sun', lines: [
    ['MISSION CONTROL', 'Training alert: prepare the crew shelter and protect essential equipment.'],
    ['NOVA', 'Stay calm, Commander. Shielding reduces risk. Let’s keep the crew protected while we check communications.'],
  ], action: 'Prepare for the storm scenario' },
  homeward: { title: 'One final run', lines: [
    ['CREW ENGINEER', 'The return ship is ready. We have one scenario left before packing the outpost.'],
    ['NOVA', 'Every decision comes home with us: the samples we studied, the supplies we saved, and the lessons we learned.'],
  ], action: 'Finish our fifth mission run' },
};

export function mountMissionDesk({ root, store, openMinigame, onArrival }) {
  const nav = document.createElement('nav');
  nav.className = 'mission-navigation';
  nav.setAttribute('aria-label', 'Commander navigation');
  nav.innerHTML = `<div class="commander-profile" id="commander-profile"></div><div class="mission-nav-buttons">${[['base','⌂','Your Base'],['training','🎮','Training Games'],['missions','◎','Missions'],['learn','▤','Learn'],['collection','✦','Collection']].map(([id, icon, label]) => `<button type="button" class="mission-nav-button ${id === 'base' ? 'is-active' : ''}" data-destination="${id}"><span aria-hidden="true">${icon}</span>${label}</button>`).join('')}</div>`;
  root.querySelector('.hud-left-card').prepend(nav);
  const overlay = document.createElement('div');
  overlay.className = 'mission-desk-overlay'; overlay.hidden = true;
  overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-label', 'Commander mission desk');
  document.body.appendChild(overlay);
  let page = null, chapter = null, line = 0, previousFocus = null, pending = false;

  function close() {
    page = null; chapter = null; overlay.hidden = true; root.inert = false;
    nav.querySelectorAll('[data-destination]').forEach((button) => button.classList.toggle('is-active', button.dataset.destination === 'base'));
    store.dispatch({ type: 'setDeskOpen', open: false });
    previousFocus?.focus?.();
  }
  function open(destination) {
    previousFocus = document.activeElement;
    page = destination; overlay.hidden = false; root.inert = true;
    store.dispatch({ type: 'setDeskOpen', open: true }); render();
    overlay.querySelector('button')?.focus();
  }
  function showChapter(id) {
    chapter = id; line = 0;
    store.dispatch({ type: 'markStorySeen', chapter: id });
    open('story');
  }
  function render() {
    if (!page) return;
    const s = store.getState(), p = s.progression;
    if (page === 'story') {
      const def = CHAPTERS[chapter], [speaker, text] = def.lines[line];
      overlay.innerHTML = `<section class="mission-desk-card story-card"><span class="mission-eyebrow">LUNAR EXPEDITION · ${String(line + 1).padStart(2, '0')} / ${def.lines.length}</span><h2>${def.title}</h2><div class="story-dialogue"><div class="story-portrait">${renderCommanderRobot(speaker === 'NOVA' ? 'happy' : 'idle')}</div><div><span class="story-speaker">${speaker}</span><p role="status">${text}</p></div></div><div class="mission-desk-actions"><button class="btn btn-ghost" id="story-skip">Skip dialogue</button><button class="btn btn-primary" id="story-next">${line < def.lines.length - 1 ? 'Continue →' : def.action}</button></div></section>`;
      const finish = () => {
        const id = chapter; close();
        if (id === 'approach') onArrival();
        else if (def.task) openMinigame(def.task);
      };
      overlay.querySelector('#story-next').addEventListener('click', () => { SOUNDS.click(); if (++line < def.lines.length) { render(); overlay.querySelector('#story-next')?.focus(); } else finish(); });
      overlay.querySelector('#story-skip').addEventListener('click', finish);
      return;
    }
    overlay.innerHTML = `<section class="mission-desk-card"><header class="mission-desk-heading"><div><span class="mission-eyebrow">ARTEMIS · COMMANDER LEVEL ${commanderLevel(p?.xp)}</span><h2>${page === 'training' ? 'Training Games' : 'Your mission collection'}</h2></div><button class="btn btn-ghost" id="desk-close" aria-label="Close mission desk">✕ Back to base</button></header>${page === 'training' ? `<p>Choose a real task. Practice first, then apply your result to the base. Workshops earn XP but do not count as campaign runs.</p><div class="training-task-grid">${TRAINING_TASKS.map((task, i) => { const record = p?.taskRecords[task.id]; return `<article class="training-task-card"><div class="training-task-art art-${task.module}" aria-hidden="true"><span>${task.icon}</span><small>STATION ${String(i + 1).padStart(2, '0')}</small></div><div class="training-task-info"><h3>${task.title}</h3><p>${task.mechanic}</p><small>${task.reward}</small><div class="training-task-footer"><span aria-label="${record?.bestStars || 0} best stars">${'★'.repeat(record?.bestStars || 0)}${'☆'.repeat(3 - (record?.bestStars || 0))}</span><button class="btn btn-primary" data-launch-task="${task.id}">${record ? 'Play again' : 'Begin task'} →</button></div></div></article>`; }).join('')}</div>` : `<div class="collection-summary"><div><strong>${p?.xp || 0}</strong><span>Earned XP</span></div><div><strong>${p?.stars || 0}</strong><span>Mission stars</span></div><div><strong>${Object.keys(p?.taskRecords || {}).length}/13</strong><span>Tasks explored</span></div></div><h3>Expedition patches</h3><div class="collection-patches">${[['trailblazer','🛞','Trailblazer','Return all rover samples'],['lunar-geologist','🔬','Lunar Geologist','Classify all lab samples']].map(([id, icon, title, hint]) => `<article class="collection-patch ${p?.discoveries?.includes(id) ? 'is-earned' : ''}"><span>${icon}</span><h3>${title}</h3><p>${p?.discoveries?.includes(id) ? '✓ Earned through your work' : hint}</p></article>`).join('')}</div><h3>Task logbook</h3><div class="collection-log">${TRAINING_TASKS.filter((task) => p?.taskRecords[task.id]).map((task) => `<p>${task.icon} <strong>${task.title}</strong> · ${p.taskRecords[task.id].attempts} attempt(s) · ${'★'.repeat(p.taskRecords[task.id].bestStars)}${'☆'.repeat(3 - p.taskRecords[task.id].bestStars)}</p>`).join('') || '<p>Your logbook is ready. Complete a training task to earn your first entry.</p>'}</div><button class="btn btn-primary" id="collection-train">Explore Training Games →</button>`}<p class="task-sim-note">Training simulation units · No live network or account required.</p></section>`;
    overlay.querySelector('#desk-close')?.addEventListener('click', close);
    overlay.querySelector('#collection-train')?.addEventListener('click', () => { page = 'training'; render(); });
    overlay.querySelectorAll('[data-launch-task]').forEach((button) => button.addEventListener('click', () => { const id = button.dataset.launchTask; close(); openMinigame(id); }));
  }
  nav.querySelectorAll('[data-destination]').forEach((button) => button.addEventListener('click', () => {
    const destination = button.dataset.destination; SOUNDS.click();
    nav.querySelectorAll('[data-destination]').forEach((b) => b.classList.toggle('is-active', b === button));
    if (destination === 'training' || destination === 'collection') open(destination);
    else if (destination === 'missions') root.querySelector('#btn-campaign').click();
    else if (destination === 'learn') root.querySelector('#btn-guide').click();
    else root.querySelector('#btn-cam-overview').click();
  }));
  const onKey = (event) => {
    if (overlay.hidden) return;
    event.stopPropagation();
    if (event.key === 'Escape' && page !== 'story') { event.preventDefault(); close(); return; }
    if (event.key !== 'Tab') return;
    const buttons = [...overlay.querySelectorAll('button:not([disabled])')];
    const first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  overlay.addEventListener('keydown', onKey);
  function update(s) {
    const xp = s.progression?.xp || 0;
    nav.querySelector('#commander-profile').innerHTML = `<span class="commander-avatar" aria-hidden="true">👩‍🚀</span><div><strong>Commander <span>Lv. ${commanderLevel(xp)}</span></strong><small>${xp} XP · ${s.progression?.stars || 0} stars</small><progress max="150" value="${xp % 150}" aria-label="Progress to next commander level"></progress></div>`;
    if (page || pending || s.mission.status !== 'running' || s.mission.inMinigame || s.pendingDecision || s.cinematics?.active !== 'none' || !s.cinematics?.landingSeen) return;
    const seen = s.story?.seen || [], runs = s.campaign?.completedRuns || 0;
    const next = !seen.includes('inspection') ? 'inspection' : !seen.includes('sustainable') && (s.progression?.taskRecords?.leakHunter || runs >= 1) ? 'sustainable' : runs >= 4 && !seen.includes('homeward') ? 'homeward' : runs >= 2 && !seen.includes('storm') ? 'storm' : null;
    if (next && !s.campaign?.endingTriggered) { pending = true; queueMicrotask(() => { pending = false; if (!page && !store.getState().mission.inMinigame) showChapter(next); }); }
  }
  const unsubscribe = store.subscribe(update); update(store.getState());
  return {
    startIntro() { store.dispatch({ type: 'finishTutorial' }); store.dispatch({ type: 'startMission' }); showChapter('approach'); },
    destroy() { unsubscribe(); overlay.remove(); nav.remove(); },
  };
}
