export interface PortfolioFrontmatter {
  title: string;
  summary: string;
  tags: string[];
  featured?: boolean;
  date?: string;
  githubUrl?: string;
  demoUrl?: string;
  previewImages?: string[];
}

export interface PortfolioSection {
  id: string;
  title: string;
  content: string;
}

export interface Project {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  featured: boolean;
  previewImages: string[];
  date?: string;
  githubUrl?: string;
  demoUrl?: string;
  sections: PortfolioSection[];
  rawMarkdown: string;
}

export interface ParsedPortfolio {
  frontmatter: PortfolioFrontmatter;
  sections: PortfolioSection[];
  rawMarkdown: string;
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  private: boolean;
  fork: boolean;
  archived: boolean;
  html_url: string;
  description: string | null;
  updated_at: string;
}