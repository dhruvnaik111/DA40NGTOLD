// Replace this with your GitHub Pages origin if you use a custom domain.
const ALLOWED_ORIGIN = "https://dhruvnaik111.github.io";
const AVIATION_WEATHER_API = "https://aviationweather.gov/api/data";

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin");
    const corsHeaders = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Vary": "Origin"
    };

    if (origin !== ALLOWED_ORIGIN) {
      return new Response("Origin not allowed.", { status: 403 });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "GET") {
      return new Response("Method not allowed.", {
        status: 405,
        headers: { ...corsHeaders, "Allow": "GET, OPTIONS" }
      });
    }

    const requestUrl = new URL(request.url);
    const resource = requestUrl.pathname.replace(/^\/+|\/+$/g, "");
    if (resource !== "airport" && resource !== "metar") {
      return new Response("Unknown weather resource.", { status: 404, headers: corsHeaders });
    }

    const airportCode = requestUrl.searchParams.get("ids")?.trim().toUpperCase();
    if (!airportCode || !/^[A-Z0-9]{3,4}$/.test(airportCode)) {
      return new Response("Provide a valid 3- or 4-character airport code.", {
        status: 400,
        headers: corsHeaders
      });
    }

    const upstreamUrl = new URL(`${AVIATION_WEATHER_API}/${resource}`);
    upstreamUrl.searchParams.set("ids", airportCode);
    upstreamUrl.searchParams.set("format", "json");

    try {
      const upstreamResponse = await fetch(upstreamUrl);
      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        headers: {
          ...corsHeaders,
          "Content-Type": upstreamResponse.headers.get("Content-Type") || "application/json",
          "Cache-Control": "no-store"
        }
      });
    } catch {
      return new Response("Unable to reach Aviation Weather.gov.", {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" }
      });
    }
  }
};
