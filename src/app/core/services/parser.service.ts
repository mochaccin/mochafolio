import { Injectable } from '@angular/core';
import { ParsedPortfolio, PortfolioFrontmatter, PortfolioSection, Project } from '../models/portfolio';

@Injectable({ providedIn: 'root' })
export class ParserService {
  private readonly sectionMap: Record<string, string> = {
    'problem': 'Problem',
    'solution': 'Solution',
    'architecture': 'Architecture',
    'how it works': 'How It Works',
    'how to run it': 'How to Run It',
    'comments': 'Comments',
  };

  parse(markdown: string, repoName: string): ParsedPortfolio {
    const { frontmatter, content } = this.extractFrontmatter(markdown, repoName);
    const sections = this.extractSections(content);

    return {
      frontmatter,
      sections,
      rawMarkdown: markdown,
    };
  }

  toProject(parsed: ParsedPortfolio, repoName: string): Project {
    const fm = parsed.frontmatter;
    return {
      id: repoName,
      title: fm.title,
      summary: fm.summary,
      tags: fm.tags,
      featured: fm.featured ?? false,
      previewImages: fm.previewImages ?? [`preview/1.png`],
      date: fm.date,
      githubUrl: fm.githubUrl ?? `https://github.com/mochaccin/${repoName}`,
      demoUrl: fm.demoUrl,
      sections: parsed.sections,
      rawMarkdown: parsed.rawMarkdown,
    };
  }

  private extractFrontmatter(markdown: string, repoName: string): { frontmatter: PortfolioFrontmatter; content: string } {
    const fmMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) {
      // No frontmatter - infer from content
      const inferred = this.inferFromContent(markdown, repoName);
      return { frontmatter: inferred, content: markdown };
    }

    const fmContent = fmMatch[1];
    const content = markdown.slice(fmMatch[0].length).trimStart();
    const frontmatter: Partial<PortfolioFrontmatter> = {};

    for (const line of fmContent.split('\n')) {
      const [key, ...rest] = line.split(':');
      if (!key || rest.length === 0) continue;
      const value = rest.join(':').trim();

      switch (key.trim()) {
        case 'title':
          frontmatter.title = value.replace(/^["']|["']$/g, '');
          break;
        case 'summary':
          frontmatter.summary = value.replace(/^["']|["']$/g, '');
          break;
        case 'tags':
          frontmatter.tags = this.parseArray(value);
          break;
        case 'featured':
          frontmatter.featured = value.toLowerCase() === 'true';
          break;
        case 'date':
          frontmatter.date = value.replace(/^["']|["']$/g, '');
          break;
        case 'githubUrl':
          frontmatter.githubUrl = value.replace(/^["']|["']$/g, '');
          break;
        case 'demoUrl':
          frontmatter.demoUrl = value.replace(/^["']|["']$/g, '');
          break;
        case 'previewImages':
          frontmatter.previewImages = this.parseArray(value);
          break;
      }
    }

    // Apply defaults for missing required fields
    if (!frontmatter.title) {
      frontmatter.title = repoName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    if (!frontmatter.summary) {
      frontmatter.summary = `Project: ${frontmatter.title}`;
    }
    if (!frontmatter.tags || frontmatter.tags.length === 0) {
      frontmatter.tags = [];
    }

    return { frontmatter: frontmatter as PortfolioFrontmatter, content };
  }

  private inferFromContent(markdown: string, repoName: string): PortfolioFrontmatter {
    const frontmatter: PortfolioFrontmatter = {
      title: '',
      summary: '',
      tags: [],
    };

    // Title from first # heading
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      frontmatter.title = titleMatch[1].trim();
    } else {
      frontmatter.title = repoName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    // Summary from first blockquote > or first paragraph
    const blockquoteMatch = markdown.match(/^>\s*(.+)$/m);
    if (blockquoteMatch) {
      frontmatter.summary = blockquoteMatch[1].trim();
    } else {
      // Find first non-heading, non-empty paragraph
      const lines = markdown.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('>') && !trimmed.startsWith('##')) {
          frontmatter.summary = trimmed;
          break;
        }
      }
    }
    if (!frontmatter.summary) {
      frontmatter.summary = `Project: ${frontmatter.title}`;
    }

    // Tags from ## Tags section
    const tagsMatch = markdown.match(/^##\s*Tags\s*\n([\s\S]*?)(?:\n##|\n#|$)/im);
    if (tagsMatch) {
      const tagsContent = tagsMatch[1];
      const tags = tagsContent
        .split('\n')
        .map(l => l.trim().replace(/^[-*]\s*/, ''))
        .filter(l => l.length > 0);
      if (tags.length > 0) {
        frontmatter.tags = tags;
      }
    }

    return frontmatter;
  }

  private parseArray(value: string): string[] {
    const trimmed = value.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      return trimmed.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
    }
    return trimmed.split(/\s+/).filter(Boolean);
  }

  private extractSections(content: string): PortfolioSection[] {
    const sections: PortfolioSection[] = [];
    const headingRegex = /^##\s+(.+)$/gm;
    let match: RegExpExecArray | null;
    let lastHeading: { title: string; index: number } | null = null;

    while ((match = headingRegex.exec(content)) !== null) {
      const headingTitle = match[1].trim();
      const headingIndex = match.index;

      if (lastHeading) {
        const sectionContent = content.slice(lastHeading.index, headingIndex).trim();
        if (sectionContent) {
          sections.push({
            id: this.slugify(lastHeading.title),
            title: this.normalizeSectionTitle(lastHeading.title),
            content: sectionContent,
          });
        }
      }

      lastHeading = { title: headingTitle, index: headingIndex + match[0].length };
    }

    if (lastHeading) {
      const sectionContent = content.slice(lastHeading.index).trim();
      if (sectionContent) {
        sections.push({
          id: this.slugify(lastHeading.title),
          title: this.normalizeSectionTitle(lastHeading.title),
          content: sectionContent,
        });
      }
    }

    return sections.filter(s => s.content.length > 0);
  }

  private normalizeSectionTitle(title: string): string {
    const lower = title.toLowerCase();
    return this.sectionMap[lower] ?? title;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}