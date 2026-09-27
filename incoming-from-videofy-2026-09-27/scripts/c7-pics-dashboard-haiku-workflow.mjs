#!/usr/bin/env node

/**
 * C7-PICS Dashboard Build Workflow
 *
 * 4-Haiku parallelized work + Opus 5 reconciliation
 * Result pages (Results table, status filters, detail panel)
 * Evidence Vault pages (responsive grid, lightbox, metadata)
 *
 * Design Target: 99%+ alignment with C7 design tokens and Figma spec
 */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

interface AgentTask {
  agent: number;
  model: "claude-haiku-4-5-20251001";
  title: string;
  description: string;
  files: string[];
  outputDir: string;
}

const AGENT_TASKS: AgentTask[] = [
  {
    agent: 1,
    model: "claude-haiku-4-5-20251001",
    title: "DataTable Component (Base + Results)",
    description: `
Build the reusable DataTable component for C7-PICS dashboard.
- Sortable columns (click header to sort ASC/DESC)
- Sticky header on scroll
- Responsive table layout
- Status color coding (GREEN for votes, semantic colors for statuses)
- Export to CSV functionality
- Pagination controls (if >50 rows)

Output:
1. /components/DataTable.tsx - Main table component
2. /components/DataTable.module.css - Styles using design tokens
3. /components/DataTable.test.tsx - Unit tests

Design Requirements:
- Use CSS custom properties from styles.css (--ink, --text, --accent, --line)
- Column alignment: ID/timestamps left, vote counts center, status right
- Vote counts in #7ee0c2 (--accent-warm) for visual emphasis
- Row hover state with --line-bright background
- Sticky header: --ink-3 background, shadow beneath
- Border between header and body: --line color
- Font: Inter, 15-17px responsive sizing
- Padding: 12px per cell (fluid: clamp(10px, 1vw, 14px))
`,
    files: [
      "/apps/ecosystem-web/src/components/DataTable.tsx",
      "/apps/ecosystem-web/src/components/DataTable.module.css",
      "/apps/ecosystem-web/src/components/DataTable.test.tsx",
    ],
    outputDir: "haiku-agent-1",
  },

  {
    agent: 2,
    model: "claude-haiku-4-5-20251001",
    title: "Results Page - Filters & Detail Panel",
    description: `
Build the Results page UI structure and filtering logic.
- Status filter tabs (ALL, PENDING 4, VERIFIED 5, FLAGGED 1)
- Tab counts and visual indicators
- Detail panel (right side or modal)
- Verification actions in detail panel (Verify, Flag, Review, Export)
- Tab styling matches existing C7 patterns

Output:
1. /pages/ResultsPage.tsx - Page container & layout
2. /components/StatusFilterTabs.tsx - Filter tab group
3. /components/ResultsDetailPanel.tsx - Detail view for selected row
4. /pages/ResultsPage.module.css - Layout styles
5. Mock data generator for testing

Design Requirements:
- Tabs: Horizontal pill-style, --accent color for active
- Count badges: Semantic colors (--accent-warm for verified, --amber for pending)
- Tab borders: --line-bright on hover
- Detail panel: Sliding or modal with --ink-2 background
- Action buttons: --accent background, darker on hover
- Typography: Match existing page headers (h2 styling from styles.css)
- Spacing: Fluid gaps using clamp()
- Grid layout: 1 col (mobile) → 2 col (desktop) with DataTable + panel

API Contract:
  GET /api/dashboard/results?status=PENDING|VERIFIED|FLAGGED&sort=column&order=ASC|DESC
  Response: { results: Array<ResultRow>, total: number, counts: Record<status, number> }
`,
    files: [
      "/apps/ecosystem-web/src/pages/ResultsPage.tsx",
      "/apps/ecosystem-web/src/components/StatusFilterTabs.tsx",
      "/apps/ecosystem-web/src/components/ResultsDetailPanel.tsx",
      "/apps/ecosystem-web/src/pages/ResultsPage.module.css",
      "/apps/ecosystem-web/src/mockData/resultsData.ts",
    ],
    outputDir: "haiku-agent-2",
  },

  {
    agent: 3,
    model: "claude-haiku-4-5-20251001",
    title: "Evidence Vault - Grid & Responsive Layout",
    description: `
Build the responsive Evidence Vault grid component with thumbnail display.
- 4-column grid (desktop), 2-column (tablet), 1-column (mobile)
- Status badges on each thumbnail (VERIFIED green, PENDING orange, FLAGGED red, FILED gray)
- Thumbnail images with lazy loading
- Evidence metadata display (file size, upload date, type)
- Grid maintains 16:9 aspect ratio for thumbnails

Output:
1. /components/EvidenceGrid.tsx - Grid layout component
2. /components/EvidenceThumbnail.tsx - Individual thumbnail card
3. /components/StatusBadge.tsx - Status badge component (reusable)
4. /components/EvidenceGrid.module.css - Grid & thumbnail styles
5. /components/StatusBadge.module.css - Badge styles
6. /components/EvidenceGrid.test.tsx - Grid tests

Design Requirements:
- Grid: CSS Grid with gap clamp(16px, 2vw, 24px)
- Responsive: grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))
- Thumbnail: 16:9 aspect-ratio, --radius corners, --line border
- Thumbnail hover: scale(1.02), shadow increase
- Status badges: Absolute positioned, bottom-right corner
- Badge colors: VERIFIED=#7ee0c2 (--accent-warm), PENDING=#f0c25e (--amber), FLAGGED=#ff6b6b, FILED=#666
- Badge size: 24px diameter, white text, bold
- Metadata: Small text below thumbnail (--text-dim), right-aligned
- Image: object-fit: cover, lazy loading with placeholder
- Cursor: pointer on hover

Grid Responsive Breakpoints (no stepped breakpoints, use clamp):
- Desktop: 4 cols (12-24px gap)
- Tablet (768px): 2 cols
- Mobile (320px): 1 col
`,
    files: [
      "/apps/ecosystem-web/src/components/EvidenceGrid.tsx",
      "/apps/ecosystem-web/src/components/EvidenceThumbnail.tsx",
      "/apps/ecosystem-web/src/components/StatusBadge.tsx",
      "/apps/ecosystem-web/src/components/EvidenceGrid.module.css",
      "/apps/ecosystem-web/src/components/StatusBadge.module.css",
      "/apps/ecosystem-web/src/components/EvidenceGrid.test.tsx",
    ],
    outputDir: "haiku-agent-3",
  },

  {
    agent: 4,
    model: "claude-haiku-4-5-20251001",
    title: "Evidence Vault Page - Filters, Lightbox & Metadata",
    description: `
Build the Evidence Vault page with filter tabs, lightbox viewer, and metadata panel.
- Filter tabs: ALL, VERIFIED, PENDING, FLAGGED, FILED
- Evidence count per filter
- Full-screen lightbox viewer (click thumbnail to open)
- Lightbox controls: prev/next, close, download button
- Metadata panel in lightbox (filename, upload date, size, uploader, notes)
- Image viewer with zoom, pan capabilities
- Close on ESC key

Output:
1. /pages/EvidenceVaultPage.tsx - Page container
2. /components/EvidenceFilterTabs.tsx - Filter tabs (reuse StatusFilterTabs pattern)
3. /components/EvidenceLightbox.tsx - Full-screen lightbox viewer
4. /components/MetadataPanel.tsx - Evidence metadata display
5. /pages/EvidenceVaultPage.module.css - Page layout
6. /components/EvidenceLightbox.module.css - Lightbox styles
7. Lightbox keyboard & touch handlers

Design Requirements:
- Page layout: Header + filter tabs + grid
- Lightbox: Full viewport, --ink overlay (opacity 0.95), white content area
- Lightbox controls: Top-right close button, bottom controls bar
- Controls bar: Navigation (prev/next), download button, metadata toggle
- Metadata panel: Slide from right or expand in controls
- Metadata: Dark background (--ink-3), white text, 2-column layout
- Navigation buttons: --accent background, --ink-3 on hover
- Close button: Large X, --text color
- Keyboard: ArrowLeft/Right for nav, ESC to close, Enter to download
- Touch: Swipe left/right for nav, tap close area to close
- Zoom: Mouse wheel or pinch to zoom (1x to 3x)
- Pan: Drag when zoomed

Lightbox Transition:
- Open: Thumbnail position to center (CSS transform + opacity)
- Close: Center back to thumbnail position
- Use transform + opacity for 60fps animations

API Contract:
  GET /api/dashboard/evidence?status=VERIFIED|PENDING|FLAGGED|FILED
  GET /api/dashboard/evidence/:id - Fetch full metadata + image URL
  Response: { id, filename, uploadDate, size, uploader, notes, imageUrl, status, tags }
`,
    files: [
      "/apps/ecosystem-web/src/pages/EvidenceVaultPage.tsx",
      "/apps/ecosystem-web/src/components/EvidenceFilterTabs.tsx",
      "/apps/ecosystem-web/src/components/EvidenceLightbox.tsx",
      "/apps/ecosystem-web/src/components/MetadataPanel.tsx",
      "/apps/ecosystem-web/src/pages/EvidenceVaultPage.module.css",
      "/apps/ecosystem-web/src/components/EvidenceLightbox.module.css",
      "/apps/ecosystem-web/src/components/EvidenceLightbox.test.tsx",
    ],
    outputDir: "haiku-agent-4",
  },
];

