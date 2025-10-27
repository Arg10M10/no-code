// @ts-nocheck
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
      return new Response(JSON.stringify({ error: "Bad Request", details: "repoName and fileContent are required." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Get the system's GitHub Token from environment variables
    const githubToken = Deno.env.get("GITHUB_PRIVATE_KEY");
    if (!githubToken) {
      const errorMsg = "Configuration error: GITHUB_PRIVATE_KEY is not set in the server environment. Please contact support.";
      console.error(errorMsg);
      return new Response(JSON.stringify({ error: "Server Configuration Error", details: errorMsg }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Authenticate the user with Supabase to ensure they are logged in
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Supabase auth error:", userError);
      return new Response(JSON.stringify({ error: "Authentication Required", details: "You must be logged in to perform this action." }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // The owner of the repository will be the owner of the token.
    // We fetch the user associated with the token to get the correct owner login.
    const userResponse = await fetch(`${GITHUB_API_URL}/user`, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
        return new Response(JSON.stringify({ error: "GitHub API Error", details: "The server's GitHub token is invalid or has expired. Please contact support." }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    const githubUserData = await userResponse.json();
    const owner = githubUserData.login;

    // Step 3: Create the repository under the token owner's account
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
        description: `Project generated for user ${user.id} by Brimy.`,
      }),
    });

    if (!repoResponse.ok) {
      const errorData = await repoResponse.json();
      console.error("GitHub repo creation error:", errorData);
      const errorMessage = errorData.errors?.[0]?.message || errorData.message || "Failed to create repository.";
      if (repoResponse.status === 422) {
         return new Response(JSON.stringify({ error: "GitHub API Error", details: `Could not create repository. Reason: ${errorMessage}. This usually means the repository already exists or the name is invalid.` }), {
            status: repoResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: "GitHub API Error", details: errorMessage }), {
        status: repoResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const repoData = await repoResponse.json();

    // Step 4: Create and commit index.html
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
      return new Response(JSON.stringify({ error: "GitHub API Error", details: `Repository was created but file commit failed: ${errorMessage}. The empty repository has been deleted.` }), {
        status: fileResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Success
    return new Response(JSON.stringify({ html_url: repoData.html_url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Internal server error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error", details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});