import { Component, signal, computed, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PortfolioService, Project } from '../../core';

@Component({
  imports: [CommonModule, RouterLink],
  selector: 'app-landing',
  template: `
    <main class="landing-page flex flex-col gap-10 sm:gap-12 px-4 sm:px-6 lg:px-8" aria-labelledby="landing-heading" aria-label="Main content">
      <!-- Welcome Section - Left aligned, minimal contact links -->
      <section class="welcome-section mx-auto w-full max-w-[1200px] px-4 flex flex-col gap-6 sm:gap-6 text-left mt-8 sm:mt-12 animate-entry" aria-labelledby="welcome-heading">

        <div class="flex flex-wrap items-center gap-6 m-0 animate-entry animate-entry-delay-1">
          <h1 id="welcome-heading" class="welcome-title text-4xl sm:text-5xl lg:text-5xl font-bold text-rp-text m-0 leading-tight">
            {{ greeting() }}
          </h1>
          <h1 id="welcome-heading" class="welcome-title text-4xl sm:text-5xl lg:text-5xl font-bold text-rp-text m-0 leading-tight">
            {{ name() }}
          </h1>
        </div>

        <p class="welcome-description text-lg sm:text-xl text-rp-subtle leading-relaxed m-0 max-w-[70ch] animate-entry animate-entry-delay-2">
          {{ description() }}
        </p>

        <nav class="contact-links flex flex-wrap items-center gap-2 m-0 mb-6 animate-entry animate-entry-delay-3" aria-label="Contact links" role="navigation">
          <a [href]="githubUrl()" target="_blank" rel="noopener noreferrer" class="contact-link inline-flex items-center gap-1.5 text-base font-medium text-rp-subtle hover:text-rp-gold transition-colors press-feedback" role="listitem" aria-label="GitHub">
            <span class="iconify text-base" data-icon="mdi:github" aria-hidden="true"></span>
            <span>GitHub</span>
          </a>

          <span class="contact-separator text-rp-gold" aria-hidden="true">|</span>

          <a [href]="linkedinUrl()" target="_blank" rel="noopener noreferrer" class="contact-link inline-flex items-center gap-1.5 text-base font-medium text-rp-subtle hover:text-rp-gold transition-colors press-feedback" role="listitem" aria-label="LinkedIn">
            <span class="iconify text-base" data-icon="mdi:linkedin" aria-hidden="true"></span>
            <span>LinkedIn</span>
          </a>

          <span class="contact-separator text-rp-gold" aria-hidden="true">|</span>

          <a [href]="emailUrl()" class="contact-link inline-flex items-center gap-1.5 text-base font-medium text-rp-subtle hover:text-rp-gold transition-colors press-feedback" role="listitem" aria-label="Email">
            <span class="material-icons text-base" aria-hidden="true">mail</span>
            <span>Email</span>
          </a>
        </nav>
      </section>

      <!-- Featured Projects Section -->
      <section class="projects-section mx-auto max-w-[1200px] px-4 mb-6 animate-entry" aria-labelledby="featured-heading">
        <header class="section-header flex items-center justify-between mb-8 animate-entry animate-entry-delay-1">
          <h2 id="featured-heading" class="section-title text-2xl sm:text-3xl font-bold text-rp-text flex items-center gap-3">
            <span class="text-rp-gold text-xl sm:text-2xl">#</span>Featured Projects
          </h2>
          <a routerLink="/projects" class="view-all-link inline-flex items-center gap-1.5 text-sm font-semibold text-rp-gold decoration-none transition-colors press-feedback" aria-label="View all projects">
            <span class="view-all-text relative">View all</span>
            <span class="material-icons text-sm" aria-hidden="true">chevron_right</span>
          </a>
        </header>

        @if (featuredProjects().length > 0) {
          <div class="projects-grid grid grid-cols-1 gap-6 sm:grid-cols-2" role="list">
            @for (project of featuredProjects(); track project.id; let i = $index) {
              <article class="project-card card flex flex-col text-decoration-none color-inherit overflow-hidden rounded-2xl bg-rp-surface border border-rp-card-border hover:border-rp-gold group hover-lift" [routerLink]="['/projects', project.id]" role="listitem" [class.animate-entry-delay-1]="i === 0" [class.animate-entry-delay-2]="i === 1" [class.animate-entry]="true">
                <div class="project-image-wrapper relative aspect-video rounded-lg p-6 overflow-hidden bg-rp-surface flex-shrink-0">
                  <img
                    [src]="project.previewImages[0]"
                    [alt]="project.title + ' preview'"
                    loading="lazy"
                    class="project-image w-full h-full object-cover rounded-md transition-transform duration-500"
                    (error)="onImageError($event)"
                  />
                </div>
                <div class="project-content p-4 sm:p-6 sm:pt-0 flex flex-col justify-between min-h-[160px]">
                  <div>
                    <h3 class="project-title text-lg sm:text-xl font-bold text-rp-text mb-2 group-hover:text-rp-gold transition-colors">{{ project.title }}</h3>
                    <p class="project-summary text-sm sm:text-base text-rp-subtle leading-relaxed mb-3 line-clamp-2">{{ project.summary }}</p>
                  </div>
                  <div class="project-tags-row flex items-center gap-2 pt-2" role="list" aria-label="Technologies">
                    <span class="material-icons text-base text-rp-pine flex-shrink-0" aria-hidden="true">label_outline</span>
                    <div class="tags flex flex-wrap gap-2">
                      @for (tag of project.tags; track tag; let j = $index) {
                        <span class="tag inline-flex items-center text-sm font-medium px-3 py-1 rounded-sm border whitespace-nowrap press-feedback" [class]="getTagClass(j)" role="listitem">
                          {{ tag }}
                        </span>
                      }
                    </div>
                  </div>
                </div>
              </article>
            }
          </div>
        } @else {
          <div class="empty-state flex flex-col items-center justify-center text-center p-12 sm:p-20 min-h-[300px] animate-fade animate-fade-delay-1">
            <span class="material-icons empty-icon text-rp-muted mb-4 text-5xl" aria-hidden="true">folder_open</span>
            <h3 class="text-rp-text mb-2">No Featured Projects</h3>
            <p class="text-rp-subtle text-base max-w-[40ch]">Add PORTFOLIO.md with <code class="bg-rp-surface text-rp-iris px-2 py-0.5 rounded-sm text-sm">featured: true</code> to your repositories to display them here.</p>
          </div>
        }
      </section>

      <!-- Badges & Certifications Section -->
      <section class="badges-section mx-auto max-w-[1200px] px-4 animate-entry" aria-labelledby="badges-heading">
        <h2 id="badges-heading" class="section-title text-2xl sm:text-3xl font-bold text-rp-text flex items-center gap-3 mb-8 animate-entry animate-entry-delay-1">
          <span class="text-rp-gold text-xl sm:text-2xl">#</span>Badges & Certifications
        </h2>

        <div class="badges-grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
          @for (badge of badges(); track badge.name; let i = $index) {
            <a [href]="badge.url" target="_blank" rel="noopener noreferrer" class="badge-card group flex items-center gap-3 p-4 rounded-2xl bg-rp-surface border border-rp-card-border hover:border-rp-gold cursor-pointer hover-lift" role="listitem" [attr.aria-label]="'View ' + badge.name + ' certification on ' + badge.technology" [class.animate-entry-delay-1]="i === 0" [class.animate-entry-delay-2]="i === 1" [class.animate-entry-delay-3]="i === 2" [class.animate-entry-delay-4]="i === 3" [class.animate-entry-delay-5]="i === 4" [class.animate-entry-delay-6]="i === 5" [class.animate-entry]="true">
              <!-- Brand indicator dot -->
              <span class="badge-brand-dot w-3 h-3 rounded-full flex-shrink-0" [style.background]="getBadgeTextColor(badge.technology)" aria-hidden="true"></span>

              <div class="badge-content flex-1 min-w-0">
                <h3 class="badge-name text-base font-semibold text-rp-text whitespace-normal break-words leading-snug">{{ badge.name }}</h3>
                <p class="badge-technology text-sm text-rp-subtle whitespace-normal break-words mt-0.5">{{ badge.technology }}</p>
              </div>

              <!-- External link indicator -->
              <span class="badge-external-link material-icons text-base flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style="color: var(--color-rp-gold)" aria-hidden="true">open_in_new</span>
            </a>
          } @empty {
            <div class="badges-empty grid gap-4 col-span-full animate-fade animate-fade-delay-1">
              <p class="empty-text text-rp-subtle text-sm text-center">No badges configured yet. Add entries to <code class="bg-rp-surface text-rp-iris px-2 py-0.5 rounded-sm text-sm">badges.json</code> to display them here.</p>
            </div>
          }
        </div>
      </section>
    </main>
  `,
})
export class LandingPage implements OnInit {
  private readonly portfolio = inject(PortfolioService);

