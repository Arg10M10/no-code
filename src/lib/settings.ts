import { storage } from "@/lib/storage";

export const SELECTED_MODEL_KEY = "selected-model";

export function getSelectedModelLabel(defaultLabel = "OpenAI - GPT-5"): string {
  return storage.getJSON<string>(SELECTED_MODEL_KEY, defaultLabel);
}

export function setSelectedModelLabel(label: string) {
  storage.setJSON(SELECTED_MODEL_KEY, label);
}

/* Plan del usuario: 'free' o 'pro'. Por defecto 'free'.
   Nota: Esto se guarda en localStorage solo a efectos de UI.
   Si en el futuro hay sistema real de suscripción, reemplazar por verificación real. */
export type UserPlan = "free" | "pro";
const USER_PLAN_KEY = "user-plan";

export function getUserPlan(): UserPlan {
  const val = storage.getJSON<UserPlan | null>(USER_PLAN_KEY, null);
  return val === "pro" ? "pro" : "free";
}

export function setUserPlan(plan: UserPlan) {
  storage.setJSON<UserPlan>(USER_PLAN_KEY, plan);
}