import * as React from 'react';
import styles from './AfishaComponent.module.scss';
import type { IAfishaComponentProps } from './IAfishaComponentProps';


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
}

export default class AfishaComponent extends React.Component<IAfishaComponentProps, IAfishaComponentState> {
  private moviesContainerRef = React.createRef<HTMLDivElement>();

  constructor(props: IAfishaComponentProps) {
    super(props);
    this.state = {
      movies: [],
      loading: false,
      error: ''
    };
  }

  public componentDidMount(): void {
    this.fetchMovies();
  }

  private async fetchMovies(): Promise<void> {
    this.setState({ loading: true, error: '' });

    try {
      // Using a CORS proxy to fetch data
      const proxyUrl = 'https://corsproxy.io/?';
      const targetUrl = 'https://www.afisha.uz/api/videos/premieres?locale=ru&premiereRegion=world&premieredAtAfter=2025-05-02T00%3A00%3A00%2B05%3A00&premieredAtStrictlyBefore=2025-07-02T00%3A00%3A00%2B05%3A00&itemsPerPage=20&page=1';
      
      const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      const processedMovies = this.processMoviesData(data);
      
      this.setState({ movies: processedMovies, loading: false });
    } catch (error) {
      console.error('Error fetching movies:', error);
      this.setState({ 
        error: `Ошибка загрузки фильмов: ${error.message}`, 
        loading: false 
      });
    }
  }

  private processMoviesData(data: any): IMovie[] {
    return data['hydra:member'].map((movie: any) => ({
      id: movie['@id'],
      title: movie.title,
      originalTitle: movie.originalTitle,
      slug: movie.slug,
      type: movie.type,
      year: movie.year,
      posterUrl: movie.mainMediaObject?.variantUrls?.medium || '',
      premiereDate: movie.worldPremiereDate,
      russiaPremiereDate: movie.russiaPremiereDate,
      genres: movie.genres?.map((genre: any) => genre.name) || []
    }));
  }

  private getMonthName(monthIndex: number): string {
    const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                       'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return monthNames[monthIndex];
  }

  private formatDate(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return `с ${date.getDate()} ${this.getMonthName(date.getMonth())}`;
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
    const formattedDate = this.formatDate(movie.premiereDate);
    const genreText = movie.genres.length > 0 
      ? movie.genres.slice(0, 2).join(', ') 
      : '';

    return (
      <a 
        key={movie.id}
        href={movieUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.movieCard}
      >
        {movie.posterUrl ? (
          <img 
            src={`https://www.afisha.uz${movie.posterUrl}`}
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
          Нет фото
        </div>
        <div className={styles.movieInfo}>
          <div className={styles.movieTitle}>{movie.title}</div>
          <div className={styles.movieMeta}>{genreText}</div>
          <div className={styles.movieDate}>{formattedDate}</div>
        </div>
      </a>
    );
  }

  public render(): React.ReactElement<IAfishaComponentProps> {
    const { movies, loading, error } = this.state;

    return (
      <section className={styles.afishaComponent}>
        <h1 className={styles.title}>Киномпремьеры</h1>
        
        {error && (
          <div className={styles.error}>
            {error}
            <button 
              className={styles.retryButton}
              onClick={() => this.fetchMovies()}
            >
              Попробовать снова
            </button>
          </div>
        )}
        
        {loading && (
          <div className={styles.loader}>Загрузка фильмов...</div>
        )}
        
        {!loading && !error && (
          <div className={styles.movieSlider}>
            <div 
              className={styles.moviesContainer}
              ref={this.moviesContainerRef}
            >
              {movies.map(movie => this.renderMovieCard(movie))}
            </div>
            <div 
              className={`${styles.arrowNav} ${styles.arrowPrev}`}
              onClick={() => this.scrollMovies('left')}
            >
              &#10094;
            </div>
            <div 
              className={`${styles.arrowNav} ${styles.arrowNext}`}
              onClick={() => this.scrollMovies('right')}
            >
              &#10095;
            </div>
          </div>
        )}
      </section>
    );
  }
}