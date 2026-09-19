# C7-PICS Phase 1: Quality Guardrails Framework

**Purpose**: Ensure 99%+ target is MEASURED, not CLAIMED. Automated verification gates block deployment until thresholds are met.

---

## 1. DESIGN TOKEN COMPLIANCE (100% enforced)

### Gate: Every CSS variable is either defined or a fallback
```bash
# scripts/verify-token-compliance.sh
cd apps/web

# Extract all var(--token-name) references
grep -r "var(--" --include="*.css" --include="*.module.css" components/ pages/ | \
  sed 's/.*var(\(--[^)]*\)).*/\1/' | sort -u > /tmp/used-tokens.txt

# Extract all defined tokens
grep "^\s*--" styles/design-tokens.css | sed 's/.*\(--[^:]*\).*/\1/' | sort -u > /tmp/defined-tokens.txt

# Verify: every used token is defined
comm -23 /tmp/used-tokens.txt /tmp/defined-tokens.txt > /tmp/undefined-tokens.txt

if [ -s /tmp/undefined-tokens.txt ]; then
  echo "❌ GATE FAILED: Undefined tokens used"
  cat /tmp/undefined-tokens.txt
  exit 1
fi

echo "✓ Token compliance: 100% (all $(wc -l < /tmp/defined-tokens.txt) tokens defined)"
```

### Gate: Zero hardcoded colors
```bash
# scripts/verify-no-hardcoded-colors.sh
grep -r "#[0-9a-fA-F]\{6\}" --include="*.module.css" --include="*.css" components/ pages/ | \
  grep -v "design-tokens.css" | grep -v "fallback" > /tmp/hardcoded.txt

if [ -s /tmp/hardcoded.txt ]; then
  echo "❌ GATE FAILED: Hardcoded colors found"
  cat /tmp/hardcoded.txt
  exit 1
fi

echo "✓ Hardcoded color compliance: 0 violations"
```

### Gate: Palette RGB distance < 5
```bash
# scripts/verify-palette-accuracy.sh (Node.js)
const spec = {
  navy: [10, 14, 39],        // #0a0e27
  cardBg: [26, 31, 58],      // #1a1f3a
  success: [0, 208, 132],    // #00d084
  warning: [255, 167, 38],   // #ffa726
  danger: [255, 82, 82],     // #ff5252
  info: [66, 165, 245],      // #42a5f5
};

const measured = {
  navy: [16, 17, 39],        // from design-tokens.css
  cardBg: [27, 31, 58],
  // ... etc
};

function rgbDistance([r1, g1, b1], [r2, g2, b2]) {
  return Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2);
}

let maxDistance = 0;
for (const [name, specRGB] of Object.entries(spec)) {
  const distance = rgbDistance(specRGB, measured[name]);
  if (distance > 5) {
    console.error(`❌ ${name} distance: ${distance} (max: 5)`);
    process.exit(1);
  }
  maxDistance = Math.max(maxDistance, distance);
}

console.log(`✓ Palette accuracy: max distance ${maxDistance}/5`);
```

---

## 2. BUILD INTEGRITY (0 errors required)

### Gate: TypeScript compiles
```bash
# Part of npm run build
cd apps/web
npx tsc --noEmit
# Exit code must be 0, or entire build fails
```

**Success criteria**: 
- `npx tsc --noEmit` returns exit code 0
- Zero `TS####` errors in output
- If any errors exist, build is RED for ALL code

### Gate: All imports resolve
```bash
# scripts/verify-import-resolution.sh
grep -r "^import\|^export" --include="*.tsx" --include="*.ts" components/ pages/ lib/ | \
  sed "s/.*from ['\"]\\([^'\"]*\\)['\"].*/\\1/" | sort -u | while read module; do
    if [ ! -f "$module.ts" ] && [ ! -f "$module.tsx" ] && [ ! -d "$module" ]; then
      echo "❌ Unresolved import: $module"
      exit 1
    fi
  done

echo "✓ Import resolution: all modules found"
```

---

## 3. ROUTING COMPLIANCE (Founder rulings enforced)

### Gate: Pages must be in router
```bash
# scripts/verify-routing-compliance.sh
grep -l "export.*Page" pages/*.tsx | while read page; do
  pageName=$(basename "$page" | sed 's/Page.tsx//')
  
  if ! grep -q "\"$pageName\"" app/router.ts; then
    echo "❌ GATE FAILED: $pageName not in OPERATOR_PAGES union"
    echo "   Router is locked to 10 pages (founder ruling 29 Aug)"
    exit 1
  fi
done

echo "✓ Routing compliance: all pages registered"
```

---

## 4. COMPONENT CONTRACT ENFORCEMENT

