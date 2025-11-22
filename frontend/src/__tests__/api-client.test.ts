import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { analyzePlan, getRules, getDocumentTypes } from '../api/client'

vi.mock('axios')

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('analyzePlan', () => {
    it('should send plan data to analyze endpoint', async () => {
      const mockPlan = {
        originalPlan: {
          walls: [],
          doors: [],
          windows: [],
          rooms: [],
          hasGasSupply: false,
          floor: 5,
          totalFloors: 9,
          buildingType: 'panel',
        },
        actions: [],
        description: 'Test plan',
      }

      const mockResponse = {
        data: {
          isLegal: true,
          requiresApproval: false,
          warnings: [],
          recommendations: [],
          estimatedApprovalTime: 'Not required',
          estimatedCost: '0',
        },
      }

      vi.mocked(axios.post).mockResolvedValue(mockResponse)

      const result = await analyzePlan(mockPlan)

      expect(axios.post).toHaveBeenCalledWith('/api/analyze', mockPlan)
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle API errors', async () => {
      const mockPlan = {
        originalPlan: {
          walls: [],
          doors: [],
          windows: [],
          rooms: [],
          hasGasSupply: false,
          floor: 5,
          totalFloors: 9,
          buildingType: 'panel',
        },
        actions: [],
        description: 'Test plan',
      }

      vi.mocked(axios.post).mockRejectedValue(new Error('API Error'))

      await expect(analyzePlan(mockPlan)).rejects.toThrow('API Error')
    })
  })

  describe('getRules', () => {
    it('should fetch rules from API', async () => {
      const mockRules = {
        rules: {
          loadBearingWalls: {
            name: 'Несущие стены',
            law: 'ЖК РФ ст. 26',
            requirements: [],
          },
        },
      }

      vi.mocked(axios.get).mockResolvedValue({ data: mockRules })

      const result = await getRules()

      expect(axios.get).toHaveBeenCalledWith('/api/rules')
      expect(result).toEqual(mockRules)
    })
  })

  describe('getDocumentTypes', () => {
    it('should fetch document types from API', async () => {
      const mockDocTypes = {
        document_types: [
          {
            id: 'application',
            name: 'Заявление на перепланировку',
            description: 'Test description',
            requires_analysis: true,
          },
        ],
      }

      vi.mocked(axios.get).mockResolvedValue({ data: mockDocTypes })

      const result = await getDocumentTypes()

      expect(axios.get).toHaveBeenCalledWith('/api/document-types')
      expect(result).toEqual(mockDocTypes)
    })
  })
})
