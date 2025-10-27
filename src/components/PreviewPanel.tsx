"use client";

import React, { useState } from 'react';
import IntegrationsDialog from './IntegrationsDialog';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

// NOTE: Resto del componente original se mantiene igual; solo añadimos el botón y el diálogo.

type PreviewPanelProps = {
  // Mantener las props existentes (si las hay); este archivo se sobrescribe con mínimos cambios.
};

const PreviewPanel = (props: any) => {
  const [openIntegrations, setOpenIntegrations] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b bg-background flex-shrink-0">
        <div className="flex items-center gap-2">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
          <Button variant="secondary" size="sm" onClick={() => setOpenIntegrations(true)}>
            Integrations
          </Button>
        </div>
      </div>

      {/* Conserva el resto del layout original del panel, incluyendo <Tabs> y contenidos */}
      <Tabs defaultValue="preview" className="flex-1 flex flex-col overflow-hidden">
        <TabsContent value="preview" className="flex-1 overflow-hidden">
          {/* ... contenido existente de Preview ... */}
        </TabsContent>
        <TabsContent value="issues" className="flex-1 overflow-auto">
          {/* ... contenido existente de Issues ... */}
        </TabsContent>
        <TabsContent value="code" className="flex-1 overflow-auto">
          {/* ... contenido existente de Code ... */}
        </TabsContent>
      </Tabs>

      <IntegrationsDialog open={openIntegrations} onOpenChange={setOpenIntegrations} />
    </div>
  );
};

export default PreviewPanel;