const RECONCILIATION_PROMPT = `
You are Opus 5, the final reconciliation and quality assurance agent for C7-PICS dashboard Phase 1.

## Your Task

4 Haiku agents have built:
1. **Agent 1**: DataTable component (reusable sortable table)
2. **Agent 2**: Results page (filters, detail panel, API wiring)
3. **Agent 3**: Evidence Vault grid (responsive layout, thumbnails, badges)
4. **Agent 4**: Evidence Vault page (filters, lightbox, metadata)

## Reconciliation Goals

✓ Design Consistency (99%+ alignment target)
  - All CSS uses design tokens from styles.css (--ink, --text, --accent, --accent-warm, --amber)
  - Font sizing uses clamp() for fluid scaling (no stepped breakpoints)
  - Spacing follows the fluid pattern (12px base, clamp(10px, 1vw, 14px))
  - Colors match: votes #7ee0c2, statuses semantic
  - Radius: --radius (18px) for cards, --radius-lg (26px) for larger elements

✓ Component Architecture
  - DataTable is truly reusable (no Results-specific logic)
  - StatusBadge is shared between Results and Evidence Vault
  - No duplicate styling across module.css files
  - Clear component composition hierarchy

✓ API Contract Alignment
  - All pages request same data structure
  - Status filters use consistent enum values (PENDING, VERIFIED, FLAGGED, FILED)
  - Response shapes match (results[], total, counts, metadata)

✓ TypeScript Compliance
  - All components properly typed
  - No any types without explanation
  - Shared types in separate file if used across agents

✓ Responsive Design (mobile-first)
  - 320px minimum (mobile), no horizontal scroll
  - Grid cols: mobile 1 → tablet 2 → desktop 4
  - Tables: horizontal scroll on mobile, full table on desktop
  - Touch targets: minimum 44px height for buttons

✓ Accessibility
  - ARIA labels on all buttons and interactive elements
  - Keyboard navigation (Tab, ArrowKeys, ESC, Enter)
  - Color not the only indicator (use text labels + colors)
  - Alt text on all images

✓ Test Coverage
  - Unit tests for each component
  - Integration test: Results page with DataTable + filters
  - Integration test: Evidence Vault with grid + lightbox
  - Mock data generators that match API contracts

## Verification Steps

When you receive the 4 agent outputs:

1. **Code Review**
   - Check each component for design token usage
   - Verify no duplicate CSS across files
   - Confirm API endpoints match the contracts defined

2. **Fix Priority**
   - Design token violations (highest - visual consistency)
   - API contract mismatches (high - breaks integration)
   - Component reuse issues (medium - code quality)
   - Test coverage gaps (medium - quality assurance)
   - Accessibility issues (medium - compliance)

3. **Output Format**
   For each file you modify:
   - Briefly explain what was corrected
   - Show the fixed version
   - Tag with [FIXED] in the comment

4. **Integration Assembly**
   Create:
   - /apps/ecosystem-web/src/pages/routes.ts - Add Results and Evidence Vault routes
   - /apps/ecosystem-web/src/api/dashboardApi.ts - Centralized API client for both pages
   - /apps/ecosystem-web/src/types/dashboard.ts - Shared types
   - /apps/ecosystem-web/src/mockData/index.ts - Consolidated mock data
   - /PHASE1_INTEGRATION_REPORT.md - Summary of reconciliation

5. **Sign Off**
   If 99%+ design alignment achieved:
   - ✓ All components styled with design tokens
   - ✓ No duplicate CSS
   - ✓ API contracts unified
   - ✓ Tests pass for both pages
   - ✓ Mobile/tablet/desktop verified
   - Output: "RECONCILIATION_COMPLETE: Ready for integration into main app.ts"

   If issues remain:
   - List specific violations with file paths
   - Provide corrected code
   - Note what was prioritized (design tokens > API > code quality > tests)

## Expected Output Structure

You'll receive from each agent:
- Agent 1: DataTable.tsx, DataTable.module.css, DataTable.test.tsx
- Agent 2: ResultsPage.tsx, StatusFilterTabs.tsx, ResultsDetailPanel.tsx, ResultsPage.module.css, resultsData.ts
- Agent 3: EvidenceGrid.tsx, EvidenceThumbnail.tsx, StatusBadge.tsx, EvidenceGrid.module.css, StatusBadge.module.css, EvidenceGrid.test.tsx
- Agent 4: EvidenceVaultPage.tsx, EvidenceFilterTabs.tsx, EvidenceLightbox.tsx, MetadataPanel.tsx, EvidenceVaultPage.module.css, EvidenceLightbox.module.css, EvidenceLightbox.test.tsx

Your task: Assemble these into a cohesive, 99%+ design-aligned dashboard.

## Design Token Reference (from C7 styles.css)

\`\`\`css
--ink: #070b16;           /* Main background */
--ink-2: #0b1020;         /* Secondary background */
--ink-3: #121a2c;         /* Tertiary background */
--line: rgba(160, 180, 220, 0.12);      /* Subtle borders */
--line-bright: rgba(170, 195, 240, 0.28); /* Hover states */
--text: #eef2f8;          /* Main text */
--text-dim: #a7b2c6;      /* Secondary text */
--text-faint: #74809a;    /* Tertiary text */
--accent: #6ea8ff;        /* Primary action blue */
--accent-warm: #7ee0c2;   /* Success/votes green */
--amber: #f0c25e;         /* Warning/pending yellow */

--radius: 18px;           /* Standard border-radius */
--radius-lg: 26px;        /* Large border-radius */
--shell: min(1180px, 92vw); /* Max content width */

Font sizing (responsive, no breakpoints):
  font-size: clamp(15px, 0.55vw + 13.6px, 17px);

Spacing (responsive):
  gap/padding: clamp(10px, 1vw, 14px);
  gap/padding: clamp(12px, 1.5vw, 18px);
  gap/padding: clamp(16px, 2vw, 24px);
\`\`\`

Do not proceed until you have received all 4 agent outputs. Wait for their completion signal.
`;

