import { ZuzApp, NginxServerBlock, ICacheSection, NginxServer } from "@/lib/types";

export const nginxStatsCache : NginxServer = {
  isRunning: false,
  version: "0.0.0",
};

class CacheSection<T> implements ICacheSection<T> {

  private data: Record<string, T> = {};

  constructor(private keySelector: (item: T) => string) {}

  public getAll(): T[] {
    return Object.values(this.data);
  }

  public getById(name: string): T | null {
    return this.data[name] ?? null;
  }

  public update(item: T): void {
    const key = this.keySelector(item);
    if (!this.data[key]) {
      this.data[key] = item;
    } else {
      this.data[key] = { ...this.data[key], ...item };
    }
  }

  public add(item: T): void {
    const key = this.keySelector(item);
    if (!this.data[key]) {
      this.data[key] = item;
    } else {
      this.data[key] = { ...this.data[key], ...item };
    }
  }

  public addAll(items: T[]): void {
    items.forEach((item) => this.add(item));
  }

  public remove(name: string): void {
    delete this.data[name];
  }

  public clear(): void {
    this.data = {};
  }
}

export class ZuzCache {
  private static instance: ZuzCache;

  // Standardized sections
  public readonly apps: ICacheSection<ZuzApp>;
  public readonly nginx: ICacheSection<NginxServerBlock>;
  // Future proofing: public readonly users: ICacheSection<User>;

  private constructor() {
    // Define how each section finds its unique key
    this.apps = new CacheSection<ZuzApp>((app) => app.service);
    this.nginx = new CacheSection<NginxServerBlock>((server) => server.id);
  }

  public static getInstance(): ZuzCache {
    if (!ZuzCache.instance) {
      ZuzCache.instance = new ZuzCache();
    }
    return ZuzCache.instance;
  }

  public clearAll(): void {
    this.apps.clear();
    this.nginx.clear();
    console.log("Global cache cleared.");
  }
}

// Export a constant for easy access
const cache = ZuzCache.getInstance();

export default cache