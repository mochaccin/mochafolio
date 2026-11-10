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
      title: repoName,
      summary: fm.summary,
      tags: fm.tags,
      featured: fm.featured ?? false,
      previewImages: fm.previewImages ?? [`preview/1.png`],
      date: fm.date,
      lastCommitDate: fm.lastCommitDate,
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

    frontmatter.summary = this.inferSummary(markdown, frontmatter.title);
    if (!frontmatter.summary) {
      frontmatter.summary = `Project: ${frontmatter.title}`;
    }
    const featuredMatch = markdown.match(/<!--\s*featured\s*:\s*(true|false)\s*-->/i);
    if (featuredMatch) {
      frontmatter.featured = featuredMatch[1].toLowerCase() === 'true';
    }

    // Tags from the complete ## Tags section, preserving the author's casing.
    const tagsHeading = markdown.match(/^##\s+Tags\s*$/im);
    if (tagsHeading && tagsHeading.index !== undefined) {
      const contentStart = tagsHeading.index + tagsHeading[0].length;
      const remaining = markdown.slice(contentStart);
      const nextHeadingIndex = remaining.search(/^##\s+/m);
      const tagsContent = nextHeadingIndex === -1
        ? remaining
        : remaining.slice(0, nextHeadingIndex);
      const tags = tagsContent
        .split('\n')
        .map(l => l.trim().replace(/^[-*]\s+/, ''))
        .filter(l => l.length > 0);
      if (tags.length > 0) {
        frontmatter.tags = tags;
      }
    }

    return frontmatter;
  }

  private inferSummary(markdown: string, title: string): string {
    const titleMatch = markdown.match(/^#\s+.+$/m);
    const content = titleMatch
      ? markdown.slice((titleMatch.index ?? 0) + titleMatch[0].length)
      : markdown;
    const beforeFirstSection = content.split(/^##\s+/m, 1)[0];

    for (const line of beforeFirstSection.split('\n')) {
      const trimmed = line.trim();
      if (
        trimmed &&
        !trimmed.startsWith('#') &&
        !trimmed.startsWith('<!--') &&
        !trimmed.startsWith('>')
      ) {
        return trimmed;
      }
    }

    return `Project: ${title}`;
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
          const visibleContent = this.removeHtmlComments(sectionContent);
          if (visibleContent) {
            sections.push({
              id: this.slugify(lastHeading.title),
              title: this.normalizeSectionTitle(lastHeading.title),
              content: visibleContent,
            });
          }
      }

      lastHeading = { title: headingTitle, index: headingIndex + match[0].length };
    }

    if (lastHeading) {
      const sectionContent = content.slice(lastHeading.index).trim();
      const visibleContent = this.removeHtmlComments(sectionContent);
      if (visibleContent) {
        sections.push({
          id: this.slugify(lastHeading.title),
          title: this.normalizeSectionTitle(lastHeading.title),
          content: visibleContent,
        });
      }
    }

    return sections.filter(s => s.content.length > 0);
  }

  private removeHtmlComments(content: string): string {
    return content.replace(/<!--[\s\S]*?-->/g, '').trim();
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