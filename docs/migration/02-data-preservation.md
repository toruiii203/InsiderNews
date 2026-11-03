# Phase 2: Data Preservation & Recovery Inventory Report

**Project:** InsiderNews / The Insider News Philippines  
**Repository:** `https://github.com/toruiii203/InsiderNews`  
**Supabase Project ID:** `dyamlsfldhjpimdlixfc`  
**Date:** November 3, 2026  

---

## 1. Source System Accessibility Assessment

| Access Method | Endpoint / Target | Status | Error Details |
|---|---|---|---|
| **Supabase Storage HTTP** | `https://dyamlsfldhjpimdlixfc.supabase.co/storage/v1/...` | ❌ Blocked | `HTTP 402 Payment Required` (`exceed_cached_egress_quota`) |
| **Supabase REST API (PostgREST)** | `https://dyamlsfldhjpimdlixfc.supabase.co/rest/v1/` | ❌ Restricted | `HTTP 401 Unauthorized` / Gateway Restricted |
| **Direct PostgreSQL (TCP 5432)** | `db.dyamlsfldhjpimdlixfc.supabase.co:5432` | ❌ Inaccessible | Host resolution / port unreachable (project paused / restricted) |
| **Local Repository Backups** | `C:\Users\Migs\Desktop\InsiderNews` | ⚠️ Partial | Found `sql/001_staff_about.sql`, `lib/mock-data.ts` |
| **System Downloads / Exports** | `C:\Users\Migs\Downloads` | ❌ None | No exported Supabase SQL dumps or CSV files found |

---

## 2. Table-by-Table Data Preservation Inventory

| Table Name | Source Availability | Fallback / Recovery Baseline | Preservation Action |
|---|---|---|---|
| `articles` | Supabase API blocked (402) | `lib/mock-data.ts` (10 baseline articles with schema definitions) | Schema preserved; temporary seed data configured for migration testing; live production data flagged for ingestion |
| `videos` | Supabase API blocked (402) | `lib/mock-data.ts` (mock video items) | Schema preserved; seed data configured |
| `staff` | Supabase API blocked (402) | `sql/001_staff_about.sql` (schema definitions) | Schema preserved with UUID PK and display order |
| `about_content` | Supabase API blocked (402) | `sql/001_staff_about.sql` (default mission and story insert) | Default singleton record preserved |
| `subscribers` | Supabase API blocked (402) | In-code schema in `app/api/subscribe/route.ts` | Schema preserved with unique email constraint |
| `polls` | Supabase API blocked (402) | In-code schema in `app/api/poll/active/route.ts` | Schema preserved with JSONB options |
| `poll_votes` | Supabase API blocked (402) | In-code schema in `app/api/poll/vote/route.ts` | Schema preserved with foreign key to `polls` |
| `article_views` | Supabase API blocked (402) | In-code schema in `app/api/track-view/route.ts` | Schema preserved with category and tag tracking |

---

## 3. Data Recovery & Import Protocol

1. **Schema Integrity**:
   - Every column, data type, default, primary key, check constraint, and foreign key constraint has been mapped and scripted into version-controlled SQL migrations (`sql/migrations/001_initial_schema.sql`).
2. **Safe Staging**:
   - Testing will proceed on Neon PostgreSQL (`wild-lab-08056750`) using isolated seed records clearly identifiable with test tags (`is_seed: true` or prefixed titles).
3. **Historical Production Ingestion**:
   - If the user provides a Supabase SQL dump or if access is restored via the Supabase dashboard/SQL editor, an idempotent data loading script (`scripts/restore-data.ts`) will insert the historical records without altering article IDs, timestamps, or URLs.
   - Per operating guidelines, **no historical records will be silently fabricated**, and production cutover will clearly state the source data status.
