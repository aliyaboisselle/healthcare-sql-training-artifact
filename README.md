# healthcare-sql-training-artifact
*An interactive, AI-powered SQL learning and assessment platform purpose-built for healthcare data professionals. Designed to help analysts, Business Intelligence Developers (BIDs), and solutions architects sharpen their PostgreSQL skills using real-world healthcare scenarios.*

Built on the Claude.ai artifact platform using the Anthropic API.


## Purpose
Healthcare data environments are complex — ADT workflows, ICD coding, pharmacy dispensing, lab results, claims processing, and more all produce distinct data structures and query patterns. Generic SQL courses don't prepare you for this. This tool does.
Whether you're preparing for a BID interview, upskilling as an analyst, or maintaining sharp query skills as an architect, this tool adapts to your level and tracks your growth over time.

## Demo

*Displays the SQL query question and evaluation functionality*

![Demo Recording](https://github.com/aliyaboisselle/healthcare-sql-training-artifact/blob/Demos/Sql-training.gif)

## Features

### Query Writing

- AI-generates fresh PostgreSQL questions. No repeated question bank.
- 15 rotating healthcare domains (ADT, pharmacy, lab, billing, scheduling, OR, infection control, and more)
- 15 SQL concepts per difficulty level, cycling to ensure broad coverage
- Questions always specify exact output columns, filter criteria, and expected behavior

### Troubleshooting

- Broken queries with 1–3 realistic bugs to find and fix
- Domain and concept rotation matches Query Writing for full coverage
- Questions describe the intended output so you know what "correct" looks like

### Proficiency Exam

- 10-question adaptive exam spanning all 5 difficulty levels
- Mix of writing (6) and troubleshooting (4) questions
- Each question uses a different healthcare domain and SQL concept
- Results include per-question scores and identified weakness categories

### Practice Weaknesses

- Unlocks after your first proficiency exam
- Tracks weakness categories (e.g. Window Functions, LEFT JOIN, CTEs) identified from exam results
- Generates targeted questions drilling exactly those areas
= Re-taking the exam updates only tested categories — untested weaknesses are preserved

### Scoring (0–100)
- Every submission is graded across four weighted criteria:

| Criteria | Points | 
|----------|--------|
| Correctness - does it return the right result? | 50 |
| Syntax & Structure — valid PostgreSQL? | 20 |
| Efficiency — optimal approach? | 20  |
| Clarity — readable, aliased, well-structured? | 10 |

### Drill This / Teach Me

After any submission, the AI identifies specific concepts you missed or misused and surfaces them with two buttons:

Drill This — generates a focused mini-question on that exact concept inline
Teach Me — plain-English explanation with a healthcare-specific example and common mistakes

### Session Gap Tracker
Tracks concepts missed across your entire session so patterns become visible within a single sitting.

### Concept Reference
Built-in PostgreSQL cheat sheet organized by category with healthcare-specific syntax examples — no need to leave the tool.

## Gamification
XP & 20-Level Progression
| Level | Title |
|-------|-------|
| 1 | Intern |
| 2 | Data Aide |
| 3 | Junior Analyst |
| 4 | Analyst I |
| 5 | Analyst II |
| 6 | Senior Analyst |
| 7 | Data Specialist |
| 8 | BID Trainee |
| 9 | BID I |
| 10 | BID II |
| 11 | BID III |
| 12 | Senior BID I | 
| 13 | Senior BID II |
| 14 | Lead Analyst |
| 15 | Data Architect |
| 16 | Analytics Manager |
| 17 | Principal BID |
| 18 | Director of Analytics |
| 19 | VP of Data |
| 20 | Chief Data Officer |

XP scales with difficulty (Beginner: 20 base → Expert: 120 base) and score percentage. Bonus XP awarded for 80+ and 90+ scores.
Difficulty Unlocks
Higher difficulties unlock as you level up — mirroring real career progression:

- Difficult → Level 4 (Analyst I)
- Advanced → Level 8 (BID Trainee)
- Expert → Level 12 (Senior BID I)

### 30 Achievement Badges
Across five groups: Getting Started, Score Milestones, Volume & Grind, Difficulty Milestones, and Weakness & Growth. Badges unlock in real time with toast notifications.

## Tech Stack
| Layer | Technology |
|-------|------------|
| UI Framework |React (hooks-based, no external UI library) |
| Styling | Inline styles — no CSS framework dependency |
| AI Engine | Anthropic Claude API (claude-sonnet-4) |
| Persistence | Claude.ai artifact storage |
| API Platform | Claude.ai artifact sandbox |

## How to Use
This tool runs natively inside Claude.ai as a React artifact. No installation or API key setup required.

- Open Claude.ai
- Start a conversation and load the artifact
- Select a section from the top navigation
- Choose your difficulty and generate a question
- Submit your answer for AI-powered feedback, scoring, and concept drills


## Healthcare Domains Covered
Patient demographics & registration · Inpatient admissions & discharges (ADT) · Outpatient appointments & scheduling · Emergency department visits · Medication orders & pharmacy dispensing · Lab orders & results · Radiology orders & imaging · Diagnoses & ICD-10 coding · Surgical procedures & OR scheduling · Insurance claims & billing · Provider credentialing & staff rosters · Nursing assessments & care plans · Vital signs & flowsheets · Referrals & care transitions · Infection control & reportable conditions

## SQL Concepts by Level
**Beginner**
- SELECT/WHERE, ORDER BY/LIMIT, basic aggregates, GROUP BY/HAVING, INNER JOIN, BETWEEN/IN, column aliases, DISTINCT, date filtering, NULL checks, AND/OR/NOT, calculated columns, LIKE/wildcards, table aliasing, intro subqueries
  
**Intermediate**
- LEFT JOIN, 3+ table JOINs, multi-aggregate GROUP BY, subqueries, CASE WHEN, date functions, string functions, COALESCE, UNION/UNION ALL, COUNT DISTINCT, self JOIN, CAST, NULL aggregate behavior, JOIN selection reasoning, intro window functions

**Difficult**
- Correlated subqueries, CTEs, ROW_NUMBER() OVER PARTITION, FULL OUTER JOIN, EXISTS/NOT EXISTS, chained CTEs, NULLIF+COALESCE, conditional aggregation with FILTER, interval arithmetic, RANK/DENSE_RANK, multi-table UPDATE/DELETE, nested CASE WHEN, REGEXP/SPLIT_PART, fiscal year logic

**Advanced**
- Recursive CTEs, LAG/LEAD, running totals, FIRST/LAST_VALUE, multiple window frames, EXCEPT/INTERSECT, lateral joins, pivot with CASE WHEN, percentile functions, complex correlated subqueries, UNNEST/arrays, JSON/JSONB querying, deduplication, index-aware writing, multi-step CTE transforms

**Expert**
- Advanced window framing, gap-and-island problems, SCD Type 2 patterns, ROLLUP/CUBE, INSERT ON CONFLICT, EXPLAIN ANALYZE, materialized views, partitioned tables, PL/pgSQL functions, full-text search, advanced JSONB, row-level security, schema design, multi-step ETL, trigger logic

## License
*MIT — free to use, adapt, and share.*
