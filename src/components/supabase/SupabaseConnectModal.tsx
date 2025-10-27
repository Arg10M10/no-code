"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getSupabaseConfig, setSupabaseConfig, clearSupabaseConfig, isSupabaseConfigured } from "@/integrations/supabase/config";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ConnStatus = "no-connected" | "connected" | "limited";

type ProjectRow = { id: string; name?: string | null; updated_at?: string | null };

const shortHelpText =
  "Pega tu Project URL y la anon/public API key para conectar tu app a Supabase. En tu panel de Supabase, agrega la Redirect URL de tu app en Auth → Redirect URLs (ej.: http://localhost:5173/auth/callback y https://miapp.com/auth/callback).";

const SQL_CREATE_PROJECTS = `-- Extensión para UUID
create extension if not exists "pgcrypto";

-- Tabla projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null default '',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Seguridad: Habilitar RLS
alter table public.projects enable row level security;

-- Políticas por usuario autenticado
create policy "projects_select_policy"
on public.projects for select
to authenticated using (auth.uid() = user_id);

create policy "projects_insert_policy"
on public.projects for insert
to authenticated with check (auth.uid() = user_id);

create policy "projects_update_policy"
on public.projects for update
to authenticated using (auth.uid() = user_id);

create policy "projects_delete_policy"
on public.projects for delete
to authenticated using (auth.uid() = user_id);`;

