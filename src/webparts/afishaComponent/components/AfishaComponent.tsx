import * as React from 'react';
import styles from './AfishaComponent.module.scss';
import type { IAfishaComponentProps } from './IAfishaComponentProps';
import { HttpClient, HttpClientResponse } from '@microsoft/sp-http';

// Interface for movie data
interface IMovie {
  id: string;
  title: string;
  originalTitle: string;
  slug: string;
  type: string;
  year: number;
  posterUrl: string;
  premiereDate: string;
  russiaPremiereDate: string;
  genres: string[];
}

interface IAfishaComponentState {
  movies: IMovie[];
  loading: boolean;
  error: string;
  retryCount: number;
}

export default class AfishaComponent extends React.Component<IAfishaComponentProps, IAfishaComponentState> {
  private moviesContainerRef = React.createRef<HTMLDivElement>();
  private refreshInterval: number | null = null;

  // Working CORS proxies (prioritized by reliability)
  private corsProxies: string[] = [
    'https://api.codetabs.com/v1/proxy/?quest=', // This one works!
    'https://api.allorigins.win/get?url=',
    'https://thingproxy.freeboard.io/fetch/',
    'https://cors-proxy.htmldriven.com/?url='
  ];

  constructor(props: IAfishaComponentProps) {
    super(props);
    this.state = {
      movies: [],
      loading: false,
      error: '',
      retryCount: 0
    };
  }

  public componentDidMount(): void {
    this.fetchMovies();
    
    // Setup auto-refresh if enabled
    if (this.props.autoRefresh && this.props.refreshInterval) {
      this.refreshInterval = window.setInterval(() => {
        this.fetchMovies();
      }, this.props.refreshInterval * 60 * 1000);
    }
  }

  public componentWillUnmount(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  public componentDidUpdate(prevProps: IAfishaComponentProps): void {
    if (prevProps.autoRefresh !== this.props.autoRefresh || 
        prevProps.refreshInterval !== this.props.refreshInterval) {
      
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
      }

      if (this.props.autoRefresh && this.props.refreshInterval) {
        this.refreshInterval = window.setInterval(() => {
          this.fetchMovies();
        }, this.props.refreshInterval * 60 * 1000);
      }
    }
  }

