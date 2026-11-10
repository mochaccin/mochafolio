import { Component, signal, computed, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PortfolioService, Project, SummaryRendererService } from '../../core';

@Component({
  imports: [CommonModule, RouterLink],
  selector: 'app-projects',
  template: `
    <section class="projects-section mx-auto w-full max-w-[1200px] flex flex-col gap-10 sm:gap-4 pt-8 px-4 sm:px-6 animate-entry" aria-labelledby="projects-heading">
      <header class="section-header mb-2 animate-entry animate-entry-delay-1">
        <h1 id="projects-heading" class="section-title text-3xl font-bold text-rp-text flex items-center gap-3">
          <span class="text-rp-gold text-2xl">#</span>Projects
        </h1>
      </header>

      <p class="section-intro text-lg text-rp-subtle leading-relaxed max-w-[70ch] animate-entry animate-entry-delay-2">
        Selected projects that I've worked on from my public GitHub repositories, from university projects to my own personal ideas.
      </p>

      <!-- All Projects - Single grid using same card as landing page -->
      @if (projects().length > 0) {
        <section class="project-group animate-entry animate-entry-delay-3" aria-labelledby="all-heading">
          <h2 id="all-heading" class="subsection-title text-lg font-semibold mb-6 flex items-center gap-2 animate-entry animate-entry-delay-4">
            <span class="text-rp-gold">></span><span class="text-rp-muted">Feel free to contact me if you have any questions!</span>
          </h2>
          <div class="projects-grid grid grid-cols-1 pt-4 gap-6 sm:grid-cols-2" role="list">
            @for (project of projects(); track project.id; let i = $index) {
              <article class="project-card flex flex-col text-decoration-none color-inherit overflow-hidden rounded-2xl bg-rp-surface border border-rp-card-border hover:border-rp-gold group hover-lift" [routerLink]="['/projects', project.id]" role="listitem" [class.animate-entry-delay-1]="i === 0" [class.animate-entry-delay-2]="i === 1" [class.animate-entry-delay-3]="i === 2" [class.animate-entry-delay-4]="i === 3" [class.animate-entry-delay-5]="i === 4" [class.animate-entry-delay-6]="i === 5" [class.animate-entry]="true">
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
                    <p class="project-summary text-sm sm:text-base text-rp-subtle leading-relaxed mb-3 line-clamp-2" [innerHTML]="summaryRenderer.render(project.summary)"></p>
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
        </section>
      }

      @if (projects().length === 0) {
        <div class="empty-state flex flex-col items-center justify-center text-center p-12 sm:p-20 min-h-[300px] animate-fade animate-fade-delay-1">
          <span class="material-icons empty-icon text-rp-muted mb-4 text-5xl" aria-hidden="true">folder_open</span>
          <h3 class="text-rp-text mb-2">No Projects Yet</h3>
          <p class="text-rp-subtle text-base max-w-[40ch]">Projects will appear here once you add repositories with <code class="bg-rp-surface text-rp-iris px-2 py-0.5 rounded-sm text-sm">PORTFOLIO.md</code> files.</p>
        </div>
      }
    </section>
  `,
})
export class ProjectsPage implements OnInit {
  private readonly portfolio = inject(PortfolioService);
  protected readonly summaryRenderer = inject(SummaryRendererService);

  readonly projects = signal<Project[]>([]);

  async ngOnInit(): Promise<void> {
    const allProjects = await this.portfolio.loadAllProjects();
    this.projects.set(allProjects);
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