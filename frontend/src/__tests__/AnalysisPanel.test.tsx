import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AnalysisPanel from '../components/AnalysisPanel'

describe('AnalysisPanel', () => {
  it('renders no analysis message when result is null', () => {
    render(<AnalysisPanel result={null} />)

    expect(screen.getByText(/Нажмите "Анализировать план"/i)).toBeInTheDocument()
  })

  it('displays legal status when analysis is complete', () => {
    const mockResult = {
      isLegal: true,
      requiresApproval: false,
      warnings: [],
      recommendations: ['Test recommendation'],
      estimatedApprovalTime: 'Not required',
      estimatedCost: '0 руб.',
    }

    render(<AnalysisPanel result={mockResult} />)

    expect(screen.getByText(/План соответствует законодательству/i)).toBeInTheDocument()
  })

  it('displays warnings when present', () => {
    const mockResult = {
      isLegal: true,
      requiresApproval: true,
      warnings: [
        {
          level: 'high',
          title: 'Test Warning',
          description: 'Warning description',
          law: 'Test Law',
          recommendations: ['Fix this'],
          actionRequired: true,
        },
      ],
      recommendations: [],
      estimatedApprovalTime: '1-3 months',
      estimatedCost: '25,000-50,000 руб.',
    }

    render(<AnalysisPanel result={mockResult} />)

    expect(screen.getByText('Test Warning')).toBeInTheDocument()
    expect(screen.getByText('Warning description')).toBeInTheDocument()
  })

  it('displays critical warning for illegal plan', () => {
    const mockResult = {
      isLegal: false,
      requiresApproval: true,
      warnings: [
        {
          level: 'critical',
          title: 'Critical Issue',
          description: 'This is not allowed',
          law: 'Test Law',
          recommendations: [],
          actionRequired: true,
        },
      ],
      recommendations: [],
      estimatedApprovalTime: '3-6 months',
      estimatedCost: '50,000-150,000 руб.',
    }

    render(<AnalysisPanel result={mockResult} />)

    expect(screen.getByText(/План не соответствует законодательству/i)).toBeInTheDocument()
    expect(screen.getByText('Critical Issue')).toBeInTheDocument()
  })

  it('displays recommendations', () => {
    const mockResult = {
      isLegal: true,
      requiresApproval: true,
      warnings: [],
      recommendations: [
        'Recommendation 1',
        'Recommendation 2',
      ],
      estimatedApprovalTime: '1-3 months',
      estimatedCost: '25,000-50,000 руб.',
    }

    render(<AnalysisPanel result={mockResult} />)

    expect(screen.getByText('Recommendation 1')).toBeInTheDocument()
    expect(screen.getByText('Recommendation 2')).toBeInTheDocument()
  })

  it('displays estimated time and cost', () => {
    const mockResult = {
      isLegal: true,
      requiresApproval: true,
      warnings: [],
      recommendations: [],
      estimatedApprovalTime: '1-3 месяца',
      estimatedCost: '25,000-50,000 руб.',
    }

    render(<AnalysisPanel result={mockResult} />)

    expect(screen.getByText(/1-3 месяца/i)).toBeInTheDocument()
    expect(screen.getByText(/25,000-50,000 руб/i)).toBeInTheDocument()
  })
})
