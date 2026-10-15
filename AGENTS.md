# Architecture rules

- Keep displayed MILA per-consultation rates in `src/lib/mila-pricing.ts` and test their numeric values; this prevents offer copy from drifting between plans.- AMCOP device catalogue, mapping and brochure instructions live in `supabase/functions/_shared/amcop.ts`; the external API cephalometry appends its prompt addendum and post-processes output there, so device data has one source.
