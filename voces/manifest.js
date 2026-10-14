// voces/manifest.js — qué clips suenan en cada evento (ver voces/README.md).
// Rutas relativas a voces/. Se elige uno al azar sin repetir el último.
const VOICE_MANIFEST = {
  muerte: ['muerte-1.m4a', 'muerte-2.m4a', 'muerte-3.m4a', 'muerte-4.m4a'],   // al morir
  tarde:  ['tarde-1.m4a', 'tarde-2.m4a'],                     // el reloj pasa las 8:00 o llegas tarde
  gana:   ['gana-2.m4a'],                                     // llegas a tiempo
  egreso: ['egreso-1.m4a'],                                   // el final de egreso (Cap. 3); vacío: suena 'gana'
  sube:   ['cobrador-1.m4a'],                                 // el cobrador cuando te subes a la combi (Cap. 2)
  baja:   ['cobrador-2.m4a'],                                 // el cobrador cuando te bajas
  ambulante: ['ambulante.m4a'],                               // megáfono en bucle del Centro (VOICE.ambient)
};

// Lo que dice cada voz de muerte: se muestra como título al morir, para que
// coincida con lo que se oye. Si cambias una grabación, cambia su texto aquí.
const VOICE_TEXT = {
  'muerte-1.m4a': '¡QUÉ PIÑA, CAUSA!',
  'muerte-2.m4a': '¡AY, MAMITA!',
  'muerte-3.m4a': '¡ACHACHÁU, QUÉ ROCHE!',
  'muerte-4.m4a': '¡ASU MARE!',
};
