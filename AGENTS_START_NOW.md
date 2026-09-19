# PHASE 1-2: 4-AGENT LAUNCH — START NOW

**Time**: Hour 0 (Start immediately)  
**Deadline**: Hour 16 (Submission with all gates passing)  
**Verification**: Hour 17-18 (Opus 5 independent check)

---

## For Agent 1 (Results Page & DataTable)

**Read Now**:
1. `AGENT_1_RESULTS_PAGE.md` (your full briefing)
2. `QUALITY_GUARDRAILS_OPERATIONAL.md` (how gates work)

**Start Now**:
```bash
cd C:\Users\zoeme\Downloads\c7-pics
npm run build  # Should pass (baseline)
```

**Deliverable**: 
- `apps/web/pages/results.tsx`
- `apps/web/components/ui/datatable.tsx` (fully generic DataTable<T>)
- 10+ tests with >=75% coverage

**Checkpoints**:
- Hour 4: `npm run build` must pass (0 errors)
- Hour 8: `npm test -- --coverage` must pass (>=75%)
- Hour 12: `npm run quality:gates` must pass (all 6 gates)
- Hour 16: Submit with gate verification report

---

## For Agent 2 (Incidents Page & Management)

**Read Now**:
1. `AGENT_2_INCIDENTS_PAGE.md` (your full briefing)
2. `QUALITY_GUARDRAILS_OPERATIONAL.md` (how gates work)

**Start Now**:
```bash
cd C:\Users\zoeme\Downloads\c7-pics
npm run build  # Should pass (baseline)
```

**Deliverable**:
- `apps/web/pages/incidents.tsx`
- `apps/web/components/ui/incident-card.tsx`
- `apps/web/components/ui/incident-detail-panel.tsx`
- 10+ tests with >=75% coverage

**Critical**: Status badges must render with **VISIBLE colors** (not transparent)

**Checkpoints**:
- Hour 4: `npm run build` must pass
- Hour 8: `npm test -- --coverage` must pass (>=75%)
- Hour 12: `npm run quality:gates` must pass
- Hour 16: Submit with gate verification report

---

## For Agent 3 (Evidence Vault & Grid)

**Read Now**:
1. `AGENT_3_EVIDENCE_VAULT.md` (your full briefing)
2. `QUALITY_GUARDRAILS_OPERATIONAL.md` (how gates work)

**Start Now**:
```bash
cd C:\Users\zoeme\Downloads\c7-pics
npm run build  # Should pass (baseline)
```

**Deliverable**:
- `apps/web/pages/evidence.tsx`
- `apps/web/components/ui/evidence-grid.tsx` (4-column responsive)
- `apps/web/components/ui/lightbox.tsx`
- 10+ tests with >=75% coverage

**Critical**: Status badges must render with **VISIBLE colors**

**Checkpoints**:
- Hour 4: `npm run build` must pass
- Hour 8: `npm test -- --coverage` must pass (>=75%)
- Hour 12: `npm run quality:gates` must pass
- Hour 16: Submit with gate verification report

---

## For Agent 4 (Reports Page & Charts)

**Read Now**:
1. `AGENT_4_REPORTS_PAGE.md` (your full briefing)
2. `QUALITY_GUARDRAILS_OPERATIONAL.md` (how gates work)

**Start Now**:
```bash
cd C:\Users\zoeme\Downloads\c7-pics
npm run build  # Should pass (baseline)
```

**Deliverable**:
- `apps/web/pages/reports.tsx`
- `apps/web/components/ui/chart-party-tally.tsx`
- `apps/web/components/ui/chart-incident-breakdown.tsx`
- 10+ tests with >=75% coverage
- Chart library: Recharts or Chart.js (choose one)

**Checkpoints**:
- Hour 4: `npm run build` must pass
- Hour 8: `npm test -- --coverage` must pass (>=75%)
- Hour 12: `npm run quality:gates` must pass
- Hour 16: Submit with gate verification report

---

## For All Agents

### Critical Rules
1. **If a gate fails**: Fix your code and rerun the gate. Don't skip it.
2. **Use design tokens**: Zero hardcoded colors like `#ff0000`
3. **Wire pages**: Add your page to `apps/web/app/router.ts`
4. **Test everything**: Don't just build locally; run `npm test -- --coverage`
5. **Status badges**: Must render with visible colors, not transparent

### Checkpoint Reporting Template

