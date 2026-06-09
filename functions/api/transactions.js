// GIO Cafe & Slow Life - Serverless API transactions handler for Cloudflare D1
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // Ensure DB binding is present
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "D1 DB binding ('DB') is missing. Please check your Pages functions D1 bindings settings." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  // CORS headers (enables seamless local wrangler developer servers testing)
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (method === "GET") {
      const { results } = await env.DB.prepare(
        "SELECT * FROM transactions ORDER BY date DESC"
      ).all();
      return new Response(JSON.stringify(results), { headers: corsHeaders });
    }

    if (method === "POST") {
      const data = await request.json();
      const { id, date, income, expense, note } = data;

      if (!id || !date) {
        return new Response(JSON.stringify({ error: "Missing required fields: id and date are mandatory." }), {
          status: 400,
          headers: corsHeaders
        });
      }

      await env.DB.prepare(
        `INSERT INTO transactions (id, date, income, expense, note)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           date = excluded.date,
           income = excluded.income,
           expense = excluded.expense,
           note = excluded.note`
      ).bind(id, date, income, expense, note).run();

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    if (method === "DELETE") {
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing required query parameter: id is mandatory." }), {
          status: 400,
          headers: corsHeaders
        });
      }

      if (id === "all") {
        await env.DB.prepare("DELETE FROM transactions").run();
      } else {
        await env.DB.prepare("DELETE FROM transactions WHERE id = ?").bind(id).run();
      }
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: `Method ${method} is not supported.` }), {
      status: 405,
      headers: corsHeaders
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