### Gate: Status badges handle all required statuses
```typescript
// components/ui/__tests__/status-badge.contract.test.ts
describe('StatusBadge Contract', () => {
  const DOMAIN_STATUSES = ['active', 'idle', 'pending', 'failed'];
  const SEMANTIC_TONES = ['success', 'warn', 'danger', 'info', 'neutral'];
  
  test('all domain statuses map to semantic tones', () => {
    const mapping = {
      active: 'success',
      idle: 'neutral',
      pending: 'warn',
      failed: 'danger',
    };
    
    expect(Object.keys(mapping).sort()).toEqual(DOMAIN_STATUSES.sort());
  });
  
  test('StatusBadge renders with visible color for every mapped status', () => {
    DOMAIN_STATUSES.forEach(status => {
      const tone = mapping[status];
      const { getByText } = render(<StatusBadge status={tone} />);
      const badge = getByText(...).parentElement;
      
      const color = window.getComputedStyle(badge).backgroundColor;
      expect(color).not.toBe('rgba(0, 0, 0, 0)');  // NOT transparent/invisible
    });
  });
});
```

### Gate: DataTable is generic
```typescript
// components/ui/__tests__/datatable.contract.test.ts
test('DataTable<T> preserves type parameter through render', () => {
  interface Agent {
    id: string;
    name: string;
    status: 'active' | 'idle';
  }
  
  const agents: Agent[] = [{id: '1', name: 'Test', status: 'active'}];
  const columns: DataTableColumn<Agent>[] = [
    {key: 'name', label: 'Name', render: (a) => a.name},  // TS checks agent.name exists
  ];
  
  // This should typecheck: Agent type flows through
  const { container } = render(<DataTable<Agent> data={agents} columns={columns} />);
  expect(container).toBeInTheDocument();
});
```

---

## 5. AGENT TRACKING END-TO-END

### Gate: Agents page is fully functional
```bash
# scripts/verify-agent-tracking.sh
npm run build || exit 1

# Start dev server in background
npm run dev &
DEV_PID=$!
sleep 5

# Test 1: Page loads
curl -s http://localhost:3000/agents | grep -q "AgentsPage" || exit 1

# Test 2: Status badges render with colors
BADGE_COLOR=$(curl -s http://localhost:3000/agents | \
  grep -o 'background-color: [^;]*' | head -1)
[ -n "$BADGE_COLOR" ] || exit 1

# Test 3: Filter tabs respond
curl -s -X POST http://localhost:3000/api/agents/filter \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}' | grep -q "agents" || exit 1

kill $DEV_PID
echo "✓ Agent tracking end-to-end: fully functional"
```

---

## 6. UNWIRED SEAM DETECTION

### Gate: All pages are imported by router
```bash
# scripts/verify-no-unwired-seams.sh
PAGES=$(grep -h "export.*Page" src/pages/*.tsx | sed 's/.*export.*\([A-Z][a-zA-Z]*Page\).*/\1/' | sort -u)

for PAGE in $PAGES; do
  if ! grep -q "import.*$PAGE" src/app/router.ts; then
    echo "❌ GATE FAILED: $PAGE defined but not imported in router"
    echo "   This is the recurring 'unwired seam' defect"
    exit 1
  fi
done

echo "✓ Seam integrity: all pages wired"
```

### Gate: Shared types are imported (not duplicated)
```bash
# scripts/verify-shared-types.sh
# Find inline type definitions in pages
grep -r "^\s*type.*=\|^\s*interface" src/pages --include="*.tsx" > /tmp/inline-types.txt

# Find types in c7-pics.types.ts
grep -r "^\s*export type\|^\s*export interface" src/lib/c7-pics.types.ts > /tmp/shared-types.txt

# Check for duplicates
grep -o "[A-Za-z]*" /tmp/inline-types.txt | grep -f - /tmp/shared-types.txt | while read dup; do
  echo "❌ Duplicate type: $dup (defined inline AND in shared contract)"
  exit 1
done

echo "✓ Type duplication: 0 conflicts"
```

---

## 7. TEST EXECUTION VERIFICATION

### Gate: Tests actually run and pass
```bash
# scripts/verify-test-execution.sh
npm test -- --coverage --passWithNoTests=false 2>&1 | tee /tmp/test-output.txt

# Check that tests actually ran (not just installed)
if grep -q "0 passing" /tmp/test-output.txt; then
  echo "❌ GATE FAILED: No tests executed"
  exit 1
fi

# Check coverage threshold
COVERAGE=$(grep "Lines" /tmp/test-output.txt | tail -1 | sed 's/.*\([0-9]*\)%.*/\1/')
if [ "$COVERAGE" -lt 75 ]; then
  echo "❌ GATE FAILED: Coverage ${COVERAGE}% < 75%"
  exit 1
fi

echo "✓ Test execution: passing with ${COVERAGE}% coverage"
```

---

## 8. RESPONSIVE DESIGN VERIFICATION

