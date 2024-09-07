/**
 * Least Recently Used (LRU) cache to handle the issue of cache overflow. 
 * In an LRU cache, when the cache size exceeds a specified limit, 
 * the least recently used items are removed first. 
 * 
 * Usage:
 * 
 * // Example cache structure for storing pagination
 * interface PaginationCache {
 *   endTick: string | null;
 *   txnNextIndexStart: string | null;
 * }
 * // Initialize LRU cache with a size limit (e.g., 100 entries)
 * const cacheSizeLimit = 100;
 * const paginationCache = new LRUCache<string, PaginationCache>(cacheSizeLimit);
 */
export class LRUCache<K, V> {
  private maxSize: number;
  private cache: Map<K, V>;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  // Get a value from the cache
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value === undefined) return undefined;

    // If key exists, move it to the end to mark it as recently used
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  // Add a value to the cache
  set(key: K, value: V): void {
    // If the key exists, delete it first so that we can refresh its position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // If the cache is at capacity, remove the oldest entry
    if (this.cache.size >= this.maxSize) {
      // Oldest entry is the first key in the Map
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    // Set the new key-value pair
    this.cache.set(key, value);
  }

  // Check if the cache contains a key
  has(key: K): boolean {
    return this.cache.has(key);
  }

  // Get the current size of the cache
  size(): number {
    return this.cache.size;
  }
}
