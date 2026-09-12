import { createDeletionServer } from "./server.ts";

let handler: Awaited<ReturnType<typeof createDeletionServer>> | undefined;
Deno.serve(async (request: Request) => {
  try {
    handler ??= await createDeletionServer(name => Deno.env.get(name));
    return await handler(request);
  } catch {
    // Never include credentials, authorization codes, or upstream error bodies.
    return new Response(JSON.stringify({error: "account_service_unavailable"}), {
      status: 503,
      headers: {"Content-Type": "application/json", "Cache-Control": "no-store"},
    });
  }
});
