import { Injectable, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

@Injectable({ providedIn: 'root' })
export class SummaryRendererService {
  private readonly sanitizer = inject(DomSanitizer);

  render(summary: string): SafeHtml {
    const markdown = summary.replace(/==([^=\n]+)==/g, '<mark class="summary-highlight">$1</mark>');
    const html = marked.parseInline(markdown);
    const cleanHtml = DOMPurify.sanitize(html as string);
    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  }
}
