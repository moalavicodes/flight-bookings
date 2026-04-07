export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { from, to, date } = req.body || {};

    if (!from || !to || !date) {
      return res.status(400).json({ error: "from, to, and date are required" });
    }

    const aviationKey = process.env.AVIATIONSTACK_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!aviationKey || !supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: "Missing server environment variables" });
    }

    const apiUrl =
      `http://api.aviationstack.com/v1/flights` +
      `?access_key=${aviationKey}` +
      `&dep_iata=${encodeURIComponent(from)}` +
      `&arr_iata=${encodeURIComponent(to)}` +
      `&flight_date=${encodeURIComponent(date)}`;

    const aviationResp = await fetch(apiUrl);
    const aviationJson = await aviationResp.json();

    if (!aviationResp.ok || aviationJson.error) {
      return res.status(400).json({
        error: "Aviationstack request failed",
        details: aviationJson.error || aviationJson
      });
    }

    const rows = (aviationJson.data || []).map((f) => {
      const depScheduled = f.departure?.scheduled || null;
      const arrScheduled = f.arrival?.scheduled || null;

      const depTime = depScheduled ? new Date(depScheduled).toISOString().slice(11, 16) : null;
      const arrTime = arrScheduled ? new Date(arrScheduled).toISOString().slice(11, 16) : null;

      const durationMin =
        depScheduled && arrScheduled
          ? Math.max(0, Math.round((new Date(arrScheduled) - new Date(depScheduled)) / 60000))
          : null;

      const durationText = durationMin
        ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`
        : null;

      const airlineCode = f.airline?.iata || "SK";
      const flightNumber = f.flight?.iata || `${airlineCode}${f.flight?.number || ""}` || null;

      const externalFlightId = `${f.flight_date}-${flightNumber}-${from}-${to}`;

      const basePrice = 199;
      const markup = 0;
      const tax = 24;
      const priceOverride = null;
      const displayPrice = priceOverride ?? (basePrice + markup + tax);

      return {
        external_source: "aviationstack",
        external_flight_id: externalFlightId,
        api_status: f.flight_status || null,
        airline_code: airlineCode,
        flight_number: flightNumber,
        from_code: from,
        to_code: to,
        flight_date: f.flight_date,
        dep_time: depTime,
        arr_time: arrTime,
        duration_text: durationText,
        duration_min: durationMin,
        stops: 0,
        cabin: "Economy",
        price: basePrice,
        markup,
        tax,
        price_override: priceOverride,
        display_price: displayPrice,
        baggage: "1 carry-on, 1 checked bag",
        fare_rules: "Changes with fee.",
        meals: "Snacks included",
        seat_pitch: "31 inches",
        wifi: "Available",
        is_visible: true,
        is_manual: false
      };
    });

    const supabaseResp = await fetch(`${supabaseUrl}/rest/v1/flights`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify(rows)
    });

    const supabaseJson = await supabaseResp.json();

    if (!supabaseResp.ok) {
      return res.status(400).json({
        error: "Supabase insert failed",
        details: supabaseJson
      });
    }

    return res.status(200).json({
      imported: supabaseJson.length || 0,
      flights: supabaseJson
    });
  } catch (err) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message
    });
  }
}