import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GitHubRepo } from '../models/portfolio';

export interface GitHubFileContent {
  type: 'file' | 'dir';
  name: string;
  path: string;
  content?: string;
  encoding?: string;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class GitHubService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://api.github.com';
  private readonly owner = 'mochaccin';
  private readonly token = this.getToken();

  private getToken(): string | undefined {
    if (typeof window !== 'undefined') {
      return (window as any).__GITHUB_TOKEN__;
    }
    return undefined;
  }

  async getPublicRepos(): Promise<GitHubRepo[]> {
    const url = `${this.baseUrl}/users/${this.owner}/repos?per_page=100&sort=updated`;
    const repos = await firstValueFrom(this.http.get<GitHubRepo[]>(url, { headers: this.headers() }));

    return repos.filter(r => !r.private && !r.fork && !r.archived);
  }

  async getFileContent(repo: string, path: string): Promise<string | null> {
    const url = `${this.baseUrl}/repos/${this.owner}/${repo}/contents/${path}`;
    try {
      const file = await firstValueFrom(this.http.get<GitHubFileContent>(url, { headers: this.headers() }));
      if (file.type !== 'file' || !file.content) return null;
      return file.encoding === 'base64' ? atob(file.content) : file.content;
    } catch (e: any) {
      if (e.status === 404) return null;
      throw e;
    }
  }

  async getPreviewImages(repo: string): Promise<string[]> {
    const url = `${this.baseUrl}/repos/${this.owner}/${repo}/contents/preview`;
    try {
      const files = await firstValueFrom(this.http.get<GitHubFileContent[]>(url, { headers: this.headers() }));
      return files
        .filter(f => f.type === 'file' && /\.(png|jpg|jpeg|webp)$/i.test(f.name))
        .sort((a, b) => {
          const na = parseInt(a.name.match(/\d+/)?.[0] || '0', 10);
          const nb = parseInt(b.name.match(/\d+/)?.[0] || '0', 10);
          return na - nb;
        })
        .map(f => `https://raw.githubusercontent.com/${this.owner}/${repo}/main/preview/${f.name}`);
    } catch {
      return [];
    }
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    return h;
  }
}