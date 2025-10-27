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
    // Step 0: Parse request body
    const { repoName, fileContent } = await req.json();
    if (!repoName || !fileContent) {
      return new Response(JSON.stringify({ error: "Bad Request", details: "repoName and fileContent are required." }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Validate server configuration
    const githubToken = Deno.env.get("GITHUB_PRIVATE_KEY");
    if (!githubToken) {
      const details = "Server configuration error: GITHUB_PRIVATE_KEY is not set. Please ask the administrator to configure it in the Supabase project settings.";
      console.error(details);
      return new Response(JSON.stringify({ error: "Server Configuration Error", details }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Validate user authentication
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      const details = "Authentication failed. You must be logged in to publish a project.";
      console.error("Supabase auth error:", userError);
      return new Response(JSON.stringify({ error: "Authentication Required", details }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Verify the GitHub token and get the owner
    let owner;
    try {
      const userResponse = await fetch(`${GITHUB_API_URL}/user`, {
        headers: { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github.v3+json' },
      });
      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(`GitHub API returned status ${userResponse.status}: ${errorData.message || 'Failed to verify token.'}`);
      }
      const githubUserData = await userResponse.json();
      owner = githubUserData.login;
    } catch (error) {
      const details = `The GITHUB_PRIVATE_KEY provided in the server environment seems to be invalid or expired. Please check the key and its permissions. Details: ${error.message}`;
      console.error(details);
      return new Response(JSON.stringify({ error: "Invalid GitHub Token", details }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 4: Create the repository
    let repoData;
    try {
      const repoResponse = await fetch(`${GITHUB_API_URL}/user/repos`, {
        method: 'POST',
        headers: { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: repoName,
          private: true,
          description: `Project generated for user ${user.id} by Brimy.`,
        }),
      });
      if (!repoResponse.ok) {
        const errorData = await repoResponse.json();
        const ghError = errorData.errors?.[0]?.message || errorData.message || "Unknown error from GitHub.";
        throw new Error(`GitHub API returned status ${repoResponse.status}: ${ghError}`);
      }
      repoData = await repoResponse.json();
    } catch (error) {
      const details = `Could not create the GitHub repository. This often happens if the repository name already exists, or if the GITHUB_PRIVATE_KEY does not have the 'repo' scope permission. Details: ${error.message}`;
      console.error(details);
      return new Response(JSON.stringify({ error: "Repository Creation Failed", details }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 5: Create and commit the index.html file
    try {
      const contentEncoded = btoa(unescape(encodeURIComponent(fileContent)));
      const fileResponse = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repoName}/contents/index.html`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Initial commit from Brimy', content: contentEncoded }),
      });
      if (!fileResponse.ok) {
        const errorData = await fileResponse.json();
        throw new Error(`GitHub API returned status ${fileResponse.status}: ${errorData.message || 'Failed to commit file.'}`);
      }
    } catch (error) {
      // Cleanup: Delete the created repository if the file commit fails
      console.error(`File commit failed: ${error.message}. Cleaning up by deleting the repository.`);
      await fetch(repoData.url, { method: 'DELETE', headers: { 'Authorization': `token ${githubToken}` } });
      const details = `The repository was created, but the file could not be committed. The empty repository has been deleted for cleanup. Details: ${error.message}`;
      return new Response(JSON.stringify({ error: "File Commit Failed", details }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 6: Success
    return new Response(JSON.stringify({ html_url: repoData.html_url }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // General catch-all for unexpected errors (e.g., JSON parsing)
    console.error("Internal server error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error", details: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});