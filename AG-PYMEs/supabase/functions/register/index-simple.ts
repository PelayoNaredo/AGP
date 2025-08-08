/**
 * 🚀 Edge Function SIMPLE: Register (Testing Version)
 *
 * Versión minimalista para diagnosticar problemas de timeout
 */

export default async (req: Request) => {
  const method = req.method;

  if (method === "GET") {
    return new Response(
      JSON.stringify({
        message: "Register function is alive",
        timestamp: new Date().toISOString(),
        status: "ok",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers":
            "authorization, x-client-info, apikey, content-type",
        },
      }
    );
  }

  if (method === "POST") {
    try {
      const body = await req.json();
      return new Response(
        JSON.stringify({
          message: "Register POST received",
          received: body,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON",
          message: error.message,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  }

  return new Response(
    JSON.stringify({
      error: "Method not allowed",
    }),
    {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
};