  private async fetchMovies(): Promise<void> {
    this.setState({ loading: true, error: '' });

    try {
      const directUrl = 'https://www.afisha.uz/api/videos/premieres?locale=ru&premiereRegion=world&premieredAtAfter=2025-05-02T00%3A00%3A00%2B05%3A00&premieredAtStrictlyBefore=2025-07-02T00%3A00%3A00%2B05%3A00&itemsPerPage=20&page=1';
      
      let data: any = null;

      // Method 1: Try SharePoint HttpClient (recommended for SPFx)
      try {
        console.log('Trying SharePoint HttpClient...');
        if (this.props.context && this.props.context.serviceScope) {
          const httpClient: HttpClient = this.props.context.serviceScope.consume(HttpClient.serviceKey);
          if (httpClient) {
            const response: HttpClientResponse = await httpClient.get(directUrl, HttpClient.configurations.v1);
            if (response.ok) {
              data = await response.json();
              console.log('Successfully fetched data using SharePoint HttpClient');
            }
          }
        }
      } catch (spError) {
        console.log('SharePoint HttpClient failed:', spError);
      }

      // Method 2: Try CORS proxies if SharePoint HttpClient failed
      if (!data) {
        for (let i = 0; i < this.corsProxies.length; i++) {
          try {
            const proxyUrl = this.corsProxies[i];
            let fullUrl: string;

            // Handle different proxy URL formats
            if (proxyUrl.includes('allorigins.win')) {
              fullUrl = proxyUrl + encodeURIComponent(directUrl);
            } else if (proxyUrl.includes('thingproxy.freeboard.io')) {
              fullUrl = proxyUrl + directUrl;
            } else {
              fullUrl = proxyUrl + encodeURIComponent(directUrl);
            }
            
            console.log(`Trying proxy ${i + 1}/${this.corsProxies.length}: ${proxyUrl}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(fullUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
              signal: controller.signal,
              mode: 'cors',
              cache: 'no-cache'
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              const responseText = await response.text();
              try {
                // Handle different proxy response formats
                if (proxyUrl.includes('allorigins.win')) {
                  const proxyResponse = JSON.parse(responseText);
                  data = JSON.parse(proxyResponse.contents);
                } else {
                  data = JSON.parse(responseText);
                }
                console.log(`Successfully fetched data using proxy: ${proxyUrl}`);
                break;
              } catch (parseError) {
                console.log(`Failed to parse JSON from proxy ${i + 1}:`, parseError);
                continue;
              }
            } else {
              console.log(`Proxy ${i + 1} returned status: ${response.status}`);
            }
          } catch (proxyError) {
            console.log(`Proxy ${i + 1} failed:`, proxyError);
            continue;
          }
        }
      }

      if (!data) {
        throw new Error('Все методы загрузки данных недоступны. Проверьте подключение к интернету.');
      }

      const processedMovies = this.processMoviesData(data);
      
      const limitedMovies = this.props.maxMovies 
        ? processedMovies.slice(0, this.props.maxMovies)
        : processedMovies;
      
      this.setState({ 
        movies: limitedMovies, 
        loading: false, 
        error: '',
        retryCount: 0 
      });

    } catch (error) {
      console.error('Error fetching movies:', error);
      this.setState({ 
        error: `Ошибка загрузки данных: ${(error as Error).message}`, 
        loading: false,
        movies: [], // Clear movies on error
        retryCount: this.state.retryCount + 1
      });
    }
  }

  private processMoviesData(data: any): IMovie[] {
    if (!data || !data['hydra:member']) {
      throw new Error('Неверный формат данных от API');
    }

    return data['hydra:member'].map((movie: any) => ({
      id: movie['@id'] || movie.id || Math.random().toString(),
      title: movie.title || 'Без названия',
      originalTitle: movie.originalTitle || movie.title || '',
      slug: movie.slug || '',
      type: movie.type || 'movie',
      year: movie.year || new Date().getFullYear(),
      posterUrl: movie.mainMediaObject?.variantUrls?.medium || 
                 movie.posterUrl || 
                 movie.poster?.medium || '',
      premiereDate: movie.worldPremiereDate || movie.premiereDate || '',
      russiaPremiereDate: movie.russiaPremiereDate || '',
      genres: movie.genres?.map((genre: any) => 
        typeof genre === 'string' ? genre : genre.name
      ) || []
    }));
  }

  private getMonthName(monthIndex: number): string {
    const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                       'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return monthNames[monthIndex] || '';
  }

  private formatDate(dateString: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      return `с ${date.getDate()} ${this.getMonthName(date.getMonth())}`;
    } catch {
      return '';
    }
  }

  private scrollMovies(direction: 'left' | 'right'): void {
    if (this.moviesContainerRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      this.moviesContainerRef.current.scrollBy({ 
        left: scrollAmount, 
        behavior: 'smooth' 
      });
    }
  }

  private renderMovieCard(movie: IMovie): JSX.Element {
    const movieUrl = `https://www.afisha.uz/ru/movies/${movie.slug}`;
    const formattedDate = this.props.showDates !== false ? this.formatDate(movie.premiereDate) : '';
    const genreText = (this.props.showGenres !== false && movie.genres.length > 0) 
      ? movie.genres.slice(0, 2).join(', ') 
      : '';

    return (
      <a 
        key={movie.id}
        href={movieUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.movieCard}
        aria-label={`Фильм: ${movie.title}`}
      >
        {movie.posterUrl ? (
          <img 
            src={movie.posterUrl.startsWith('http') || movie.posterUrl.startsWith('data:') 
              ? movie.posterUrl 
              : `https://www.afisha.uz${movie.posterUrl}`}
            alt={movie.title}
            className={styles.moviePoster}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const placeholder = target.nextElementSibling as HTMLElement;
              if (placeholder) placeholder.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={styles.placeholderPoster} style={{ display: movie.posterUrl ? 'none' : 'flex' }}>
          <span>🎬</span>
        </div>
        <div className={styles.movieInfo}>
          <div className={styles.movieTitle} title={movie.title}>
            {movie.title}
          </div>
          {genreText && (
            <div className={styles.movieMeta}>{genreText}</div>
          )}
          {formattedDate && (
            <div className={styles.movieDate}>{formattedDate}</div>
          )}
        </div>
      </a>
    );
  }

  private handleRetry = (): void => {
    this.fetchMovies();
  }

  public render(): React.ReactElement<IAfishaComponentProps> {
    const { movies, loading, error, retryCount } = this.state;

    return (
      <section className={`${styles.afishaComponent} ${this.props.hasTeamsContext ? styles.teams : ''}`}>
        <h1 className={styles.title}>Кинопремьеры</h1>
        
        {error && (
          <div className={styles.error}>
            <div>
              {error}
              {retryCount > 0 && (
                <div className={styles.retryInfo}>
                  Попытка {retryCount}. Проверьте подключение к интернету.
                </div>
              )}
            </div>
            <button 
              className={styles.retryButton}
              onClick={this.handleRetry}
              disabled={loading}
            >
              {loading ? 'Загрузка...' : 'Попробовать снова'}
            </button>
          </div>
        )}
        
        {loading && (
          <div className={styles.loader}>
            <div className={styles.spinner}></div>
            <span>Загрузка фильмов...</span>
          </div>
        )}
        
        {!loading && !error && movies.length === 0 && (
          <div className={styles.noData}>
            Нет доступных фильмов для отображения
          </div>
        )}
        
        {!loading && movies.length > 0 && (
          <div className={styles.movieSlider}>
            <div 
              className={styles.moviesContainer}
              ref={this.moviesContainerRef}
            >
              {movies.map(movie => this.renderMovieCard(movie))}
            </div>
            {movies.length > 3 && (
              <>
                <button 
                  className={`${styles.arrowNav} ${styles.arrowPrev}`}
                  onClick={() => this.scrollMovies('left')}
                  aria-label="Прокрутить влево"
                >
                  &#10094;
                </button>
                <button 
                  className={`${styles.arrowNav} ${styles.arrowNext}`}
                  onClick={() => this.scrollMovies('right')}
                  aria-label="Прокрутить вправо"
                >
                  &#10095;
                </button>
              </>
            )}
          </div>
        )}
      </section>
    );
  }
}