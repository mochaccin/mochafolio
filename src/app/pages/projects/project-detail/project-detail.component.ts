import { Component, signal, computed, inject, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { PortfolioService, Project, SummaryRendererService } from '../../../core';

declare global {
  interface Window {
    mermaid: any;
  }
}

@Component({
  imports: [CommonModule, RouterLink],
  selector: 'app-project-detail',
  template: `
    @if (loading()) {
      <div class="loading-state flex flex-col items-center justify-center text-center min-h-[60vh] p-12 animate-fade" role="status">
        <div class="spinner w-10 h-10 border-2 border-rp-gold border-t-transparent rounded-full animate-spin mb-4" aria-hidden="true"></div>
        <p class="text-rp-subtle text-lg">Loading project...</p>
      </div>
    } @else if (error()) {
      <div class="error-state flex flex-col items-center justify-center text-center min-h-[60vh] p-12 animate-fade" role="alert">
        <span class="material-icons text-rp-love mb-6 text-7xl" aria-hidden="true">error</span>
        <h2 class="text-2xl font-bold text-rp-text mb-3">Project Not Found</h2>
        <p class="text-rp-subtle mb-6 max-w-md">{{ error() }}</p>
        <a routerLink="/projects" class="inline-flex items-center gap-2 px-6 py-3 bg-rp-surface border border-rp-overlay text-rp-gold text-base font-semibold rounded-lg hover:bg-rp-base hover:border-rp-gold transition-all press-feedback" aria-label="Back to projects">
          <span class="material-icons text-base" aria-hidden="true">arrow_back</span>
          <span>Back to Projects</span>
        </a>
      </div>
    } @else if (project(); as proj) {
      <article class="project-detail flex flex-col max-w-[624px] mx-auto mt-10 animate-entry" aria-labelledby="project-title">
        <!-- Preview Carousel -->
        @if (proj.previewImages.length > 0) {
          <div
            class="project-hero mb-8 relative aspect-video rounded-lg p-6 overflow-hidden bg-rp-surface animate-entry animate-entry-delay-1"
            role="region"
            [attr.aria-label]="proj.title + ' previews'"
            aria-roledescription="carousel"
          >
            <img
              [src]="proj.previewImages[carouselIndex()]"
              [alt]="proj.title + ' preview ' + (carouselIndex() + 1)"
              loading="eager"
              class="project-hero-img w-full h-full object-contain rounded-md cursor-zoom-in"
              role="button"
              tabindex="0"
              (click)="openFullscreen()"
              (keydown.enter)="openFullscreen()"
              (keydown.space)="openFullscreen(); $event.preventDefault()"
              [attr.aria-label]="'View ' + proj.title + ' preview fullscreen'"
              (error)="onImageError($event)"
            />

            @if (proj.previewImages.length > 1) {
              <button
                type="button"
                class="absolute left-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-rp-base/90 text-rp-text border border-rp-overlay hover:text-rp-gold hover:border-rp-gold transition-colors"
                (click)="previousPreview(proj.previewImages.length)"
                aria-label="Previous preview"
              >
                <span class="material-icons text-xl" aria-hidden="true">chevron_left</span>
              </button>
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-rp-base/90 text-rp-text border border-rp-overlay hover:text-rp-gold hover:border-rp-gold transition-colors"
                (click)="nextPreview(proj.previewImages.length)"
                aria-label="Next preview"
              >
                <span class="material-icons text-xl" aria-hidden="true">chevron_right</span>
              </button>

              <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2" aria-label="Preview indicators">
                @for (image of proj.previewImages; track image; let i = $index) {
                  <button
                    type="button"
                    class="w-2.5 h-2.5 rounded-full bg-rp-muted transition-colors hover:bg-rp-gold"
                    [class.bg-rp-gold]="carouselIndex() === i"
                    (click)="goToPreview(i)"
                    [attr.aria-label]="'Show preview ' + (i + 1)"
                    [attr.aria-current]="carouselIndex() === i ? 'true' : 'false'"
                  ></button>
                }
              </div>
            }
          </div>
        }

        <!-- Main Content - Prose article for markdown rendering -->
        <div class="project-main w-full">
          <!-- Header Cluster: Title + Meta + Tags -->
          <header class="project-header flex flex-col gap-6 mb-10 mt-4 animate-entry animate-entry-delay-2">
            <h1 id="project-title" class="project-title text-3xl sm:text-4xl lg:text-5xl font-bold text-rp-text leading-tight tracking-tight">
              {{ proj.title }}
            </h1>

            <div class="project-meta flex flex-col sm:flex-row sm:items-center gap-4 animate-fade animate-fade-delay-1">
              <div class="project-date flex items-center gap-3 text-rp-subtle text-sm font-medium flex-wrap">
                <span class="material-icons text-base text-rp-gold flex-shrink-0" aria-hidden="true">calendar_month</span>
                <time [attr.datetime]="proj.lastCommitDate || formatDateForTime(proj.date)">{{ formatProjectDate(proj) }}</time>

                @if (proj.githubUrl || proj.demoUrl) {
                  <span class="meta-separator text-rp-muted" aria-hidden="true">|</span>
                }

                @if (proj.githubUrl) {
                  <a [href]="proj.githubUrl" target="_blank" rel="noopener noreferrer" class="project-link inline-flex items-center gap-1.5 text-rp-subtle hover:text-rp-gold font-medium transition-colors press-feedback" aria-label="View on GitHub">
                    <span class="iconify text-sm" data-icon="mdi:github" aria-hidden="true"></span>
                    <span>GitHub</span>
                  </a>
                }
                @if (proj.demoUrl) {
                  <span class="meta-separator text-rp-muted" aria-hidden="true">|</span>
                  <a [href]="proj.demoUrl" target="_blank" rel="noopener noreferrer" class="project-link inline-flex items-center gap-1.5 text-rp-subtle hover:text-rp-gold font-medium transition-colors press-feedback" aria-label="View Demo">
                    <span class="material-icons text-sm" aria-hidden="true">open_in_new</span>
                    <span>Demo</span>
                  </a>
                }
              </div>
            </div>

            <div class="project-tags-row flex items-center gap-2 animate-fade animate-fade-delay-2">
              <span class="material-icons text-base text-rp-gold flex-shrink-0" aria-hidden="true">label_outline</span>
              <div class="tags flex flex-wrap gap-2" role="list" aria-label="Technologies">
                @for (tag of proj.tags; track tag; let i = $index) {
                  <span class="tag inline-flex items-center text-sm font-medium px-3 py-1 rounded-sm border whitespace-nowrap transition-all press-feedback" [class]="getTagClass(i)" role="listitem">
                    {{ tag }}
                  </span>
                }
              </div>
            </div>

            <!-- Purple separator after tags -->
            <hr class="project-separator border-0 h-px bg-rp-gold my-6 mb-2 animate-fade animate-fade-delay-2" aria-hidden="true" />
          </header>

          <!-- Summary -->
          @if (proj.summary) {
            <p class="project-summary prose prose-invert sm:text-2xl text-rp-subtle leading-relaxed max-w-[75ch] border-l-2 border-rp-gold pl-4 mb-10 animate-entry animate-entry-delay-3">
              <span [innerHTML]="summaryRenderer.render(proj.summary)"></span>
            </p>
          }

          <!-- Deep Dive Sections - Each as a proper prose article -->
          @for (section of detailSections(proj.sections); track section.id; let i = $index) {
            <section class="deep-dive-section mb-12 animate-entry" [class.animate-entry-delay-3]="i === 0" [class.animate-entry-delay-4]="i === 1" [class.animate-entry-delay-5]="i >= 2">
              <header class="deep-dive-header mb-6">
                <h2 class="deep-dive-title text-2xl font-bold text-rp-text flex items-center gap-3">
                  <span class="text-rp-gold text-xl">{{ (i + 1).toString().padStart(2, '0') }}</span>{{ section.title }}
                </h2>
              </header>
              <article class="prose prose-invert max-w-none" [innerHTML]="renderMarkdown(section.content)"></article>
            </section>
          }

          <!-- Architecture Diagram (if exists in any section) -->
          @if (hasMermaidDiagram()) {
            <div class="architecture-diagram mt-8 p-6 bg-rp-base border border-rp-overlay rounded-xl animate-fade animate-fade-delay-1" #diagramContainer [innerHTML]="renderMermaidDiagrams()"></div>
          }

          <!-- Back Link -->
          <div class="project-footer pt-8 border-t border-rp-overlay animate-entry animate-entry-delay-5">
            <a routerLink="/projects" class="back-link inline-flex items-center gap-2 text-rp-gold text-base font-medium decoration-none press-feedback" aria-label="Back to projects">
              <span class="material-icons text-base" aria-hidden="true">arrow_back</span>
              <span>Back to Projects</span>
            </a>
          </div>
        </div>
      </article>

      @if (isFullscreen()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-rp-base/95 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen project preview"
          (click)="closeFullscreenOnBackdrop($event)"
        >
          <img
            [src]="proj.previewImages[carouselIndex()]"
            [alt]="proj.title + ' preview ' + (carouselIndex() + 1)"
            class="max-h-full max-w-full object-contain"
          />
          <button
            type="button"
            class="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-rp-surface text-rp-text border border-rp-overlay hover:text-rp-gold hover:border-rp-gold transition-colors"
            (click)="closeFullscreen()"
            aria-label="Close fullscreen preview"
          >
            <span class="material-icons text-xl" aria-hidden="true">close</span>
          </button>
        </div>
      }
    }
  `,
})
export class ProjectDetailComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private portfolio = inject(PortfolioService);
  private sanitizer = inject(DomSanitizer);
  protected readonly summaryRenderer = inject(SummaryRendererService);

  @ViewChild('diagramContainer') diagramContainer!: ElementRef<HTMLDivElement>;

  readonly project = signal<Project | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly carouselIndex = signal(0);
  readonly isFullscreen = signal(false);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.loadProject(id);
    } else {
      this.error.set('No project ID provided');
      this.loading.set(false);
    }
  }

  async ngAfterViewInit(): Promise<void> {
    // Initialize mermaid after view init
    if (this.project()?.sections.some(s => s.content.includes('```mermaid'))) {
      await this.initMermaid();
    }
  }

  private async loadProject(id: string): Promise<void> {
    try {
      const project = await this.portfolio.getProjectById(id);
      if (project) {
        this.project.set(project);
        this.carouselIndex.set(0);
      } else {
        this.error.set(`Project "${id}" not found`);
      }
    } catch (err) {
      this.error.set('Failed to load project');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  private async initMermaid(): Promise<void> {
    try {
      const mermaid = await import('mermaid');
      mermaid.default.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
          primaryColor: '#252336',
          primaryTextColor: '#e8e6f0',
          primaryBorderColor: '#3d3958',
          lineColor: '#a09abf',
          secondaryColor: '#1e1c29',
          tertiaryColor: '#3d3958',
          background: '#1e1c29',
          mainBkg: '#252336',
          secondBkg: '#3d3958',
          tertiaryBkg: '#1e1c29',
        },
      });
      await mermaid.default.run({ nodes: this.diagramContainer?.nativeElement ? [this.diagramContainer.nativeElement] : [] });
    } catch (e) {
      console.warn('Mermaid initialization failed:', e);
    }
  }

  hasMermaidDiagram(): boolean {
    return this.project()?.sections.some(s => s.content.includes('```mermaid')) ?? false;
  }

  // Render markdown using marked + DOMPurify for safe HTML output
  renderMarkdown(markdown: string): SafeHtml {
    if (!markdown) return this.sanitizer.bypassSecurityTrustHtml('');

    // Extract and remove mermaid blocks for separate rendering
    const cleanMarkdown = markdown.replace(/```mermaid[\s\S]*?```/g, '');

    const html = marked.parse(cleanMarkdown);
    const cleanHtml = DOMPurify.sanitize(html as string);
    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  }

  // Render mermaid diagrams (returns HTML for mermaid.js to process)
  renderMermaidDiagrams(): SafeHtml {
    const proj = this.project();
    if (!proj) return this.sanitizer.bypassSecurityTrustHtml('');

    const diagrams: string[] = [];
    for (const section of proj.sections) {
      const matches = section.content.match(/```mermaid\n?([\s\S]*?)```/g);
      if (matches) {
        for (const match of matches) {
          const diagramCode = match.replace(/```mermaid\n?/, '').replace(/```/, '').trim();
          diagrams.push(`<div class="mermaid">${diagramCode}</div>`);
        }
      }
    }

    return this.sanitizer.bypassSecurityTrustHtml(diagrams.join('\n'));
  }

  // Tag pastel classes - different colors to make them pop
  getTagClass(index: number): string {
    const classes = ['tag-rose', 'tag-foam', 'tag-pine', 'tag-gold', 'tag-iris', 'tag-love'];
    return classes[index % classes.length];
  }

  // Format date for datetime attribute (ISO format)
  formatDateForTime(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const months: Record<string, string> = {
      january: '01', february: '02', march: '03', april: '04',
      may: '05', june: '06', july: '07', august: '08',
      september: '09', october: '10', november: '11', december: '12'
    };
    const match = dateStr.match(/(\d{1,2})\s+(\w+),\s+(\d{4})/i);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = months[match[2].toLowerCase()] || '01';
      const year = match[3];
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  }

  formatProjectDate(project: Project): string {
    if (project.lastCommitDate) {
      const date = new Date(project.lastCommitDate);
      if (!Number.isNaN(date.getTime())) {
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(date);
      }
    }

    return project.date || 'Date unavailable';
  }

  detailSections(sections: Project['sections']): Project['sections'] {
    return sections.filter(section => section.id !== 'tags');
  }

  previousPreview(total: number): void {
    this.carouselIndex.update(index => index === 0 ? total - 1 : index - 1);
  }

  nextPreview(total: number): void {
    this.carouselIndex.update(index => (index + 1) % total);
  }

  goToPreview(index: number): void {
    this.carouselIndex.set(index);
  }

  openFullscreen(): void {
    this.isFullscreen.set(true);
  }

  closeFullscreen(): void {
    this.isFullscreen.set(false);
  }

  closeFullscreenOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeFullscreen();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeFullscreen();
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"%3E%3Crect fill="%232d2a3f" width="800" height="450"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="18" fill="%236e6a86"%3EImage not found%3C/text%3E%3C/svg%3E';
    img.alt = `${this.project()?.title || 'Project'} preview (placeholder)`;
  }
}