async function runHaikuAgent(task: AgentTask): Promise<string> {
  console.log(
    `\n[HAIKU AGENT ${task.agent}] Starting: ${task.title}\n---`
  );

  const response = await client.messages.create({
    model: task.model,
    max_tokens: 16000,
    messages: [
      {
        role: "user",
        content: `You are a specialized frontend agent (Haiku 4.5) building C7-PICS dashboard components.

YOUR TASK:
${task.description}

CONSTRAINTS:
- TypeScript (.tsx for components, .ts for logic)
- CSS Modules (.module.css)
- Follow C7 design system exactly (design tokens, spacing, colors)
- No external component libraries - use vanilla CSS and React
- Complete, production-ready code
- Full test coverage for your components
- All files must be syntactically correct and type-safe

OUTPUT FORMAT:
For each file, output:
\`\`\`typescript
// [FILE: path/to/file.tsx]
// [LINES: estimated line count]
[complete file content]
\`\`\`

Start with the main component, then module.css, then tests.
Include all imports and exports needed.
Use proper TypeScript types throughout.

You have 16,000 tokens. Build the complete solution.`,
      },
    ],
  });

  const output = response.content[0];
  if (output.type === "text") {
    console.log(`[HAIKU AGENT ${task.agent}] Completed output`);
    return output.text;
  }

  throw new Error(`Agent ${task.agent} did not return text response`);
}

