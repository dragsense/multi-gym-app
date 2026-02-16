export interface ICacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  clears: number;
}

export interface ICacheResponse {
  stats: ICacheStats;
  hitRatio: number;
}