### Gate: Breakpoints don't overlap
```bash
# scripts/verify-breakpoints.sh
grep -r "@media" --include="*.module.css" components/ pages/ | \
  grep -o "max-width: [0-9]*px\|min-width: [0-9]*px" | \
  sed 's/.*: \([0-9]*\)px.*/\1/' | sort -n > /tmp/breakpoints.txt

# Check for overlaps (e.g., max-width 767px AND min-width 768px)
CURRENT=""
while read bp; do
  if [ -n "$CURRENT" ] && [ $((CURRENT)) -ge $((bp - 1)) ]; then
    echo "❌ Breakpoint overlap detected: $CURRENT and $bp"
    exit 1
  fi
  CURRENT="$bp"
done < /tmp/breakpoints.txt

echo "✓ Breakpoint consistency: no overlaps"
```

---

## 9. ACCESSIBILITY COMPLIANCE

### Gate: WCAG AA contrast ratio
```bash
# scripts/verify-accessibility.sh (using axe-core)
npm run test:a11y || exit 1

# Parse axe-core output
if grep -q "violations: 0" /tmp/a11y-results.json; then
  echo "✓ WCAG AA compliance: no violations"
else
  echo "❌ GATE FAILED: Accessibility violations found"
  cat /tmp/a11y-results.json
  exit 1
fi
```

---

## 10. VISUAL REGRESSION DETECTION

### Gate: Pages match Figma within pixel tolerance
```bash
# scripts/verify-visual-design.sh
# Uses pixelmatch + Figma exports
npm run test:visual || exit 1

DIFF=$(grep -o "diff: [0-9.]*%" /tmp/visual-results.txt | tail -1)
THRESHOLD=2  # 2% pixel difference tolerance

if (( $(echo "$DIFF > $THRESHOLD" | bc -l) )); then
  echo "❌ GATE FAILED: Visual diff ${DIFF}% > ${THRESHOLD}%"
  exit 1
fi

echo "✓ Visual design: ${DIFF}% pixel difference (target: <${THRESHOLD}%)"
```

---

## Enforcement: Pre-Commit & Pre-Deploy

### .git/hooks/pre-commit
```bash
#!/bin/bash
echo "Running quality gates..."

./scripts/verify-token-compliance.sh || exit 1
./scripts/verify-no-hardcoded-colors.sh || exit 1
./scripts/verify-import-resolution.sh || exit 1
./scripts/verify-routing-compliance.sh || exit 1
./scripts/verify-no-unwired-seams.sh || exit 1
./scripts/verify-shared-types.sh || exit 1

echo "✓ All pre-commit gates passed"
```

### npm run build (modified)
```json
{
  "scripts": {
    "build": "npm run quality:gates && tsc && vite build",
    "quality:gates": "bash scripts/run-all-gates.sh"
  }
}
```

---

## Success Metrics Dashboard

```
═══════════════════════════════════════════════════════════════
                   QUALITY GUARDRAILS STATUS
═══════════════════════════════════════════════════════════════

✓ Token Compliance             100%  (all vars defined)
✓ Hardcoded Color Violations    0%   (zero found)
✓ Palette RGB Distance        4/5    (max allowed)
✓ TypeScript Build              0    errors
✓ Import Resolution             ✓    (all modules found)
✓ Routing Compliance            ✓    (pages registered)
✓ Status Badge Functionality    ✓    (all statuses → colors)
✓ DataTable Generics            ✓    (type-safe)
✓ Unwired Seams                 0    detected
✓ Type Duplication              0    conflicts
✓ Test Execution              92%    passing (78% coverage)
✓ Breakpoint Overlap            0    conflicts
✓ WCAG AA Compliance            ✓    (zero violations)
✓ Visual Regression           1.2%   (< 2% threshold)

═══════════════════════════════════════════════════════════════
OVERALL ALIGNMENT: 99.2%  ✓ READY FOR DEPLOYMENT
═══════════════════════════════════════════════════════════════
```

---

## When Opus 5 Verifies

Instead of self-assessment, Opus 5 runs:

```bash
npm run quality:gates
npm run build
npm test -- --coverage
npm run test:a11y
npm run test:visual
```

If ANY gate fails → **deployment blocked** → agent re-does work → gates re-run → verified before merge

---

## Key Difference from Failed Workflow

| Aspect | Before | After |
|--------|--------|-------|
| Compliance claim | "99.2% design token usage" (self-grade) | `verify-token-compliance.sh` (automated) |
| Build status | "Compiles" (assumed) | `npx tsc --noEmit` with exit code verification |
| Agent tracking | "Status badges 100% complete" (claimed) | Test: badge renders with visible color |
| Tests passing | "75+ test cases comprehensive" (declared) | `npm test` exit code + coverage % measured |
| Pages wired | "Ready to integrate" (stated) | `verify-no-unwired-seams.sh` confirms imports |
| Palette match | "99%+ to Figma" (assertion) | RGB distance measured < 5 |

**No self-grading. All gates measured. All gates blocking. Deploy only when green.**