  // Personal info
  readonly name = signal('Nicolás Pelizari');
  readonly greeting = signal("Hallo! I'm");
  readonly description = signal("I'm a Software Engineer currently located in Temuco, Chile. I've developed production level web and mobile applications, cloud-based systems, and automation solutions for clients across different industries. Learning new things and making a tangible difference is what keeps me building.");
  readonly githubUrl = signal('https://github.com/mochaccin');
  readonly linkedinUrl = signal('https://www.linkedin.com/in/npelizari/');
  readonly emailUrl = signal('mailto:nicolas.pelizari@gmail.com');

  // Featured projects from real data
  readonly featuredProjects = signal<Project[]>([]);
  readonly projectsLoading = signal(false);

  // Badges from badges.json
  readonly badges = signal<Array<{name: string; technology: string; url: string; icon?: string}>>([]);
  readonly badgesLoaded = signal(false);

  async ngOnInit(): Promise<void> {
    await this.loadFeaturedProjects();
    await this.loadBadges();
  }

  private async loadFeaturedProjects(): Promise<void> {
    this.projectsLoading.set(true);
    try {
      const featured = await this.portfolio.getFeaturedProjects();
      this.featuredProjects.set(featured);
    } catch (error) {
      console.error('Failed to load featured projects:', error);
    } finally {
      this.projectsLoading.set(false);
    }
  }

  private async loadBadges(): Promise<void> {
    try {
      const badges = await this.portfolio.loadBadges();
      this.badges.set(badges);
      this.badgesLoaded.set(true);
    } catch (err) {
      console.error('Failed to load badges:', err);
      this.badgesLoaded.set(true);
    }
  }

  // Get brand text color for badge (dot, name, external link)
  getBadgeTextColor(technology: string): string {
    const colors: Record<string, string> = {
      'AWS': 'var(--color-rp-gold)',
      'NVIDIA': 'var(--color-rp-pine)',
      'Anthropic': 'var(--color-rp-iris)',
    };
    return colors[technology] || 'var(--color-rp-text)';
  }

  // Tag pastel classes - different colors to make them pop
  getTagClass(index: number): string {
    const classes = ['tag-rose', 'tag-foam', 'tag-pine', 'tag-gold', 'tag-iris', 'tag-love'];
    return classes[index % classes.length];
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%232d2a3f" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="16" fill="%236e6a86"%3EImage not found%3C/text%3E%3C/svg%3E';
    img.alt = 'Project preview (placeholder)';
  }
}