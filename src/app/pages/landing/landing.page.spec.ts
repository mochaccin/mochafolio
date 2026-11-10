import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingPage } from './landing.page';
import { PortfolioService } from '../../core';

describe('LandingPage', () => {
  const createTestModule = (portfolioSpy: {
    getFeaturedProjects: () => Promise<any[]>;
    loadBadges: () => Promise<any[]>
  }) => {
    TestBed.resetTestingModule();
    return TestBed.configureTestingModule({
      imports: [LandingPage],
      providers: [
        provideRouter([]),
        { provide: PortfolioService, useValue: portfolioSpy }
      ]
    }).compileComponents();
  };

  const createComponent = async () => {
    const fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  };

  it('should create', async () => {
    await createTestModule({
      getFeaturedProjects: () => Promise.resolve([]),
      loadBadges: () => Promise.resolve([])
    });
    const fixture = await createComponent();
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should have correct name and greeting', async () => {
    await createTestModule({
      getFeaturedProjects: () => Promise.resolve([]),
      loadBadges: () => Promise.resolve([])
    });
    const fixture = await createComponent();
    const component = fixture.componentInstance;
    expect(component.name()).toBe('Nicolás Pelizari');
    expect(component.greeting()).toBe("Hallo! I'm");
  });

  it('should load featured projects', async () => {
    await createTestModule({
      getFeaturedProjects: () => Promise.resolve([
        { id: 'project-1', title: 'Project One', summary: 'Summary', tags: ['Angular'], featured: true, previewImages: ['preview/1.png'] },
        { id: 'project-2', title: 'Project Two', summary: 'Summary', tags: ['React'], featured: true, previewImages: ['preview/2.png'] }
      ] as any[]),
      loadBadges: () => Promise.resolve([])
    });
    const fixture = await createComponent();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    expect(component.featuredProjects().length).toBe(2);
  });

  it('should load badges from JSON', async () => {
    await createTestModule({
      getFeaturedProjects: () => Promise.resolve([]),
      loadBadges: () => Promise.resolve([
        { name: 'Badge 1', technology: 'Tech 1', url: 'http://example.com/1', icon: '' },
        { name: 'Badge 2', technology: 'Tech 2', url: 'http://example.com/2', icon: '' }
      ])
    });
    const fixture = await createComponent();
    await fixture.whenStable();
    const component = fixture.componentInstance;

    expect(component.badges().length).toBe(2);
    expect(component.badges()[0].name).toBe('Badge 1');
    expect(component.badgesLoaded()).toBe(true);
  });

  it('getTagClass should return different classes', async () => {
    await createTestModule({
      getFeaturedProjects: () => Promise.resolve([]),
      loadBadges: () => Promise.resolve([])
    });
    const fixture = await createComponent();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    const class0 = component.getTagClass(0);
    const class1 = component.getTagClass(1);
    expect(class0).not.toBe(class1);
  });

  it('should handle badge loading error gracefully', async () => {
    await createTestModule({
      getFeaturedProjects: () => Promise.resolve([]),
      loadBadges: () => Promise.reject(new Error('Network error'))
    });
    const fixture = await createComponent();
    await fixture.whenStable();
    const component = fixture.componentInstance;

    expect(component.badgesLoaded()).toBe(true);
    expect(component.badges().length).toBe(0);
  });
});