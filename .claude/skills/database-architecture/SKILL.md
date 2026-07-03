---
name: database-architecture
description: >
  Bidirectional database architecture skill. Use when the user wants to convert
  between a database's design description and its schema code, in EITHER direction:
  (A) CODE → DOCS — generate an architecture markdown file (tables, relationships,
  conventions, an ERD) from existing schema/migration/model code. Triggers:
  "document the DB architecture", "make a DATABASE.md", "schema design doc".
  (B) SPEC → CODE — generate database schema code (SQL DDL, Prisma, SQLAlchemy,
  TypeORM, Mongoose, or expo-sqlite TS) from a Mermaid erDiagram or an architecture
  markdown doc. Triggers: "turn this ERD into schema", "generate the tables from
  this diagram", "scaffold the DB from this design doc".
  Do NOT use for writing data migrations against a live DB, running queries, or
  application (non-DB) architecture.
---

# Database Architecture Skill (bidirectional)

Convert between a database's **architecture description** and its **schema code**, in
either direction — always grounded in the real source, never fabricated.

## Step 0 — Detect the direction
- Source is existing schema/model/migration code, target is a written doc
  → **Direction A: Code → Docs**.
- Source is a Mermaid `erDiagram` or an architecture markdown doc, target is runnable
  schema code → **Direction B: Spec → Code**.
- If the request is ambiguous (e.g. "sync the DB architecture"), ask which direction
  before doing work.

---

## Direction A — Code → Architecture Docs

Produce an accurate architecture markdown document (default
`docs/DATABASE_ARCHITECTURE.md`) describing the database that actually exists.

### Workflow
1. **Discover** where the DB is defined (see Discovery below).
2. **Extract** the real schema: tables/collections, columns/fields + types, keys,
   indexes, relationships, defaults, nullability.
3. **Render** using the Document Template below.
4. **Write** the file, then summarize what was documented and from which source files.
5. **Verify** every table/column traces to a real definition; flag anything
   unconfirmed rather than guessing.

### Document Template (Direction A output)
Render the doc with these sections, in this order. Keep it scannable and specific to
the project's real schema.

1. `# <Project> Database Architecture` — one-paragraph **Overview**: engine, where it
   lives, persistence model (persistent vs. in-memory/mock), and the core design
   principle.
2. `## Table Catalog` — one markdown table, one row per table:
   `Table | Purpose | Source file`.
3. `## Tables` — a `### <table_name>` subsection per table, each with a column table:
   `Column | Type | Nullable | Default | Notes` (note JSON-encoded columns, enums,
   units). Cite the source file path under each heading.
4. `## Relationships` — a Mermaid `erDiagram` block reflecting real FKs / id links,
   plus prose for relationships that are implied but not enforced (say so explicitly).
5. `## Conventions` — naming, JSON-string columns, key/id strategy, migration approach
   (e.g. `ALTER TABLE ... ADD COLUMN` in try/catch), WAL mode, etc.
6. `## Design Decisions` — short bullets on *why* the schema is shaped this way; the
   part that ages well. Only include decisions evidenced by the code or project docs.

---

## Direction B — Mermaid / Architecture Doc → Schema Code

Generate runnable schema code from a Mermaid `erDiagram` or an architecture markdown
spec.

### Workflow
1. **Parse the spec** into a neutral model: entities → fields (name, type,
   nullability, PK/FK), and relationships (cardinality, direction). For Mermaid,
   read `erDiagram` entity blocks and the `||--o{` style relationship lines.
2. **Choose the target dialect/ORM.** Infer from the project; ask only if there's no
   signal. For THIS project the device DB is **expo-sqlite** — match the existing
   pattern in `mobile/src/data/database/schema.ts` (plain SQL `CREATE TABLE`
   statements executed on first open, JSON columns stored as `TEXT`). Other supported
   targets: raw SQL DDL, Prisma `schema.prisma`, SQLAlchemy, TypeORM, Mongoose.
3. **Emit the schema code**, then state the target file/location.
4. **Round-trip check:** confirm the generated schema reproduces every entity, field,
   and relationship in the spec — same names, same cardinalities. Report any field
   where you had to choose a type/nullability the spec didn't specify.
5. **Verify it parses/compiles** where cheap to do so (e.g. `tsc --noEmit` for TS,
   `python -c "import ..."` for SQLAlchemy, `prisma format` for Prisma).

### Type-mapping guidance
Mermaid/spec types are free-form. Map deliberately and note assumptions:
- `string`/`text` → `TEXT` (SQLite) / `VARCHAR`/`String`
- `int`/`integer` → `INTEGER` / `Int`
- `float`/`decimal` → `REAL`/`NUMERIC`
- `bool` → `INTEGER` (0/1) in SQLite, `Boolean` elsewhere
- `json`/`object`/`array` → `TEXT` holding `JSON.stringify`'d data (SQLite) — mirror
  the project's existing JSON-column convention
- `datetime`/`date` → `TEXT` ISO-8601 (SQLite) / native type elsewhere
- Unspecified nullability → default to `NOT NULL` for required-looking fields; flag it.

### Grounding rules (Direction B)
- Generate ONLY entities/fields present in the spec. Never add tables or columns to
  "complete" it.
- Preserve relationship cardinality exactly; create FK columns only where the spec
  shows a relationship.
- Where the spec is silent (types, defaults, indexes), pick a sensible default AND
  list each such choice so the user can correct it.

---

## Discovery — where DB definitions commonly live
- Raw SQL schema/migrations: `**/schema.{ts,sql,js}`, `**/migrations/**`, `db.{ts,py}`
- ORM/ODM models: SQLAlchemy/Django models, Prisma `schema.prisma`, TypeORM/Sequelize
  entities, Mongoose schemas
- Type definitions mirroring rows: `*Types.ts`, domain interfaces
- App-level state stores acting as a data layer — label these "in-memory / mock, not
  persistent"; do not present them as a real DB.

For THIS project: the device DB is SQLite in `mobile/src/data/database/schema.ts`,
opened in `mobile/src/data/database/db.ts` (WAL mode, `ALTER TABLE` migrations in
try/catch). The FastAPI backend holds only in-memory mock state — document it as
non-persistent.

## Shared grounding rules (both directions — accuracy over completeness)
- Document/generate only what the source actually contains; cite real file paths.
- Preserve real names and types verbatim; note JSON-encoded columns, nullability,
  defaults exactly.
- Infer relationships only from real FKs or clearly-named id columns; if implied but
  not enforced, say so.
- If there is no real database (in-memory only), say so plainly — don't dress up mock
  state as a schema.
- Mark unknowns as unknown; never invent indexes, constraints, or columns.
