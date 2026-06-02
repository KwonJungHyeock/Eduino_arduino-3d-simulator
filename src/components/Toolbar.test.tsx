import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Toolbar from './Toolbar'
import { useSimulatorStore } from '../store/useSimulatorStore'

describe('<Toolbar />', () => {
  it('renders the idle state by default', () => {
    render(<Toolbar />)
    expect(screen.getByText('3D Arduino Simulator')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Run Simulation/i })).toBeInTheDocument()
    expect(screen.getByText('Idle')).toBeInTheDocument()
    expect(screen.getByText('Wires: 0')).toBeInTheDocument()
  })

  it('toggles the simulation state when the button is clicked', async () => {
    const user = userEvent.setup()
    render(<Toolbar />)

    await user.click(screen.getByRole('button', { name: /Run Simulation/i }))

    expect(useSimulatorStore.getState().isRunning).toBe(true)
    expect(screen.getByRole('button', { name: /Stop Simulation/i })).toBeInTheDocument()
    expect(screen.getByText('Running')).toBeInTheDocument()
  })

  it('reflects the live wire count from the store', () => {
    useSimulatorStore.getState().addWire({
      id: 'wire-1',
      startPinId: 'arduino-uno:D13',
      endPinId: 'led-1:anode',
      color: '#ff0000',
    })
    render(<Toolbar />)
    expect(screen.getByText('Wires: 1')).toBeInTheDocument()
  })

  it('shows the pending pin label while wiring is in progress', () => {
    useSimulatorStore.getState().selectPin('arduino-uno:D13')
    render(<Toolbar />)
    expect(screen.getByText('D13')).toBeInTheDocument()
    expect(screen.getByText(/click another pin/i)).toBeInTheDocument()
  })

  it('clears all wires via the Clear Wires button', async () => {
    const user = userEvent.setup()
    useSimulatorStore.getState().selectPin('arduino-uno:D13')
    useSimulatorStore.getState().selectPin('arduino-uno:A0')
    render(<Toolbar />)

    expect(screen.getByText('Wires: 1')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Clear Wires/i }))

    expect(useSimulatorStore.getState().wires).toHaveLength(0)
    expect(screen.getByText('Wires: 0')).toBeInTheDocument()
  })

  it('disables Clear Wires when there are no wires', () => {
    render(<Toolbar />)
    expect(screen.getByRole('button', { name: /Clear Wires/i })).toBeDisabled()
  })
})
