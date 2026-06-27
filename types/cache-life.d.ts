/**
 * Conexiaa Cache Life – type definitions for the front‑end cache layer.
 *
 * This module defines the shape of cached objects, the cache store interface,
 * and lifecycle hooks.  It’s designed to be implemented by any cache provider
 * (in‑memory Map, localStorage wrapper, Redis adapter, etc.) and used
 * by API clients, WebSocket message queues, and UI state hydration.
 */

// ────────────────────────────────────────────────────────────────
// Core entry type
// ────────────────────────────────────────────────────────────────

interface CacheEntry<T = unknown> {
  /** Unique key for the cached item */
  key: string;
  /** The stored data */
  data: T;
  /** Timestamp (ms) when the entry was created */
  createdAt: number;
  /** Timestamp (ms) when the entry was last accessed */
  lastAccessedAt: number;
  /** Time‑to‑live in milliseconds; if 0 the item never expires */
  ttl: number;
  /** Optional tags for grouped invalidation */
  tags?: string[];
}

// ────────────────────────────────────────────────────────────────
// Cache store interface
// ────────────────────────────────────────────────────────────────

interface CacheStore<T = unknown> {
  /** Retrieve a value by key. Returns the entry or null if not found/expired. */
  get(key: string): CacheEntry<T> | null;
  /** Store a value. Overwrites if the key already exists. */
  set(key: string, data: T, ttl?: number, tags?: string[]): void;
  /** Remove a specific key. */
  delete(key: string): void;
  /** Clear all entries. */
  clear(): void;
  /** Check if a key exists and is not expired. */
  has(key: string): boolean;
  /** Return all non‑expired keys. */
  keys(): string[];
  /** Invalidate all entries that match one or more tags. */
  invalidateByTags(tags: string[]): void;
  /** Return the current store size. */
  size(): number;
  /** Return read‑only statistics. */
  stats(): CacheStats;
}

// ────────────────────────────────────────────────────────────────
// Cache statistics
// ────────────────────────────────────────────────────────────────

interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  evictions: number;
}

// ────────────────────────────────────────────────────────────────
// Configuration
// ────────────────────────────────────────────────────────────────

interface CacheConfig {
  /** Maximum number of entries before eviction (LRU) */
  maxEntries: number;
  /** Default TTL in milliseconds for new entries */
  defaultTTL: number;
  /** Whether to update lastAccessedAt on read (true = LRU) */
  updateOnAccess: boolean;
}

// ────────────────────────────────────────────────────────────────
// Lifecycle hooks (optional)
// ────────────────────────────────────────────────────────────────

type CacheHook<T = unknown> = (entry: CacheEntry<T>) => void;

interface CacheLifecycleHooks<T = unknown> {
  /** Called before a value is written to the store */
  beforeSet?: (key: string, data: T, ttl: number) => T | Promise<T>;
  /** Called after a value is written */
  afterSet?: CacheHook<T>;
  /** Called before a value is read */
  beforeGet?: (key: string) => void;
  /** Called after a successful read */
  afterGet?: CacheHook<T>;
  /** Called when an entry is evicted due to maxEntries */
  onEviction?: CacheHook<T>;
  /** Called when an entry is explicitly deleted */
  onDelete?: CacheHook<T>;
}

// ────────────────────────────────────────────────────────────────
// Factory type
// ────────────────────────────────────────────────────────────────

interface CacheFactory<T = unknown> {
  (config?: Partial<CacheConfig>, hooks?: CacheLifecycleHooks<T>): CacheStore<T>;
}

// ────────────────────────────────────────────────────────────────
// Convenience: a generic cache for API responses
// ────────────────────────────────────────────────────────────────

interface ApiResponseCacheEntry<T = unknown> extends CacheEntry<T> {
  /** HTTP status code of the cached response */
  status: number;
  /** Response headers stored alongside */
  headers?: Record<string, string>;
}