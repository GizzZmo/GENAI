# 🔱 Archangels — GitHub Agent Orchestrator System

*Constantine Universe — Hidden Network Operations*

---

## Overview

The **Archangels Orchestrator** is an advanced GitHub Actions workflow system
built around three autonomous agent personas named after the archangels.
Each agent has a distinct domain, set of responsibilities, and personality.
They can operate independently or be coordinated through the master orchestrator.

```
                     ┌─────────────────────────────┐
                     │  🔱 ARCHANGELS ORCHESTRATOR  │
                     │   archangels.yml             │
                     │   Manual dispatch / push     │
                     └──────┬──────────┬────────────┘
                            │          │          │
               ┌────────────▼─┐  ┌─────▼──────┐  ┌──▼──────────┐
               │  ⚔️ MICHAEL   │  │ 📯 GABRIEL  │  │ ✨ RAFAEL   │
               │  Warrior      │  │ Messenger   │  │  Healer     │
               │  michael.yml  │  │ gabriel.yml │  │ rafael.yml  │
               └──────┬────────┘  └──────┬──────┘  └──────┬──────┘
                      │                  │                  │
        ┌─────────────▼──┐   ┌──────────▼──┐   ┌──────────▼──┐
        │ michael-shield │   │gabriel-herald│   │rafael-diagnose│
        │ (action)       │   │ (action)     │   │ (action)     │
        └────────────────┘   └─────────────┘   └─────────────┘
```

---

## The Archangels

### ⚔️ Michael — The Warrior Guardian

**Domain:** Security · CI Protection · Code Quality

Michael is the protector of the codebase. He runs on every push and pull
request, scanning for threats and enforcing quality standards.

**Jobs:**

| Job | Purpose |
|-----|---------|
| `sentinel` | Secret scanning — detects AWS keys, GitHub tokens, private keys, passwords |
| `shield` | Linting — HTMLHint, Stylelint, Node.js syntax check |
| `enforce` | PR policy — size limits, Conventional Commits title format |
| `report` | Aggregates results, emits `shield_status` output |

**Triggers:**
- `push` — all branches
- `pull_request` — targeting `main`
- `workflow_call` — from Archangels Orchestrator
- `workflow_dispatch` — manual with `scan_depth: shallow | deep`

**Inputs (workflow_call):**

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `scan_depth` | `string` | `shallow` | Fetch depth for secret scan |

**Outputs:**

| Output | Description |
|--------|-------------|
| `shield_status` | `pass` or `fail` |

---

### 📯 Gabriel — The Messenger Herald

**Domain:** Communication · Community · PR Intelligence

Gabriel is the voice of the repository. He communicates with contributors,
labels pull requests automatically, and produces rich PR summaries.

**Jobs:**

| Job | Purpose |
|-----|---------|
| `herald` | Welcomes first-time contributors on PRs and issues |
| `scribe` | Auto-labels PRs by changed file paths |
| `chronicle` | Posts/updates a detailed PR summary comment |
| `report` | Aggregates results, emits `herald_status` output |

**Triggers:**
- `pull_request` — opened, synchronize, reopened, ready_for_review
- `issues` — opened
- `workflow_call` — from Archangels Orchestrator
- `workflow_dispatch` — manual with optional `target_pr`

**Labels applied by Scribe:**

| Label | Files matched |
|-------|---------------|
| `area: workflows` | `.github/` |
| `area: frontend` | `*.html`, `*.css` |
| `area: javascript` | `*.js` |
| `area: docs` | `*.md`, `README*` |
| `area: static` | `static/` |
| `area: bootstrap` | `bootstrap/` |
| `area: vault7` | `vault7/` |
| `size: small` | < 100 changed lines |
| `size: medium` | 100–500 changed lines |
| `size: large` | > 500 changed lines |

**Outputs:**

| Output | Description |
|--------|-------------|
| `herald_status` | `pass` or `fail` |

---

### ✨ Rafael — The Healer Archangel

**Domain:** Maintenance · Repository Health · Quality Assurance

Rafael runs on a weekly schedule (every Monday at 07:00 UTC) and on demand.
He triages stale issues, audits repository health, checks links, and publishes
weekly health reports.

**Jobs:**

| Job | Purpose |
|-----|---------|
| `diagnose` | Stale issue & PR management via `actions/stale` |
| `audit` | Repository structure audit — large files, duplicate names, HTML a11y |
| `link_healer` | Scans HTML files for broken internal references |
| `health_report` | Creates a weekly health report issue (schedule only) |
| `report` | Aggregates results, emits `heal_status` output |

**Triggers:**
- `schedule` — Every Monday at 07:00 UTC (`0 7 * * 1`)
- `workflow_call` — from Archangels Orchestrator
- `workflow_dispatch` — manual with `scope` and `dry_run`

