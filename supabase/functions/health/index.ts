// Minimal Edge Function used as a deploy smoke test:
//   supabase functions deploy health
// Heavy pricing (Monte Carlo, Heston/SABR, baskets) will live in sibling
// functions per CLAUDE.md §4.2; each must be seeded-deterministic, cap paths
// and steps server-side, and be rate-limited per user.
Deno.serve(() => {
  return new Response(
    JSON.stringify({ ok: true, service: "optionsApp", time: new Date().toISOString() }),
    { headers: { "Content-Type": "application/json" } },
  );
});
