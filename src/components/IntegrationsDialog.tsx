"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast, Toaster } from 'sonner';
import { Plug, CheckCircle2, XCircle } from 'lucide-react';

import { getConfig, setConfig, clearConfig, isConnected, testConnection } from '@/integrations/supabase/byos';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const schema = z.object({
  url: z.string().url('Ingresa una URL válida de Supabase'),
  anonKey: z.string().min(1, 'El anon key es requerido'),
  useForAuth: z.boolean().default(true),
  useForDB: z.boolean().default(true),
  useForStorage: z.boolean().default(false),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function IntegrationsDialog({ open, onOpenChange }: Props) {
  const existing = useMemo(() => getConfig(), [open]);
  const [testing, setTesting] = useState(false);
  const [testedOK, setTestedOK] = useState<boolean | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      url: existing?.url ?? '',
      anonKey: existing?.anonKey ?? '',
      useForAuth: true,
      useForDB: true,
      useForStorage: false,
    },
  });

  useEffect(() => {
    // Reset defaults when dialog opens
    if (open) {
      form.reset({
        url: existing?.url ?? '',
        anonKey: existing?.anonKey ?? '',
        useForAuth: true,
        useForDB: true,
        useForStorage: false,
      });
      setTestedOK(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const connected = isConnected();

  const onTest = async () => {
    const { url, anonKey } = form.getValues();
    const parsed = schema.pick({ url: true, anonKey: true }).safeParse({ url, anonKey });
    if (!parsed.success) {
      toast.error('Revisa URL y anon key');
      return;
    }
    setTesting(true);
    const res = await testConnection(url, anonKey);
    setTesting(false);
    if (res.ok) {
      setTestedOK(true);
      toast.success('Conexión verificada');
    } else {
      setTestedOK(false);
      toast.error(`No se pudo conectar: ${res.error ?? 'Error desconocido'}`);
    }
  };

  const onSave = async (values: FormValues) => {
    const res = await testConnection(values.url, values.anonKey);
    if (!res.ok) {
      toast.error('La verificación falló. Revisa URL/anon key.');
      return;
    }
    setConfig({ url: values.url, anonKey: values.anonKey });
    toast.success('Supabase conectado a tu editor');
    onOpenChange(false);
  };

  const onDisconnect = () => {
    clearConfig();
    toast.success('Conexión eliminada');
    onOpenChange(false);
  };

  return (
    <>
      <Toaster richColors position="top-center" />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plug className="h-5 w-5" />
              Integrations · Supabase
            </DialogTitle>
            <DialogDescription>
              Conecta tu propio proyecto de Supabase para usarlo dentro del editor. Guardamos la URL y el anon key localmente en tu navegador.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="url">Supabase URL</Label>
              <Input id="url" placeholder="https://YOUR_PROJECT_ID.supabase.co" {...form.register('url')} />
              {form.formState.errors.url?.message && (
                <p className="text-sm text-red-600">{form.formState.errors.url.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="anonKey">Anon key</Label>
              <Input id="anonKey" type="password" placeholder="eyJhbGciOi..." {...form.register('anonKey')} />
              {form.formState.errors.anonKey?.message && (
                <p className="text-sm text-red-600">{form.formState.errors.anonKey.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Usar para Auth</p>
                  <p className="text-xs text-muted-foreground">Sesión y login</p>
                </div>
                <Switch checked={form.watch('useForAuth')} onCheckedChange={(v) => form.setValue('useForAuth', v)} />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Usar para DB</p>
                  <p className="text-xs text-muted-foreground">Datos del editor</p>
                </div>
                <Switch checked={form.watch('useForDB')} onCheckedChange={(v) => form.setValue('useForDB', v)} />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Usar para Storage</p>
                  <p className="text-xs text-muted-foreground">Archivos y assets</p>
                </div>
                <Switch checked={form.watch('useForStorage')} onCheckedChange={(v) => form.setValue('useForStorage', v)} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {testedOK === true && (
                <span className="inline-flex items-center text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Conexión verificada
                </span>
              )}
              {testedOK === false && (
                <span className="inline-flex items-center text-red-600 text-sm">
                  <XCircle className="h-4 w-4 mr-1" /> Fallo de verificación
                </span>
              )}
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between gap-2">
            <div className="flex-1">
              {connected ? (
                <p className="text-sm text-green-700">Estado: Conectado</p>
              ) : (
                <p className="text-sm text-muted-foreground">Estado: Sin conectar</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={onTest} disabled={testing}>
                {testing ? 'Probando…' : 'Test connection'}
              </Button>
              {connected ? (
                <Button type="button" variant="destructive" onClick={onDisconnect}>
                  Disconnect
                </Button>
              ) : (
                <Button type="button" onClick={form.handleSubmit(onSave)}>
                  Save & connect
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}