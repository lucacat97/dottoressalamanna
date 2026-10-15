# Architecture rules

- Keep displayed MILA per-consultation rates in `src/lib/mila-pricing.ts` and test their numeric values; this prevents offer copy from drifting between plans.
- AMCOP device catalogue, mapping and brochure instructions live in `supabase/functions/_shared/amcop.ts`; the external API cephalometry appends its prompt addendum and post-processes output there, so device data has one source.
- AMCOP document layouts live in `supabase/functions/_shared/amcop-docx.ts` (Word, fallback `markdownToDocx`) and `amcop-pdf.ts` (PDF with independently measured vertical columns); device/logo images are local copies in private `amcop-assets`, never fetched live from amcop.it, so documents remain available and PDF layout is preserved across readers.
- API patient initials and known-name redaction live in `_shared/patient-privacy.ts`, applied before clinical generation and output persistence without restoring names; keep tests for minimization and distinguish raw-PDF handling from structured-field redaction.
- API cephalometry `processing_mode: retrieval_rules` uses `_shared/amcop-retrieval.ts` for deterministic rules and curated AMCOP passage retrieval; return documents inline before clinical storage/email/model calls, preserving the legacy flow until the experimental result is approved.
