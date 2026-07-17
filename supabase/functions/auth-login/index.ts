import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function generateSessionToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return jsonResponse({ error: "Email dan password wajib diisi" }, 400);
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get user by email to check status
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const adminUser = listData?.users?.find((u) => u.email === email);

    if (adminUser) {
      const meta = adminUser.user_metadata ?? {};
      if (meta.status === "inactive") {
        return jsonResponse(
          { error: "Akun ini telah dinonaktifkan. Hubungi administrator." },
          403
        );
      }
    }

    // Use GoTrue API directly to sign in (server-to-server, no CORS issues)
    const gotrue = `${url}/auth/v1/token?grant_type=password`;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authRes = await fetch(gotrue, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
      },
      body: JSON.stringify({ email, password }),
    });

    const authData = await authRes.json();

    if (!authRes.ok || authData.error || authData.error_description) {
      const errMsg =
        authData.error_description || authData.msg || authData.error || "Login gagal";

      if (adminUser) {
        const current =
          (adminUser.user_metadata?.failed_login_count as number) ?? 0;
        const next = current + 1;
        if (next >= 3) {
          await supabaseAdmin.auth.admin.updateUserById(adminUser.id, {
            user_metadata: { failed_login_count: next, status: "inactive" },
          });
          return jsonResponse(
            {
              error:
                "Akun dinonaktifkan otomatis karena 3x percobaan login gagal. Hubungi administrator.",
            },
            403
          );
        } else {
          await supabaseAdmin.auth.admin.updateUserById(adminUser.id, {
            user_metadata: { failed_login_count: next },
          });
          return jsonResponse(
            { error: `${errMsg} (${next}/3 percobaan gagal)` },
            401
          );
        }
      }

      return jsonResponse({ error: errMsg }, 401);
    }

    // Generate a unique session token for single-session enforcement
    const sessionToken = generateSessionToken();

    // Reset failed_login_count and store session_token in user_metadata
    if (adminUser) {
      await supabaseAdmin.auth.admin.updateUserById(adminUser.id, {
        user_metadata: {
          ...adminUser.user_metadata,
          failed_login_count: 0,
          session_token: sessionToken,
        },
      });
    }

    return jsonResponse({
      session: {
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
        expires_in: authData.expires_in,
        token_type: authData.token_type,
      },
      user: authData.user,
      session_token: sessionToken,
    });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