function validateUrl(val: string) {
  try {
    const u = new URL(val);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function getHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

const SupabaseConnectModal: React.FC<Props> = ({ open, onOpenChange }) => {
  const [projectUrl, setProjectUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");

  const [connStatus, setConnStatus] = useState<ConnStatus>("no-connected");
  const [host, setHost] = useState("");
  const [testing, setTesting] = useState(false);
  const [authChecking, setAuthChecking] = useState(false);
  const [missingTable, setMissingTable] = useState(false);
  const [lastProjects, setLastProjects] = useState<ProjectRow[] | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showSqlHelp, setShowSqlHelp] = useState(false);

  const fieldsValid = useMemo(() => {
    return validateUrl(projectUrl) && anonKey.trim().length > 20;
  }, [projectUrl, anonKey]);

  useEffect(() => {
    if (!open) return;
    // Cargar configuración previa (si existe)
    const cfg = getSupabaseConfig();
    if (cfg) {
      setProjectUrl(cfg.url);
      setAnonKey(cfg.anonKey);
      setHost(getHost(cfg.url));
      setConnStatus("connected");
    } else {
      setConnStatus("no-connected");
      setHost("");
    }
    setMissingTable(false);
    setLastProjects(null);
    setUserId(null);
    setShowSqlHelp(false);
  }, [open]);

  function getClient(): SupabaseClient | null {
    if (!fieldsValid) return null;
    return createClient(projectUrl.trim(), anonKey.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  async function testConexion() {
    if (!fieldsValid) return;
    setTesting(true);
    setMissingTable(false);
    setLastProjects(null);

    const supabase = getClient();
    if (!supabase) {
      setTesting(false);
      return;
    }

    try {
      // Guardar localmente antes para reusar la config en el flujo de auth
      setSupabaseConfig({ url: projectUrl, anonKey });
      setHost(getHost(projectUrl));

      const { data, error } = await supabase.from("projects").select("id").limit(1);

      if (error) {
        const msg = (error as any)?.message?.toLowerCase?.() || "";
        const code = (error as any)?.code || "";
        // Tabla inexistente suele ser código 42P01 o mensaje "relation ... does not exist"
        if (code === "42P01" || msg.includes("does not exist")) {
          setConnStatus("limited");
          setMissingTable(true);
          toast.warning("Conexión OK, pero falta la tabla 'projects'.", {
            description: "Puedes crearla automáticamente o pegar el SQL en tu editor de consultas.",
          });
        } else {
          // Errores de CORS/clave/domino
          if (msg.includes("invalid api key") || msg.includes("jwt") || msg.includes("cors")) {
            toast.error("Error de conexión", {
              description:
                "Revisa la anon key, valida la Project URL y añade la Redirect URL en Auth. Si el error persiste, revisa CORS en el Dashboard.",
            });
          } else {
            toast.error("Error de conexión", {
              description: (error as any)?.message || "No se pudo conectar a Supabase.",
            });
          }
          setConnStatus("no-connected");
        }
        setTesting(false);
        return;
      }

      // Si no hay error, hay conexión; mostrar preview si es posible
      setConnStatus("connected");
      await listarProyectosInterno(supabase);
      toast.success("Conexión OK");
    } catch (err: any) {
      const msg = err?.message?.toLowerCase?.() || "";
      if (msg.includes("cors")) {
        toast.error("Error CORS", {
          description:
            "Configura los orígenes permitidos y Redirect URLs en Auth de tu proyecto Supabase.",
        });
      } else {
        toast.error("Error inesperado", {
          description: err?.message || "No se pudo completar la prueba de conexión.",
        });
      }
      setConnStatus("no-connected");
    } finally {
      setTesting(false);
    }
  }

  async function listarProyectosInterno(client?: SupabaseClient) {
    const supabase = client ?? getClient();
    if (!supabase) return;
    const { data, error } = await supabase
      .from("projects")
      .select("id,name,updated_at")
      .order("updated_at", { ascending: false })
      .limit(5);

    if (!error && data) {
      setLastProjects(data as ProjectRow[]);
      setMissingTable(false);
    } else if (error) {
      const code = (error as any)?.code || "";
      const msg = (error as any)?.message?.toLowerCase?.() || "";
      if (code === "42P01" || msg.includes("does not exist")) {
        setMissingTable(true);
      }
    }
  }

  async function createTableIfAllowed() {
    if (!fieldsValid) return;
    const confirmed = window.confirm(
      "Se crearán tablas/policies en su proyecto Supabase. ¿Desea continuar?"
    );
    if (!confirmed) return;

    // Nota: Crear tablas/policies requiere rol con permisos elevados (service_role).
    // Con una anon key lo más probable es que falle. Por seguridad no usamos service_role en frontend.
    // Intentamos una vía teórica (ej. RPC preexistente), y si no, mostramos el SQL para copiar/pegar.
    const supabase = getClient();
    if (!supabase) return;

    try {
      // Intento de RPC opcional (no existe por defecto). Esto fallará normalmente con anon key.
      const { error } = await supabase.rpc("exec_sql", { sql: SQL_CREATE_PROJECTS });
      if (error) {
        setShowSqlHelp(true);
        toast.message("Permisos insuficientes para crear la tabla automáticamente.", {
          description: "Copia el SQL provisto y ejecútalo en tu editor de SQL de Supabase.",
        });
        return;
      }
      toast.success("Tabla 'projects' creada.");
      setMissingTable(false);
      await listarProyectosInterno(supabase);
    } catch {
      setShowSqlHelp(true);
      toast.message("No fue posible crear la tabla automáticamente.", {
        description: "Copia el SQL provisto y ejecútalo en Supabase.",
      });
    }
  }

  async function iniciarAuth() {
    if (!fieldsValid) {
      toast.error("Completa los campos requeridos");
      return;
    }
    setAuthChecking(true);
    try {
      const supabase = getClient();
      if (!supabase) return;

      const redirectTo = `${window.location.origin}/auth/callback`;
      // Importante: añade esta URL en tu proyecto Supabase → Auth → Redirect URLs
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo },
      });
      if (error) {
        toast.error("Error al iniciar autenticación", { description: error.message });
        return;
      }
      // Tras el redirect, el usuario volverá con sesión iniciada si la Redirect URL está configurada.
      toast.message("Redirigiendo a GitHub para autenticar…");
    } finally {
      setAuthChecking(false);
    }
  }

  async function comprobarSesionYPermisos() {
    if (!fieldsValid) return;
    setAuthChecking(true);
    try {
      const supabase = getClient();
      if (!supabase) return;

      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userRes?.user) {
        setUserId(null);
        toast.message("No hay sesión activa", {
          description: "Inicia sesión con 'Conectar y autenticar'.",
        });
      } else {
        setUserId(userRes.user.id);
        toast.success("Sesión detectada", { description: `Usuario: ${userRes.user.id}` });
        // Comprobamos lectura/escritura básica
        await listarProyectosInterno(supabase);
      }
    } finally {
      setAuthChecking(false);
    }
  }

  function guardarProyecto() {
    if (!fieldsValid) {
      toast.error("Completa los campos obligatorios antes de guardar.");
      return;
    }
    setSupabaseConfig({ url: projectUrl, anonKey });
    setHost(getHost(projectUrl));
    setConnStatus("connected");
    toast.success("Configuración guardada en este navegador");
  }

  function desconectar() {
    clearSupabaseConfig();
    setProjectUrl("");
    setAnonKey("");
    setConnStatus("no-connected");
    setHost("");
    setUserId(null);
    setLastProjects(null);
    setMissingTable(false);
    setShowSqlHelp(false);
    toast.message("Desconectado y configuración borrada de este navegador");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle>Conectar Supabase</DialogTitle>
              <DialogDescription>{shortHelpText}</DialogDescription>
            </div>
            <div
              className={cn(
                "text-xs px-2 py-1 rounded-md border whitespace-nowrap",
                connStatus === "connected" && "border-green-600 text-green-400 bg-green-500/10",
                connStatus === "limited" && "border-yellow-600 text-yellow-300 bg-yellow-500/10",
                connStatus === "no-connected" && "border-neutral-700 text-neutral-300 bg-neutral-800/60"
              )}
            >
              {connStatus === "connected"
                ? `Conectado a ${host || "—"}`
                : connStatus === "limited"
                ? "Con permisos limitados"
                : "No conectado"}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-md border border-border p-3 text-xs leading-relaxed">
            - Nunca pegues tu service_role key en el frontend. Usa solo la anon/public key.
            <br />
            - Añade tu Redirect URL en Auth → Redirect URLs. Ejemplos:
            <span className="font-mono"> http://localhost:5173/auth/callback</span> y
            <span className="font-mono"> https://miapp.com/auth/callback</span>.
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="sb-url">Project URL</Label>
              <Input
                id="sb-url"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                placeholder="https://YOUR-PROJECT.supabase.co"
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sb-anon">Anon/Public API Key</Label>
              <Input
                id="sb-anon"
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                autoComplete="off"
              />
            </div>

            <div className="text-xs text-muted-foreground">
              ¿Dónde encuentro estos datos? En Supabase → Project → Settings → API. Copia el Project URL y la anon/public key.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={testConexion} disabled={!fieldsValid || testing}>
              {testing ? "Probando..." : "Test conexión"}
            </Button>
            <Button
              variant="outline"
              onClick={createTableIfAllowed}
              disabled={!fieldsValid || (!missingTable && connStatus !== "limited")}
              title="Crear tabla 'projects' y políticas RLS"
            >
              Crear tabla projects (automático)
            </Button>
            <Button onClick={iniciarAuth} disabled={!fieldsValid || authChecking}>
              {authChecking ? "Abriendo autenticación..." : "Conectar y autenticar"}
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <div className="ml-auto flex gap-2">
              <Button variant="secondary" onClick={guardarProyecto} disabled={!fieldsValid}>
                Guardar en este navegador
              </Button>
              {isSupabaseConfigured() && (
                <Button variant="destructive" onClick={desconectar}>
                  Desconectar
                </Button>
              )}
            </div>
          </div>

          {userId && (
            <div className="rounded-md border border-border p-3 text-sm">
              Usuario autenticado: <span className="font-mono">{userId}</span>
            </div>
          )}

          {lastProjects && (
            <div className="rounded-md border border-border p-3">
              <div className="text-sm font-medium mb-2">Últimos proyectos (vista previa)</div>
              {lastProjects.length === 0 ? (
                <div className="text-sm text-muted-foreground">No hay registros en la tabla projects.</div>
              ) : (
                <div className="space-y-2">
                  {lastProjects.map((p) => (
                    <div key={p.id} className="text-sm grid grid-cols-3 gap-2">
                      <span className="font-mono truncate">{p.id}</span>
                      <span className="truncate">{p.name || "—"}</span>
                      <span className="truncate">{p.updated_at ? new Date(p.updated_at).toLocaleString() : "—"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showSqlHelp || missingTable ? (
            <div className="rounded-md border border-yellow-600/40 bg-yellow-500/5 p-3">
              <div className="text-sm font-semibold mb-2">SQL para crear la tabla y RLS</div>
              <pre className="whitespace-pre-wrap text-xs leading-relaxed">{SQL_CREATE_PROJECTS}</pre>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(SQL_CREATE_PROJECTS);
                    toast.success("SQL copiado al portapapeles");
                  }}
                >
                  Copiar SQL
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    toast.message("Instrucciones", {
                      description:
                        "Abre Supabase → SQL Editor → pega el SQL → Ejecuta. Luego vuelve aquí y pulsa 'Test conexión'.",
                    })
                  }
                >
                  Ver instrucciones
                </Button>
              </div>
            </div>
          ) : null}

          <div className="rounded-md border border-border p-3 text-sm">
            Conecta en 3 pasos:
            <ol className="list-decimal ml-5 mt-2 space-y-1">
              <li>Pega tu Project URL y la anon/public key, luego pulsa “Test conexión”.</li>
              <li>Si falta la tabla, crea con el botón o pega el SQL en el SQL Editor.</li>
              <li>Pulsa “Conectar y autenticar” y añade la Redirect URL en Auth si se solicita.</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupabaseConnectModal;