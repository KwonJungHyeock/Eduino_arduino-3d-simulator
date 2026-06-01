import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { useSimulatorStore } from '../store/useSimulatorStore'

// Unmount React trees and reset the global store between tests so each test
// starts from a clean, isolated state.
afterEach(() => {
  cleanup()
  useSimulatorStore.getState().reset()
})
