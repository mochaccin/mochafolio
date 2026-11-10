#!/usr/bin/env node
/**
 * Build-time portfolio data generator
 * Fetches all public repos from mochaccin, parses PORTFOLIO.md files,
 * and outputs src/assets/portfolio-data.json for static consumption.
 *
 * Run with: node scripts/generate-portfolio.js
 * Requires GITHUB_TOKEN env var (read-only public repo access)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OWNER = 'mochaccin';
const BASE_URL = 'https://api.github.com';
const OUTPUT_PATH = path.join(__dirname, '../src/assets/portfolio-data.json');

const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error('ERROR: GITHUB_TOKEN environment variable required');
  process.exit(1);
}

function request(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${TOKEN}`,
        'User-Agent': 'mochafolio-generator'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        } else {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        }
      });
    }).on('error', reject);
  });
}

function parseFrontmatter(markdown) {
  const fmMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    // No frontmatter - infer from content
    return { frontmatter: inferFromContent(markdown), content: markdown };
  }

  const fmContent = fmMatch[1];
  const content = markdown.slice(fmMatch[0].length).trimStart();
  const frontmatter = {};

  for (const line of fmContent.split('\n')) {
    const [key, ...rest] = line.split(':');
    if (!key || rest.length === 0) continue;
    const value = rest.join(':').trim();

    switch (key.trim()) {
      case 'title':
      case 'summary':
      case 'date':
      case 'githubUrl':
      case 'demoUrl':
        frontmatter[key.trim()] = value.replace(/^["']|["']$/g, '');
        break;
      case 'tags':
      case 'previewImages':
        const trimmed = value.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          frontmatter[key.trim()] = trimmed.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
        } else {
          frontmatter[key.trim()] = trimmed.split(/\s+/).filter(Boolean);
        }
        break;
      case 'featured':
        frontmatter.featured = value.toLowerCase() === 'true';
        break;
    }
  }

  return { frontmatter, content };
}

function inferFromContent(markdown) {
  const frontmatter = {};

  // Title from first # heading
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    frontmatter.title = titleMatch[1].trim();
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

function extractSections(content) {
  const sections = [];
  const headingRegex = /^##\s+(.+)$/gm;
  let match;
  let lastHeading = null;

  const sectionMap = {
    'problem': 'Problem',
    'solution': 'Solution',
    'architecture': 'Architecture',
    'how it works': 'How It Works',
    'how to run it': 'How to Run It',
    'comments': 'Comments',
  };

  while ((match = headingRegex.exec(content)) !== null) {
    const headingTitle = match[1].trim();
    const headingIndex = match.index;

    if (lastHeading) {
      const sectionContent = content.slice(lastHeading.index, headingIndex).trim();
      if (sectionContent) {
        sections.push({
          id: lastHeading.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          title: sectionMap[lastHeading.title.toLowerCase()] || lastHeading.title,
          content: sectionContent
        });
      }
    }

    lastHeading = { title: headingTitle, index: headingIndex + match[0].length };
  }

  if (lastHeading) {
    const sectionContent = content.slice(lastHeading.index).trim();
    if (sectionContent) {
      sections.push({
        id: lastHeading.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        title: sectionMap[lastHeading.title.toLowerCase()] || lastHeading.title,
        content: sectionContent
      });
    }
  }

  return sections.filter(s => s.content.length > 0);
}

async function main() {
  console.log('Fetching public repos...');
  const repos = await request(`${BASE_URL}/users/${OWNER}/repos?per_page=100&sort=updated`);
  const publicRepos = repos.filter(r => !r.private && !r.fork && !r.archived);
  console.log(`Found ${publicRepos.length} public non-fork non-archived repos`);

  const projects = [];

  for (const repo of publicRepos) {
    console.log(`\nProcessing ${repo.name}...`);

    try {
      // Get PORTFOLIO.md
      const fileRes = await request(`${BASE_URL}/repos/${OWNER}/${repo.name}/contents/PORTFOLIO.md`);
      if (!fileRes || fileRes.type !== 'file' || !fileRes.content) {
        console.warn(`  No PORTFOLIO.md found, skipping`);
        continue;
      }

      const markdown = fileRes.encoding === 'base64' ? Buffer.from(fileRes.content, 'base64').toString('utf-8') : fileRes.content;

      let lastCommitDate = repo.updated_at;
      try {
        const commits = await request(`${BASE_URL}/repos/${OWNER}/${repo.name}/commits?per_page=1`);
        const latestCommit = Array.isArray(commits) ? commits[0]?.commit : null;
        lastCommitDate = latestCommit?.author?.date || latestCommit?.committer?.date || lastCommitDate;
      } catch (error) {
        console.warn(`  Could not fetch last commit date; using repository update date`);
      }

      // Get preview images from GitHub
      let previewImages = [];
      try {
        const previewRes = await request(`${BASE_URL}/repos/${OWNER}/${repo.name}/contents/preview`);
        if (Array.isArray(previewRes)) {
          previewImages = previewRes
            .filter(f => f.type === 'file' && /\.(png|jpg|jpeg|webp|svg)$/i.test(f.name))
            .sort((a, b) => {
              const na = parseInt(a.name.match(/\d+/)?.[0] || '0', 10);
              const nb = parseInt(b.name.match(/\d+/)?.[0] || '0', 10);
              return na - nb;
            })
            .map(f => `https://raw.githubusercontent.com/${OWNER}/${repo.name}/main/preview/${f.name}`);
        }
      } catch (e) {
        // preview folder doesn't exist
      }

      // Fallback: check local public/preview for this repo
      if (previewImages.length === 0) {
        const localPreviewDir = path.join(__dirname, '../public/preview');
        if (fs.existsSync(localPreviewDir)) {
          const localFiles = fs.readdirSync(localPreviewDir)
            .filter(f => /\.(png|jpg|jpeg|webp|svg)$/i.test(f))
            .sort((a, b) => {
              const na = parseInt(a.match(/\d+/)?.[0] || '0', 10);
              const nb = parseInt(b.match(/\d+/)?.[0] || '0', 10);
              return na - nb;
            });
          if (localFiles.length > 0) {
            previewImages = localFiles.map(f => `preview/${f}`);
          }
        }
      }

      if (previewImages.length === 0) {
        throw new Error(`Missing preview/1.png (at least one preview image required)`);
      }

      // Parse markdown
      const { frontmatter, content } = parseFrontmatter(markdown);
      const sections = extractSections(content);

      // Validate required fields - infer from repo name if missing
      if (!frontmatter.title) {
        frontmatter.title = repo.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
      if (!frontmatter.summary) {
        frontmatter.summary = `Project: ${frontmatter.title}`;
      }
      if (!frontmatter.tags || frontmatter.tags.length === 0) {
        frontmatter.tags = [];
      }

      const project = {
        id: repo.name,
        title: repo.name,
        summary: frontmatter.summary,
        tags: frontmatter.tags,
        featured: frontmatter.featured ?? false,
        previewImages,
        date: frontmatter.date,
        lastCommitDate,
        githubUrl: frontmatter.githubUrl ?? `https://github.com/${OWNER}/${repo.name}`,
        demoUrl: frontmatter.demoUrl,
        sections,
        rawMarkdown: markdown
      };

      projects.push(project);
      console.log(`  Added: ${project.title} (${project.sections.length} sections, ${project.previewImages.length} images)`);

    } catch (error) {
      console.error(`  Error: ${error.message}`);
    }
  }

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write output
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify({ projects, generatedAt: new Date().toISOString() }, null, 2));
  console.log(`\nGenerated ${OUTPUT_PATH} with ${projects.length} projects`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});