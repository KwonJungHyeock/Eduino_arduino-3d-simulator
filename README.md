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
    Toolbar.tsx           # overlay UI; reads/dispatches store actions
  store/
    useSimulatorStore.ts  # zustand store; DynamoDB-serializable snapshot
  App.tsx                 # app shell (canvas + overlays)
  main.tsx                # entry point
```

### State model (`useSimulatorStore`)

The store separates a serializable `SimulatorSnapshot` (`pinStates`, `wires`,
`isRunning`) from the actions (`toggleSimulation`, `setPinState`, `addWire`,
`removeWire`, `loadSnapshot`, `reset`). The snapshot is exactly what gets saved
to DynamoDB.

## Scripts

```bash
npm install     # install dependencies
npm run dev     # start the Vite dev server
npm run build   # type-check (tsc -b) + production build
npm run preview # preview the production build
```
