// input.js — teclado, gamepad y táctil. Incluye INPUT BUFFER para el salto.
const Input = (() => {
  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    Space: 'jump', KeyZ: 'jump', KeyX: 'jump', KeyJ: 'jump', KeyK: 'jump',
    Enter: 'confirm', NumpadEnter: 'confirm',
    Escape: 'pause', KeyP: 'pause',
    KeyM: 'mute', KeyR: 'restart',
  };
  const JUMP_BUF = 8;   // frames de buffer de salto
  const sources = [ {}, {}, {} ]; // 0 teclado, 1 táctil, 2 gamepad
  const down = {}, pressed = {}, released = {};
  let jumpBuffer = 0;
  let anyPressedFlag = false;

  function edge(action) {
    let v = false;
    for (const s of sources) if (s[action]) { v = true; break; }
    if (v && !down[action]) { pressed[action] = true; anyPressedFlag = true; }
    if (!v && down[action]) released[action] = true;
    down[action] = v;
  }
  function set(src, action, val) { if (!action) return; sources[src][action] = !!val; edge(action); }

  window.addEventListener('keydown', (e) => {
    const a = KEYMAP[e.code];
    if (!a) return;
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    set(0, a, true);
    AUDIO.resume();
  });
  window.addEventListener('keyup', (e) => { const a = KEYMAP[e.code]; if (a) set(0, a, false); });
  window.addEventListener('blur', () => { for (const k in KEYMAP) set(0, KEYMAP[k], false); set(2, 'jump', false); set(2, 'left', false); set(2, 'right', false); set(2, 'down', false); });

  // táctil
  function wireTouch() {
    const map = { tLeft: 'left', tRight: 'right', tDown: 'down', tJump: 'jump' };
    for (const id in map) {
      const el = document.getElementById(id);
      if (!el) continue;
      const a = map[id];
      const on = (e) => { e.preventDefault(); set(1, a, true); AUDIO.resume(); };
      const off = (e) => { e.preventDefault(); set(1, a, false); };
      el.addEventListener('touchstart', on, { passive: false });
      el.addEventListener('touchend', off, { passive: false });
      el.addEventListener('touchcancel', off, { passive: false });
      el.addEventListener('mousedown', on);
      el.addEventListener('mouseup', off);
      el.addEventListener('mouseleave', off);
    }
  }

  let lastAxes = { l: false, r: false, u: false, d: false };
  function pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null;
    for (const p of pads) if (p && p.connected) { gp = p; break; }
    if (!gp) {
      if (lastAxes.l) { set(2, 'left', false); lastAxes.l = false; }
      if (lastAxes.r) { set(2, 'right', false); lastAxes.r = false; }
      if (lastAxes.u) { set(2, 'up', false); lastAxes.u = false; }
      if (lastAxes.d) { set(2, 'down', false); lastAxes.d = false; }
      return;
    }
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    const btn = (i) => gp.buttons[i] && gp.buttons[i].pressed;
    const L = ax < -0.4 || btn(14), R = ax > 0.4 || btn(15);
    const U = ay < -0.4 || btn(12), D = ay > 0.4 || btn(13);
    const J = btn(0) || btn(1);
    if (L !== lastAxes.l) { set(2, 'left', L); lastAxes.l = L; }
    if (R !== lastAxes.r) { set(2, 'right', R); lastAxes.r = R; }
    if (U !== lastAxes.u) { set(2, 'up', U); lastAxes.u = U; }
    if (D !== lastAxes.d) { set(2, 'down', D); lastAxes.d = D; }
    set(2, 'jump', J);
    set(2, 'confirm', J);
    set(2, 'pause', btn(9));
  }

  function update() {
    pollGamepad();
    // la flecha arriba (o W) también salta, además de Espacio/Z/X
    if (pressed['jump'] || pressed['up']) jumpBuffer = JUMP_BUF;
    else if (jumpBuffer > 0) jumpBuffer--;
  }
  function endFrame() {
    for (const k in pressed) pressed[k] = false;
    for (const k in released) released[k] = false;
    anyPressedFlag = false;
  }
  function consumeJump() { if (jumpBuffer > 0) { jumpBuffer = 0; return true; } return false; }
  function clearJump() { jumpBuffer = 0; }

  return {
    update, endFrame, wireTouch, consumeJump, clearJump,
    held: (a) => !!down[a],
    pressed: (a) => !!pressed[a],
    released: (a) => !!released[a],
    anyPressed: () => anyPressedFlag,
    jumpBuffered: () => jumpBuffer > 0,
  };
})();
