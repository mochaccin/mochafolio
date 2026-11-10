import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing.page').then(m => m.LandingPage)
  },
  {
    path: 'projects',
    loadComponent: () => import('./pages/projects/projects.page').then(m => m.ProjectsPage)
  },
  {
    path: 'projects/:id',
    loadComponent: () => import('./pages/projects/project-detail/project-detail.component').then(m => m.ProjectDetailComponent)
  },
  { path: '**', redirectTo: '' }
];