**Inputs:**

| Input | Type | Default | Options | Description |
|-------|------|---------|---------|-------------|
| `scope` | `string` | `all` | `all \| stale \| audit \| links` | Which healing tasks to run |
| `dry_run` | `string` | `false` | `true \| false` | Report only, no mutations |

**Stale policy:**

| Type | Stale after | Close after |
|------|-------------|-------------|
| Issues | 60 days | 14 days |
| PRs | 30 days | 7 days |
| Exempt labels | `pinned`, `security`, `critical`, `in-progress`, `dependencies` | |

**Outputs:**

| Output | Description |
|--------|-------------|
| `heal_status` | `pass` or `fail` |

---

## Master Orchestrator

### `archangels.yml` — Command Console

The orchestrator is the master dispatch system. It can invoke any combination
of archangels in a single run.

**Triggers:**
- `push` to `main` — invokes all three agents
- `workflow_dispatch` — fully configurable manual dispatch

**Manual dispatch inputs:**

| Input | Options | Default | Description |
|-------|---------|---------|-------------|
| `agents` | `all \| michael \| gabriel \| rafael \| michael+gabriel \| michael+rafael \| gabriel+rafael` | `all` | Which archangels to invoke |
| `scan_depth` | `shallow \| deep` | `shallow` | Passed to Michael |
| `rafael_scope` | `all \| stale \| audit \| links` | `all` | Passed to Rafael |
| `dry_run` | `true \| false` | `false` | Passed to Rafael |
| `environment` | `production \| staging \| development` | `production` | Environment label |

**Jobs:**

| Job | Description |
|-----|-------------|
| `command_console` | Banner, routing logic, pre-flight summary |
| `invoke_michael` | Calls `michael.yml` via `workflow_call` |
| `invoke_gabriel` | Calls `gabriel.yml` via `workflow_call` |
| `invoke_rafael` | Calls `rafael.yml` via `workflow_call` |
| `mission_debrief` | Unified status dashboard, fails run if any agent failed |

---

## Composite Actions

### `michael-shield`

**Path:** `.github/actions/michael-shield/`

Reusable composite action for targeted secret scanning. Can be called from any
workflow to scan a specific path.

```yaml
- uses: ./.github/actions/michael-shield
  with:
    path: ./src
    fail_on_finding: "true"
```

### `gabriel-herald`

**Path:** `.github/actions/gabriel-herald/`

Posts or updates a formatted Gabriel-branded comment on any PR or issue.
Deduplicates by `tag` to prevent multiple comments.

```yaml
- uses: ./.github/actions/gabriel-herald
  with:
    issue_number: ${{ github.event.pull_request.number }}
    message: "Your custom message here"
    tag: "my-unique-tag"
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

### `rafael-diagnose`

**Path:** `.github/actions/rafael-diagnose/`

Runs a targeted diagnostic on a path — checks for large files and HTML
accessibility issues.

```yaml
- uses: ./.github/actions/rafael-diagnose
  with:
    path: ./static
    check_large_files: "true"
    size_threshold_kb: "200"
```

---

## File Structure

```
.github/
├── workflows/
│   ├── archangels.yml       ← 🔱 Master orchestrator
│   ├── michael.yml          ← ⚔️  Warrior (security & CI)
│   ├── gabriel.yml          ← 📯 Messenger (PR comms)
│   └── rafael.yml           ← ✨ Healer (maintenance)
└── actions/
    ├── michael-shield/
    │   └── action.yml       ← Composite: secret scan
    ├── gabriel-herald/
    │   └── action.yml       ← Composite: PR comment poster
    └── rafael-diagnose/
        └── action.yml       ← Composite: health diagnostic
```

---

## Concurrency Strategy

Each workflow uses a concurrency group to prevent duplicate runs:

| Workflow | Group | Cancel in-progress |
|----------|-------|--------------------|
| Michael | `michael-{ref}` | ✅ Yes |
| Gabriel | `gabriel-{pr/issue/run_id}` | ❌ No (PR comments are additive) |
| Rafael | `rafael-healing` | ❌ No (maintenance is serialised) |
| Archangels | `archangels-{ref}` | ✅ Yes |

---

## Permissions

All workflows follow least-privilege — only permissions required for their
specific tasks are granted:

| Workflow | `contents` | `pull-requests` | `issues` | `security-events` |
|----------|-----------|-----------------|----------|-------------------|
| Michael | read | write | — | write |
| Gabriel | read | write | write | — |
| Rafael | read | write | write | — |
| Archangels | read | write | write | write |

---

> *"Three voices. One signal. The network endures."*
> — Constantine Universe, Hidden Network Operations
