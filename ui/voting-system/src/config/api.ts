import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Типы для API
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  isLegal: boolean;
}

export interface AuthResponse {
  accessToken: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  isLegal: boolean;
}

export type VotingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'FINISHED';

export type Permission = 'APPROVED' | 'PENDING' | 'REJECTED' | 'CREATOR' | 'USED';

export interface VotingFilter {
  approvedForWatching?: boolean;
  approvedForVoting?: boolean;
  status?: VotingStatus;
}

export interface Answer {
  id: string;
  description: string;
}

export interface Voting {
  id: string;
  name: string;
  description: string;
  question: string;
  answers: Answer[];
  startDate: number;
  endDate: number;
  creatorId: string;
  status: VotingStatus;
  votePermission?: Permission;
  watchPermission?: Permission;
}

export interface VoteRequest {
  answerId: string;
  encryptedVote: string;
  zeroKnowledgeProof: string;
  signature: string;
}

export interface CreateVotingRequest {
  name: string;
  description: string;
  question: string;
  answers: string[];
  startDate: number;
  endDate: number;
}

export interface WatchOrVoteRequest {
  permissionId: string;
  voteId: string;
  voteName: string;
  userId: string;
  userName: string;
  userEmail: string;
  requestDate: number;
}

export interface AnswerForWatchOrVoteRequest {
  permissionId: string;
  approve: boolean;
}

export type PermissionRequestStatus = 'NOT_REQUESTED' | 'CREATOR' | 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'USED';

export interface PermissionRequestStatusResponse {
  status: PermissionRequestStatus;
}

export interface PublicKeyResponse {
  publicKey: string;
}

export interface SignRequest {
  blindedPublicKey: string;
}

export interface SignResponse {
  blindSignature: string;
}

export interface ZeroKnowledgeProofResponse {
  zeroKnowledgeProof: string;
}

export interface CheckVoteRequest {
  voteToken: string;
}

export interface CheckVoteResponse {
  voteId: string;
  userId: string;
  voteToken: string;
  encryptedVote: string;
  zeroKnowledgeProof: string;
  timestamp: number;
  blockHash: string;
}

export interface CheckVotingResultsResponse {
  status: VotingStatus;
  voteId: string;
  voteName: string;
  results: Record<string, string>;
}

// Конфигурация API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const createApi = (): AxiosInstance => {
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return api;
};

const api = createApi();

// API методы
export const authApi = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/api/v1/login', data),
  register: (data: RegisterRequest) => api.post<AuthResponse>('/auth/api/v1/register', data),
  getMe: () => api.get<User>('/auth/api/v1/me'),
};

export const votingApi = {
  // Управление голосованиями
  getMyVotings: () => api.get<Voting[]>('/voting/api/v1/my/votings'),
  getMyVoting: (id: string) => api.get<Voting>(`/voting/api/v1/my/votings/${id}`),
  createVoting: (data: CreateVotingRequest) => api.post<Voting>('/voting/api/v1/my/votings', data),
  editMyVoting: (id: string, data: CreateVotingRequest) => api.put<Voting>(`/voting/api/v1/my/votings/${id}`, data),
  deleteMyVoting: (id: string) => api.delete(`/voting/api/v1/my/votings/${id}`),

  // Запросы на голосование и наблюдение
  getVoteRequests: () => api.get<WatchOrVoteRequest[]>('/voting/api/v1/my/votings/requests/vote'),
  getWatchRequests: () => api.get<WatchOrVoteRequest[]>('/voting/api/v1/my/votings/requests/watch'),
  answerVoteRequests: (answers: AnswerForWatchOrVoteRequest[]) => 
    api.post('/voting/api/v1/my/votings/requests/vote', answers),
  answerWatchRequests: (answers: AnswerForWatchOrVoteRequest[]) => 
    api.post('/voting/api/v1/my/votings/requests/watch', answers),

  // Голосование
  getAvailableVotings: (filter?: VotingFilter) => {
    if (!filter) {
      return api.get<Voting[]>('/voting/api/v1/votings');
    }
    
    const params = new URLSearchParams();
    if (filter.approvedForWatching !== undefined) {
      params.append('approvedForWatching', filter.approvedForWatching.toString());
    }
    if (filter.approvedForVoting !== undefined) {
      params.append('approvedForVoting', filter.approvedForVoting.toString());
    }
    if (filter.status) {
      params.append('status', filter.status);
    }
    
    return api.get<Voting[]>(`/voting/api/v1/votings?${params.toString()}`);
  },
  getVoting: (id: string) => api.get<Voting>(`/voting/api/v1/votings/${id}`),
  getVoteRequestStatus: (votingId: string) => 
    api.get<PermissionRequestStatusResponse>(`/voting/api/v1/votings/${votingId}/request/vote`),
  getWatchRequestStatus: (votingId: string) => 
    api.get<PermissionRequestStatusResponse>(`/voting/api/v1/votings/${votingId}/request/watch`),
  requestVote: (votingId: string) => api.post(`/voting/api/v1/votings/${votingId}/request/vote`),
  requestWatch: (votingId: string) => api.post(`/voting/api/v1/votings/${votingId}/request/watch`),
  vote: (votingId: string, data: VoteRequest) => 
    api.post(`/voting/api/v1/votings/${votingId}/vote`, data),

  // Результаты
  getVotingResults: (votingId: string) =>
    api.post<CheckVotingResultsResponse>(`/voting/api/v1/votings/${votingId}/results`),
  getVotingStatistics: (id: string) => api.get(`/voting/api/v1/votings/${id}/statistics`),

  checkVote: (votingId: string, data: CheckVoteRequest) => 
    api.post<CheckVoteResponse>(`/voting/api/v1/votings/${votingId}/checkVote`, data),
  
  checkAllVotes: (votingId: string) =>
    api.post<CheckVoteResponse[]>(`/voting/api/v1/votings/${votingId}/checkAllVotes`),
};

export const cryptoApi = {
  getPublicKey: () => 
    api.get<PublicKeyResponse>('/crypto/api/v1/publicKey'),

  sign: (data: SignRequest) => 
    api.post<SignResponse>('/crypto/api/v1/sign', data),

  getZeroKnowledgeProof: (votingId: string) => 
    api.get<ZeroKnowledgeProofResponse>(`/crypto/api/v1/votings/${votingId}/zeroKnowledgeProof`),
};

export default api; 