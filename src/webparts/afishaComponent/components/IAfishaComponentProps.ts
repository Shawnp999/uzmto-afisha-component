export interface IAfishaComponentProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  
  maxMovies?: number;
  showGenres?: boolean;
  showDates?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in minutes
}