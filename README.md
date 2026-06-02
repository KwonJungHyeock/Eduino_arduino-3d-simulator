# Eduino · 3D Arduino & AIoT Sensor Simulator

A browser-based educational simulator for placing, wiring, and programming
Arduino boards and sensors in 3D — no physical hardware required. Beyond basic
teaching kits, it targets advanced time-series AIoT sensors (ECG, FSR, …) with
virtual data feeding and simulation.

## Design principles

- **100% client-side compute.** All 3D rendering and (future) firmware
  emulation run on the user's GPU/CPU in the browser. This keeps the planned
  AWS Serverless backend (S3 + CloudFront + Lambda + DynamoDB) cheap to operate.
- **Serializable state.** The workspace state is a plain JSON document so it can
  be persisted directly to DynamoDB and rehydrated on load.

## Tech stack

| Concern         | Choice                                          |
| --------------- | ----------------------------------------------- |
| Build / tooling | Vite + React + TypeScript                       |
| Styling         | Tailwind CSS                                     |
| 3D graphics     | Three.js via `@react-three/fiber` + `@react-three/drei` |
| State           | `zustand` (unidirectional flow)                 |
| Emulation (planned) | Wokwi `avr8js` (reference engine)           |

## Project structure

```
src/
  components/
    SimulatorCanvas.tsx   # react-three-fiber 3D workspace (client GPU)
    ArduinoBoard.tsx      # Arduino Uno board + clickable pin headers
    Wires.tsx             # curved cables rendered between connected pins
    Toolbar.tsx           # overlay UI; reads/dispatches store actions
  domain/
    board.ts              # static Arduino Uno pin layout + position/label lookups
    wiring.ts             # pure click-to-connect logic (color, dedupe, resolve)
  store/
    useSimulatorStore.ts  # zustand store; DynamoDB-serializable snapshot
  App.tsx                 # app shell (canvas + overlays)
  main.tsx                # entry point
```

## Wiring (click-to-connect)

The first feature of the simulator UX. Pins are rendered as interactive headers
on the board:

1. Click a pin — it becomes the pending connection (highlighted amber).
2. Click a second pin — a colored wire is drawn between them and stored in
   `wires`. Clicking the same pin again, or empty space, cancels.

Duplicate connections between the same pair are ignored, and each wire gets the
next color from a rotating palette. The pure decision logic lives in
`domain/wiring.ts` (fully unit-tested); the store's `selectPin` action applies
it, keeping the 3D scene a pure function of store state. The transient
`pendingPinId` is deliberately excluded from `SimulatorSnapshot`, so it is never
persisted to DynamoDB.

### State model (`useSimulatorStore`)

The store separates a serializable `SimulatorSnapshot` (`pinStates`, `wires`,
`isRunning`) from the actions (`toggleSimulation`, `setPinState`, `addWire`,
`removeWire`, `loadSnapshot`, `reset`). The snapshot is exactly what gets saved
to DynamoDB.

## Scripts

```bash
npm install      # install dependencies
npm run dev      # start the Vite dev server
npm run build    # type-check (tsc -b) + production build
npm run preview  # preview the production build
npm test         # run the test suite once (Vitest)
npm run test:watch  # run tests in watch mode
npm run test:ui     # run tests with the Vitest UI
```

## Testing

Tests use [Vitest](https://vitest.dev/) with a `jsdom` environment and
[Testing Library](https://testing-library.com/).

- `src/store/useSimulatorStore.test.ts` — covers every store action (incl.
  click-to-connect wiring) plus a JSON serialize/deserialize round-trip that
  mirrors persisting to DynamoDB.
- `src/domain/board.test.ts` — validates the Arduino Uno pin layout and lookups.
- `src/domain/wiring.test.ts` — covers the pure wiring logic (color cycling,
  dedupe, click resolution).
- `src/components/Toolbar.test.tsx` — renders the overlay UI and asserts it
  reads from and dispatches to the store (the unidirectional data flow).

The global store is reset between tests via `src/test/setup.ts`.
