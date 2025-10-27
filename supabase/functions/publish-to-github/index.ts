import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const GITHUB_API_URL = "https://api.github.com";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { repoName, fileContent } = await req.json();

    if (!repoName || !fileContent) {
      return new Response("repoName and fileContent are required", {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return new Response("Not authenticated", {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    const githubToken = session.provider_token;
    if (!githubToken) {
      return new Response("GitHub provider token not found. Please re-authenticate.", {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // 1. Create Repository
    const repoResponse = await fetch(`${GITHUB_API_URL}/user/repos`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: repoName,
        private: true,
        description: 'Project generated with Brimy, ready for Vercel/Netlify deployment.',
      }),
    });

    if (!repoResponse.ok) {
      const errorData = await repoResponse.json();
      console.error("GitHub repo creation error:", errorData);
      const errorMessage = errorData.errors?.[0]?.message || errorData.message || "Failed to create repository.";
      return new Response(`GitHub Error: ${errorMessage}`, {
        status: repoResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }
    const repoData = await repoResponse.json();
    const owner = repoData.owner.login;

    // 2. Create and commit index.html
    const contentEncoded = btoa(unescape(encodeURIComponent(fileContent)));
    const fileResponse = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repoName}/contents/index.html`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Initial commit from Brimy',
        content: contentEncoded,
      }),
    });

    if (!fileResponse.ok) {
      console.error("GitHub file creation failed. Deleting repository to clean up.");
      await fetch(repoData.url, { method: 'DELETE', headers: { 'Authorization': `token ${githubToken}` } });
      
      const errorData = await fileResponse.json();
      const errorMessage = errorData.message || "Failed to create file in repository.";
      return new Response(`GitHub Error: ${errorMessage}`, {
        status: fileResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Success
    return new Response(JSON.stringify({ html_url: repoData.html_url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Internal server error:", error);
    return new Response(error.message, {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  }
});