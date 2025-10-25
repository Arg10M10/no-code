import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2, Trash } from "lucide-react";
import { useState } from "react";

const providers = [
  {
    name: "OpenAI",
    logo: (
      <div className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-sm text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-400">
        OA
      </div>
    ),
  },
  {
    name: "Anthropic",
    logo: (
      <div className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-sm text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-400">
        A
      </div>
    ),
  },
  {
    name: "Google",
    logo: (
      <div className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-sm text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-400">
        G
      </div>
    ),
  },
];

async function getApiKeys(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export default function ApiKeySettings() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ["apiKeys", user?.id],
    queryFn: () => getApiKeys(user!.id),
    enabled: !!user,
  });

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("api_keys").upsert(
      {
        user_id: user.id,
        provider: provider,
        api_key: apiKey,
      },
      { onConflict: "user_id, provider" }
    );

    if (error) {
      toast({
        title: "Error saving API key",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "API key saved",
        description: `Your ${provider} API key has been saved.`,
      });
      queryClient.invalidateQueries({ queryKey: ["apiKeys", user.id] });
      setOpen(false);
      setApiKey("");
    }
    setIsSaving(false);
  };

  const handleDelete = async (provider: string) => {
    if (!user) return;
    setIsDeleting(provider);
    const supabase = createClient();
    const { error } = await supabase
      .from("api_keys")
      .delete()
      .eq("user_id", user.id)
      .eq("provider", provider);

    if (error) {
      toast({
        title: "Error deleting API key",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "API key deleted",
        description: `Your ${provider} API key has been deleted.`,
      });
      queryClient.invalidateQueries({ queryKey: ["apiKeys", user.id] });
    }
    setIsDeleting(null);
  };

  const getApiKeyForProvider = (provider: string) => {
    const key = apiKeys?.find((k) => k.provider === provider);
    return key ? `••••••••${key.api_key.slice(-4)}` : "Not set";
  };

  return (
    <div className="grid gap-4">
      <h3 className="font-medium leading-none">API Keys</h3>
      <div className="grid gap-3">
        {providers.map((p) => (
          <div
            key={p.name}
            className="flex items-center justify-between p-2 rounded-lg border"
          >
            <div className="flex items-center gap-3">
              {p.logo}
              <span className="font-medium">{p.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {isLoading ? (
                <span className="text-sm text-muted-foreground">
                  Loading...
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {getApiKeyForProvider(p.name)}
                </span>
              )}
              <Dialog
                open={open && provider === p.name}
                onOpenChange={(isOpen) => {
                  if (!isOpen) {
                    setOpen(false);
                    setApiKey("");
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setProvider(p.name);
                      setOpen(true);
                    }}
                  >
                    <KeyRound className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Set {p.name} API Key</DialogTitle>
                    <DialogDescription>
                      Enter your API key for {p.name}. This will be
                      stored securely.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="api-key" className="text-right">
                        API Key
                      </Label>
                      <Input
                        id="api-key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="col-span-3"
                        type="password"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(p.name)}
                disabled={
                  isDeleting === p.name ||
                  getApiKeyForProvider(p.name) === "Not set"
                }
              >
                {isDeleting === p.name ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}