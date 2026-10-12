# Architecture rules

- Keep displayed MILA per-consultation rates in `src/lib/mila-pricing.ts` and test their numeric values; this prevents offer copy from drifting between plans.