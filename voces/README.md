# Voces

Clips cortos que suenan en tres momentos del juego:

| evento   | cuándo suena                                  |
|----------|-----------------------------------------------|
| `muerte` | cada vez que el niño se cae o lo atrapan      |
| `tarde`  | cuando el reloj pasa las 8:00 y al llegar tarde |
| `gana`   | al llegar al colegio a tiempo                 |

Cada vez se elige uno al azar, sin repetir el último. Mientras suena una voz,
la música baja sola. Con el sonido apagado (tecla M o menú) no suenan.

## Cambiar las voces

1. Graba cada frase por separado: **menos de 2 segundos**, sin silencio al
   inicio ni al final, volumen parejo.
2. Guárdalas en esta carpeta en **.m4a (AAC)** (funciona en iPhone, Android y
   PC). También sirven `.mp3`. Evita `.ogg` (Safari no lo lee).
3. Nómbralas `evento-N.m4a` (p. ej. `muerte-5.m4a`) y agrégalas a la lista del
   evento en `manifest.js`. Para quitar una, bórrala de la lista.

Si un archivo de la lista falta o no se puede leer, ese clip no suena y el
juego sigue igual.

Convertir desde la Mac: `afconvert -f m4af -d aac grabacion.wav muerte-5.m4a`

Los clips actuales son de **prueba** (voz sintética "Paulina" de macOS).
