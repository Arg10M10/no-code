"use client";

import { useNavigate } from "react-router-dom";
import { ApiKeySettings } from "@/components/ApiKeySettings";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <Button
        variant="ghost"
        className="mb-6 px-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <ApiKeySettings />
    </div>
  );
}