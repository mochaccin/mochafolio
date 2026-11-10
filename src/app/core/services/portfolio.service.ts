import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Project } from '../models/portfolio';

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private readonly http = inject(HttpClient);
  private projectsCache: Project[] | null = null;

  async loadAllProjects(): Promise<Project[]> {
    if (this.projectsCache) return this.projectsCache;

    try {
      const data = await firstValueFrom(this.http.get<{ projects: Project[] }>('/assets/portfolio-data.json'));
      this.projectsCache = data.projects ?? [];
      return this.projectsCache;
    } catch (error) {
      console.error('Failed to load portfolio data:', error);
      this.projectsCache = [];
      return [];
    }
  }

  async getFeaturedProjects(): Promise<Project[]> {
    const all = await this.loadAllProjects();
    return all.filter(p => p.featured);
  }

  async getProjectById(id: string): Promise<Project | null> {
    const all = await this.loadAllProjects();
    return all.find(p => p.id === id) ?? null;
  }

  async loadBadges(): Promise<Array<{name: string; technology: string; url: string; icon?: string}>> {
    try {
      return await firstValueFrom(this.http.get<Array<{name: string; technology: string; url: string; icon?: string}>>('/badges.json'));
    } catch (error) {
      console.error('Failed to load badges:', error);
      return [];
    }
  }

  clearCache(): void {
    this.projectsCache = null;
  }
}