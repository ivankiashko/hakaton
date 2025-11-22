import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ApartmentSettings from '../components/ApartmentSettings'

describe('ApartmentSettings', () => {
  const mockSettings = {
    buildingType: 'panel' as const,
    floor: 5,
    totalFloors: 9,
    hasGas: false,
  }

  const mockOnChange = vi.fn()

  it('renders apartment settings form', () => {
    render(<ApartmentSettings settings={mockSettings} onChange={mockOnChange} />)

    expect(screen.getByText(/Настройки квартиры/i)).toBeInTheDocument()
  })

  it('displays current building type', () => {
    render(<ApartmentSettings settings={mockSettings} onChange={mockOnChange} />)

    const select = screen.getByRole('combobox', { name: /тип дома/i })
    expect(select).toHaveValue('panel')
  })

  it('calls onChange when building type changes', () => {
    render(<ApartmentSettings settings={mockSettings} onChange={mockOnChange} />)

    const select = screen.getByRole('combobox', { name: /тип дома/i })
    fireEvent.change(select, { target: { value: 'brick' } })

    expect(mockOnChange).toHaveBeenCalledWith({
      ...mockSettings,
      buildingType: 'brick',
    })
  })

  it('displays floor information', () => {
    render(<ApartmentSettings settings={mockSettings} onChange={mockOnChange} />)

    expect(screen.getByDisplayValue('5')).toBeInTheDocument()
    expect(screen.getByDisplayValue('9')).toBeInTheDocument()
  })

  it('displays gas supply checkbox', () => {
    render(<ApartmentSettings settings={mockSettings} onChange={mockOnChange} />)

    const checkbox = screen.getByRole('checkbox', { name: /наличие газа/i })
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).not.toBeChecked()
  })

  it('calls onChange when gas checkbox changes', () => {
    render(<ApartmentSettings settings={mockSettings} onChange={mockOnChange} />)

    const checkbox = screen.getByRole('checkbox', { name: /наличие газа/i })
    fireEvent.click(checkbox)

    expect(mockOnChange).toHaveBeenCalledWith({
      ...mockSettings,
      hasGas: true,
    })
  })
})