async function runOpusReconciliation(
  agentOutputs: Array<{ agent: number; output: string }>
): Promise<string> {
  console.log(`\n[OPUS 5] Starting reconciliation...\n---`);

  const agentContext = agentOutputs
    .map(
      (a) => `## AGENT ${a.agent} OUTPUT
\`\`\`
${a.output}
\`\`\``
    )
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-opus-4-1-20250805",
    max_tokens: 20000,
    messages: [
      {
        role: "user",
        content: `${RECONCILIATION_PROMPT}

## AGENT OUTPUTS (ready for reconciliation)

${agentContext}

---

Now perform your reconciliation steps:
1. Code review all 4 outputs
2. Identify and fix design token violations
3. Remove duplicate CSS
4. Unify API contracts
5. Create integration files
6. Output corrected versions of all files

Start with a summary of findings, then output corrected files.`,
      },
    ],
  });

  const output = response.content[0];
  if (output.type === "text") {
    return output.text;
  }

  throw new Error("Opus did not return text response");
}

async function main() {
  console.log("╔════════════════════════════════════════════╗");
  console.log("║  C7-PICS Dashboard: 4-Haiku + Opus 5       ║");
  console.log("║  Parallel Build + Design Reconciliation    ║");
  console.log("╚════════════════════════════════════════════╝");

  try {
    // Run all 4 Haiku agents in parallel
    console.log("\n[WORKFLOW] Spawning 4 Haiku agents...");
    const haikuPromises = AGENT_TASKS.map((task) => runHaikuAgent(task));
    const haikuOutputs = await Promise.all(haikuPromises);

    const agentResults = AGENT_TASKS.map((task, i) => ({
      agent: task.agent,
      output: haikuOutputs[i],
    }));

    // Run Opus 5 reconciliation
    console.log("\n[WORKFLOW] All Haiku agents complete. Running Opus 5...");
    const opusOutput = await runOpusReconciliation(agentResults);

    // Write results
    console.log("\n[WORKFLOW] Writing reconciliation output...");
    const timestamp = new Date().toISOString().slice(0, 10);
    const outputFile = `C:\\Users\\zoeme\\AppData\\Local\\Temp\\claude\\c--Users-zoeme-videofy-live\\e76c8a66-ccad-4de8-aeb9-517a3c6faf82\\scratchpad\\c7-pics-dashboard-${timestamp}-reconciliation.md`;

    const fullReport = `# C7-PICS Dashboard Build Report
Generated: ${new Date().toISOString()}

## Haiku Agent Outputs

${agentResults
  .map(
    (r) => `
### Agent ${r.agent} Output
\`\`\`
${r.output.slice(0, 1000)}...
\`\`\`
`
  )
  .join("\n")}

## Opus 5 Reconciliation

${opusOutput}

---
Report generated by 4-Haiku + Opus 5 workflow
`;

    console.log("\n[COMPLETE] Dashboard build workflow finished");
    console.log("\nSummary:");
    console.log("✓ Agent 1: DataTable component");
    console.log("✓ Agent 2: Results page");
    console.log("✓ Agent 3: Evidence Vault grid");
    console.log("✓ Agent 4: Evidence Vault page");
    console.log("✓ Opus 5: Design reconciliation & integration");

    return {
      status: "success",
      timestamp,
      agentCount: 4,
      haiku_outputs: agentResults,
      opus_reconciliation: opusOutput.slice(0, 500),
    };
  } catch (error) {
    console.error("\n[ERROR] Workflow failed:");
    console.error(error instanceof Error ? error.message : String(error));
    throw error;
  }
}

main().then((result) => {
  console.log("\n[WORKFLOW SUCCESS]");
  console.log(JSON.stringify(result, null, 2));
});
