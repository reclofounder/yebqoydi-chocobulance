# Swapping the van

The van is `src/van/van.svg`, not one of the scene drawings here (`mountVan` in `src/van/van.ts` puts it on top of the hero and road scenes). To replace it, keep the six group ids, put no transforms on the wheel groups, paint with tokens only, and update `VAN` in `van.ts` to the new geometry. The steps are in the "Swap the van" section of the root `README.md`; `tests/van.test.ts` checks the result.
