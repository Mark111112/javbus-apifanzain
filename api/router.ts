import { Router } from 'express';
import createError from 'http-errors';
import {
  magnetsValidator,
  moviesPageValidator,
  searchMoviesPageValidator,
  typeValidator,
} from './validators.js';
import type { FilterType, MagnetType, MovieType, SortBy, SortOrder } from './types.js';
import {
  getMovieDetail,
  getMovieMagnets,
  getMoviesByKeywordAndPage,
  getMoviesByPage,
  getStarInfo,
} from './javbusParser.js';
import { validate } from './validatorUtils.js';
import fanzaScraper from './fanzaScraper.js';
import { body } from 'express-validator';

const router = Router();

// Movies routes
router.get('/movies', validate(moviesPageValidator), async (req, res, next) => {
  const query = req.query;
  const page = query.page as string;
  const magnet = query.magnet as MagnetType;
  const type = query.type as MovieType | undefined;
  const filterType = query.filterType as FilterType | undefined;
  const filterValue = query.filterValue as string | undefined;

  try {
    const response = await getMoviesByPage(page, magnet, type, filterType, filterValue);
    res.json(response);
  } catch (e) {
    next(e);
  }
});

router.get('/movies/search', validate(searchMoviesPageValidator), async (req, res, next) => {
  const query = req.query;
  const page = query.page as string;
  const magnet = query.magnet as MagnetType;
  const type = query.type as MovieType | undefined;
  const keyword = query.keyword as string;

  try {
    const response = await getMoviesByKeywordAndPage(keyword.trim(), page, magnet, type);
    res.json(response);
  } catch (e) {
    if (e instanceof Error && e.message.includes('404')) {
      res.json({
        movies: [],
        pagination: { currentPage: Number(page), hasNextPage: false, nextPage: null, pages: [] },
        keyword,
      });
    } else {
      next(e);
    }
  }
});

// Movie detail route
router.get('/movies/:id', async (req, res, next) => {
  const movieId = req.params.id as string;

  try {
    const movie = await getMovieDetail(movieId);
    res.json(movie);
  } catch (e) {
    next(e instanceof Error && e.message.includes('404') ? new createError.NotFound() : e);
  }
});

// Movie summary route
router.get('/movies/:id/summary', async (req, res, next) => {
  const movieId = req.params.id as string;

  try {
    const summaryResult = await fanzaScraper.getMovieSummary(movieId);

    if (summaryResult.summary) {
      res.json({
        movieId,
        summary: summaryResult.summary,
        url: summaryResult.url || null,
      });
    } else {
      res.status(404).json({
        movieId,
        summary: null,
        url: null,
        message: 'Summary not found for this movie',
      });
    }
  } catch (e) {
    next(e);
  }
});

// Bulk details route
router.post(
  '/movies/bulk',
  validate([
    body('ids').isArray().withMessage('IDs must be an array'),
    body('ids.*').isString().withMessage('All IDs must be strings'),
  ]),
  async (req, res, next) => {
    const { ids } = req.body;

    try {
      const movies = await Promise.all(ids.map((id: string) => getMovieDetail(id)));
      res.json(movies);
    } catch (e) {
      next(e);
    }
  },
);

// Star info route
router.get('/stars/:id', validate([typeValidator]), async (req, res, next) => {
  const starId = req.params.id as string;
  const type = req.query.type as MovieType | undefined;

  try {
    const starInfo = await getStarInfo(starId, type);
    res.json(starInfo);
  } catch (e) {
    next(e instanceof Error && e.message.includes('404') ? new createError.NotFound() : e);
  }
});

// Star movies route
router.get('/stars/:id/movies', validate([typeValidator]), async (req, res, next) => {
  const starId = req.params.id as string;
  const type = req.query.type as MovieType | undefined;

  try {
    const movies = await getMoviesByPage('1', undefined, type, 'star', starId);
    res.json(movies);
  } catch (e) {
    next(e);
  }
});

// Magnets route
router.get('/magnets/:movieId', validate(magnetsValidator), async (req, res, next) => {
  const movieId = req.params.movieId as string;
  const gid = req.query.gid as string;
  const uc = req.query.uc as string;
  const sortBy = req.query.sortBy as SortBy | undefined;
  const sortOrder = req.query.sortOrder as SortOrder | undefined;

  if (!movieId || !gid || !uc) {
    res.status(400).json({ error: 'Missing required parameters' });
    return;
  }

  try {
    const magnets = await getMovieMagnets({ movieId, gid, uc, sortBy, sortOrder });
    res.json(magnets);
  } catch (e) {
    next(e);
  }
});

export default router;
