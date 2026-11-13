export interface Channel {
  id: string;
  name: string;
  category: 'Cricket' | 'Football' | 'Sports' | 'News' | 'Entertainment' | 'Movies' | 'Kids' | 'Music' | string;
  logo: string;
  mobileImage?: string;
  streamUrl: string;
  backupStreamUrl?: string;
  server3StreamUrl?: string;
  status: 'online' | 'offline' | 'checking';
  isLive: boolean;
  hd?: boolean;
  country?: string;
  language?: string;
  badge?: string;
  sortOrder?: number;
}

export interface MatchScore {
  id: string;
  tournament: string;
  teamA: { name: string; code: string; score: string; overs?: string; flag?: string };
  teamB: { name: string; code: string; score: string; overs?: string; flag?: string };
  statusText: string;
  isLive: boolean;
  sport: 'cricket' | 'football';
}
