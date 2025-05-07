export interface Voting {
  id: string;
  title: string;
  description: string;
  status: string;
  type: string;
  answers: VotingAnswer[];
}

export interface VotingAnswer {
  id: string;
  text: string;
}

export interface VotingRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'USED' | 'CREATOR';
  userId: string;
  votingId: string;
} 