import { Component, computed, inject, signal, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  selector: 'app-root',
  template: `
    <div class="page-container flex flex-col min-h-screen">
      <header
        class="sticky top-0 z-50 h-[50px] md:h-[60px] transition-all duration-300 mx-auto w-full max-w-[1536px]"
        [class.scrolled]="isScrolled()"
        [class.header-transparent]="!isScrolled()"
        [class.header-glass]="isScrolled()"
        role="banner"
      >
        <nav class="terminal-nav flex items-center justify-between flex-shrink-0 px-3 sm:px-4 h-full" aria-label="Terminal navigation">
          <div class="prompt flex items-center gap-1 text-lg font-medium text-rp-text whitespace-nowrap">
            <span class="prompt-user text-rp-pine font-medium">nico@mochafolio</span>
            <span class="prompt-separator text-rp-muted"></span>
            <span class="prompt-path flex items-center gap-1">
              <a routerLink="/" class="path-root text-rp-gold font-medium text-base decoration-none hover:text-rp-gold transition-colors" aria-label="Home">~</a>
              <span class="path-separator text-rp-subtle text-xl font-medium mx-0.5" aria-hidden="true">/</span>
              @for (segment of pathSegments(); track segment; let i = $index) {
                @if (i > 0) {
                  <span class="path-separator text-rp-subtle text-xl font-medium mx-0.5" aria-hidden="true">/</span>
                }
                <a [routerLink]="['/' + pathSegments().slice(0, i + 1).join('/')]" class="path-current text-rp-text hover:text-rp-gold transition-colors">{{ segment }}</a>
              }
            </span>
            <span class="cursor-block inline-block w-2 h-[1.2em] bg-rp-gold ml-1 vertical-align-bottom animate-cursor-fade" aria-hidden="true"></span>
          </div>

          <nav class="main-nav flex gap-2 items-center justify-center" aria-label="Main navigation">
            <a routerLink="/projects" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="text-lg font-medium text-rp-subtle decoration-none px-3 py-1.5 transition-colors whitespace-nowrap hover:text-rp-gold">Projects</a>
          </nav>
        </nav>
      </header>

      <main class="main-content flex-1 p-8 sm:p-12 pb-20" role="main" id="main-content" aria-label="Main content">
        <div class="container mx-auto max-w-[1280px] px-4 sm:px-6">
          <router-outlet />
        </div>
      </main>

      <footer class="footer bg-rp-surface/80 py-6 px-4 sm:px-6 mt-16 sm:mt-24" role="contentinfo">
        <div class="container mx-auto max-w-[1280px] flex flex-col items-center gap-3 md:flex-row md:justify-between md:items-center md:text-left md:gap-8">
          <div class="footer-left flex flex-col items-start gap-1 md:flex-col md:items-right md:gap-1 md:text-left">
            <p class="copyright text-sm text-rp-subtle">© {{ currentYear }} mochaccin</p>
            <p class="status flex items-center gap-1.5 text-xs text-rp-subtle">
              <span class="status-indicator w-1.5 h-1.5 bg-rp-pine rounded-full animate-ping-slow" aria-hidden="true"></span>
              <span>Last updated Nov 2026</span>
            </p>
          </div>
          <div class="footer-right flex items-center gap-3">
            <a href="https://github.com/mochaccin" target="_blank" rel="noopener noreferrer" aria-label="GitHub" class="social-link">
              <span class="iconify text-base" data-icon="mdi:github" aria-hidden="true"></span>
            </a>
            <a href="https://www.linkedin.com/in/npelizari/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" class="social-link">
              <span class="iconify text-base" data-icon="mdi:linkedin" aria-hidden="true"></span>
            </a>
            <a href="mailto:nicolas.pelizari@gmail.com" class="social-link" aria-label="Email">
              <span class="material-icons text-base" aria-hidden="true">mail</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class App implements OnDestroy {
  protected readonly title = 'mochafolio';
  protected readonly currentYear = new Date().getFullYear();

  private router = inject(Router);
  private readonly currentUrl = signal(this.router.url);
  private readonly isScrolled = signal(false);
  private readonly platformId = inject(PLATFORM_ID);
  private scrollHandler: (() => void) | null = null;

  constructor() {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects)
    ).subscribe(url => this.currentUrl.set(url));

    // Scroll detection for header glass effect
    if (isPlatformBrowser(this.platformId)) {
      this.scrollHandler = () => {
        this.isScrolled.set(window.scrollY > 10);
      };
      window.addEventListener('scroll', this.scrollHandler!, { passive: true });
    }
  }

  ngOnDestroy(): void {
    if (this.scrollHandler && isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
  }

  protected readonly currentPath = computed(() => this.currentUrl());
  protected readonly currentPathDisplay = computed(() => {
    const path = this.currentPath();
    // At root, just show ~
    if (path === '/' || path === '') return '~';
    // Split path into segments and create clickable parts
    const segments = path.split('/').filter(Boolean);
    // Join with ' / ' separator for display
    return segments.join(' / ');
  });

  // Get path segments as array for template iteration
  protected readonly pathSegments = computed(() => {
    const path = this.currentPath();
    if (path === '/' || path === '') return [];
    return path.split('/').filter(Boolean);
  });
}