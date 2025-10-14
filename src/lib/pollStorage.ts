export interface Poll {
  id: string;
  question: string;
  options: string[];
  createdAt: string;
}

export interface Vote {
  pollId: string;
  optionIndex: number;
  voterSession: string;
  timestamp: string;
}

const POLLS_KEY = 'kinetic_polls';
const VOTES_KEY = 'kinetic_votes';

export const pollStorage = {
  // Polls
  getPolls(): Poll[] {
    const data = localStorage.getItem(POLLS_KEY);
    return data ? JSON.parse(data) : [];
  },

  savePoll(poll: Poll): void {
    const polls = this.getPolls();
    polls.push(poll);
    localStorage.setItem(POLLS_KEY, JSON.stringify(polls));
    window.dispatchEvent(new Event('storage'));
  },

  getActivePoll(): Poll | null {
    const polls = this.getPolls();
    return polls.length > 0 ? polls[polls.length - 1] : null;
  },

  clearPolls(): void {
    localStorage.removeItem(POLLS_KEY);
    window.dispatchEvent(new Event('storage'));
  },

  // Votes
  getVotes(): Vote[] {
    const data = localStorage.getItem(VOTES_KEY);
    return data ? JSON.parse(data) : [];
  },

  addVote(vote: Vote): void {
    const votes = this.getVotes();
    votes.push(vote);
    localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
    window.dispatchEvent(new Event('storage'));
  },

  getVotesByPoll(pollId: string): Vote[] {
    return this.getVotes().filter(v => v.pollId === pollId);
  },

  hasVoted(pollId: string, voterSession: string): boolean {
    return this.getVotes().some(
      v => v.pollId === pollId && v.voterSession === voterSession
    );
  },

  clearVotes(): void {
    localStorage.removeItem(VOTES_KEY);
    window.dispatchEvent(new Event('storage'));
  },

  // Voter session
  getVoterSession(): string {
    let session = localStorage.getItem('voter_session');
    if (!session) {
      session = crypto.randomUUID();
      localStorage.setItem('voter_session', session);
    }
    return session;
  },

  // Clear all data
  clearAll(): void {
    this.clearPolls();
    this.clearVotes();
  }
};
