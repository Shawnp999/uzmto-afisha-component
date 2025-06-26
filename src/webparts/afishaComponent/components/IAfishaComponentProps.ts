import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface IAfishaComponentProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  context?: WebPartContext; // Add context for HttpClient access
  
  maxMovies?: number;
  showGenres?: boolean;
  showDates?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in minutes
}