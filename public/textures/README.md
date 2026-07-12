# Board textures

Drop a **real top-down photo** of an Arduino Uno here as:

    uno-top.png

and the app uses it automatically for the PCB surface (no code changes) —
replacing the procedural silkscreen. If the file is absent, the procedural
art is used.

## Photo tips for the best result
- Shoot **straight down** (perpendicular), board filling the frame, evenly lit,
  no glare or perspective skew.
- Crop tightly to the PCB edges; a square-ish 2048×1568-ish PNG works well.
- The board's pin headers should be clearly visible — clickable pins are placed
  from `src/domain/board.ts`; if they don't line up with the photo, we fine-tune
  those coordinates to match.

## Licensing
This is a commercial product, so only use an image you have the rights to:
your own photo, a CC0 image, or a properly licensed one.
