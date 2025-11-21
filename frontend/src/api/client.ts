import axios from 'axios';
import { RenovationPlan, AnalysisResult } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  analyzeRenovation: async (plan: RenovationPlan): Promise<AnalysisResult> => {
    const response = await apiClient.post<AnalysisResult>('/api/analyze', plan);
    return response.data;
  },

  getRules: async () => {
    const response = await apiClient.get('/api/rules');
    return response.data;
  },

  getRuleCategory: async (category: string) => {
    const response = await apiClient.get(`/api/rules/${category}`);
    return response.data;
  },

  quickCheck: async (action: any) => {
    const response = await apiClient.post('/api/quick-check', action);
    return response.data;
  },
};