**Hour 4 Report** (to coordinator):
```
Agent [X]: Build checkpoint - PASS ✓
  npm run build: SUCCESS (0 TypeScript errors)
  Page created: apps/web/pages/[page].tsx
  Router updated: [Page] imported and registered
  Ready to continue with implementation
```

**Hour 8 Report**:
```
Agent [X]: Test checkpoint - PASS ✓
  npm test -- --coverage: [X]% coverage, [X] tests passing
  [X]+ test cases written
  Ready to continue with integration
```

**Hour 12 Report**:
```
Agent [X]: Quality gates checkpoint - PASS ✓
  npm run quality:gates: ALL GATES PASS
  ✓ Token compliance
  ✓ No hardcoded colors
  ✓ Import resolution
  ✓ Routing compliance
  ✓ No unwired seams
  ✓ No type duplication
  Ready to submit
```

**Hour 16 Report** (submission):
```
Agent [X]: SUBMISSION (Hour 16)

Deliverables:
- [x] apps/web/pages/[page].tsx
- [x] apps/web/components/ui/[components].tsx
- [x] apps/web/components/ui/__tests__/[tests].ts

Quality Gates (All Passing):
- [x] Build: 0 errors
- [x] Tests: [X]% coverage, [X]+ passing
- [x] Token compliance: ✓
- [x] Routing compliance: ✓
- [x] All other gates: ✓

Status: READY FOR OPUS 5 VERIFICATION
```

---

## Verification Gates You'll Run

Every 4 hours, run these commands:

**Hour 4 & ongoing**:
```bash
npm run build
# Exit code must be 0
```

**Hour 8 & ongoing**:
```bash
npm test -- --coverage
# Must show: tests running, >=75% coverage, all passing
```

**Hour 12 & 16** (pre-submission):
```bash
npm run quality:gates
# All 6 gates must pass individually
```

---

## Success Formula

✓ Build passes (0 errors)  
✓ Tests pass (>=75% coverage)  
✓ Quality gates pass (all 6)  
✓ Pages routable (no 404s)  
✓ Components work (no console errors)  

= **Ready for Opus 5 verification at hour 18**

---

## If You Get Stuck

**Problem**: Gate fails  
**Solution**: 
1. Identify which gate failed
2. Read error message
3. Fix the root cause (import path, token name, etc.)
4. Rerun that gate
5. Continue

**Never skip a gate. Fix the code instead.**

---

## Timeline Summary

```
Hour 0:  START NOW (read briefing, run baseline build)
Hour 4:  Checkpoint 1 (build passes)
Hour 8:  Checkpoint 2 (tests pass)
Hour 12: Checkpoint 3 (gates pass)
Hour 16: Submit (all gates passing)
Hour 17: Opus 5 verification begins
Hour 18: Decision (Deploy ✓ or Block ❌)
```

---

## Reference Docs

**Your Briefing** (READ FIRST):
- AGENT_[X]_*.md (your specific briefing)

**Quality System**:
- QUALITY_GUARDRAILS_OPERATIONAL.md (how gates work)
- QUALITY_GUARDRAILS.md (detailed gate definitions)

**Coordination**:
- PHASE1_MASTER_COORDINATION.md (full timeline)

---

## Right Now

1. **Read your briefing** (5 min)
2. **Run baseline**: `npm run build` (should pass)
3. **Create your page stub** (10 min)
4. **Add to router** (5 min)
5. **Verify build passes** (2 min)
6. **Start implementation** (4 hours to hour 4 checkpoint)

**Total setup**: 20 minutes  
**Then**: 4 hours of implementation until hour 4 checkpoint

---

## You're Ready

Everything is set up. Guardrails are in place. Checkpoints are defined.

**No silent feature drops. No 34% alignment disasters. 99%+ measured.**

**Go.**

---

**PHASE 1-2: 4-AGENT WORKFLOW LAUNCHES NOW**

Agent 1 → Read AGENT_1_RESULTS_PAGE.md  
Agent 2 → Read AGENT_2_INCIDENTS_PAGE.md  
Agent 3 → Read AGENT_3_EVIDENCE_VAULT.md  
Agent 4 → Read AGENT_4_REPORTS_PAGE.md  

All → Read QUALITY_GUARDRAILS_OPERATIONAL.md  

Then: `npm run build` and start implementing.

**Hour 0: Start. Hour 16: Submit. Hour 18: Deployed (if gates pass).**
