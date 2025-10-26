import { storage } from "@/lib/storage";

export type Project = {
  id: string;
  name: string;
  updatedAt: number;
};

export type StoredMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

const PROJECTS_KEY = "recent-projects";

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function deriveNameFromPrompt(prompt: string) {
  const trimmed = prompt.trim().replace(/\s+/g, " ");
  if (!trimmed) return "New Chat";
  const max = 48;
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

export function listProjects(): Project[] {
  return storage.getJSON<Project[]>(PROJECTS_KEY, []);
}

export function getProjectById(id: string): Project | undefined {
  return listProjects().find((p) => p.id === id);
}

export function upsertProjects(projects: Project[]) {
  storage.setJSON(PROJECTS_KEY, projects);
}

export function createProject(initialName?: string): Project {
  const projects = listProjects();
  const p: Project = {
    id: genId(),
    name: initialName && initialName.trim() ? initialName.trim() : "New Chat",
    updatedAt: Date.now(),
  };
  upsertProjects([p, ...projects]);
  return p;
}

export function touchProject(id: string) {
  const projects = listProjects().map((p) => (p.id === id ? { ...p, updatedAt: Date.now() } : p));
  upsertProjects(projects);
}

export function renameProject(id: string, name: string) {
  const projects = listProjects().map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p));
  upsertProjects(projects);
}

export function createProjectFromPrompt(prompt: string): Project {
  const name = deriveNameFromPrompt(prompt);
  return createProject(name);
}

function chatKey(projectId: string) {
  return `chat:${projectId}`;
}

export function getMessages(projectId: string): StoredMessage[] {
  return storage.getJSON<StoredMessage[]>(chatKey(projectId), []);
}

export function addMessage(projectId: string, msg: Omit<StoredMessage, "createdAt"> & { createdAt?: number }) {
  const current = getMessages(projectId);
  const full: StoredMessage = { ...msg, createdAt: msg.createdAt ?? Date.now() };
  storage.setJSON(chatKey(projectId), [...current, full]);
  touchProject(projectId);
}

export function setMessages(projectId: string, msgs: StoredMessage[]) {
  storage.setJSON(chatKey(projectId), msgs);
  touchProject(projectId);
}

/* Credits management */
const DEFAULT_CREDITS = 100;
function creditsKey(projectId: string) {
  return `credits:${projectId}`;
}
export function getCredits(projectId: string): number {
  return storage.getJSON<number>(creditsKey(projectId), DEFAULT_CREDITS);
}
export function setCredits(projectId: string, value: number) {
  storage.setJSON(creditsKey(projectId), Math.max(0, Math.floor(value)));
  touchProject(projectId);
}
export function decrementCredits(projectId: string, amount = 1): number {
  const current = getCredits(projectId);
  const next = Math.max(0, current - amount);
  setCredits(projectId, next);
  return next;
}

/* Code persistence per project */
function codeKey(projectId: string) {
  return `code:${projectId}`;
}
export function getCode(projectId: string): string | null {
  return storage.getJSON<string | null>(codeKey(projectId), null);
}
export function setCode(projectId: string, code: string) {
  storage.setJSON(codeKey(projectId), code);
  touchProject(projectId);
}

/* Delete project and its persisted data */
export function deleteProject(projectId: string) {
  // Remove from projects list
  const remaining = listProjects().filter((p) => p.id !== projectId);
  upsertProjects(remaining);

  // Remove stored data related to this project
  storage.remove(chatKey(projectId));
  storage.remove(codeKey(projectId));
  storage.remove(creditsKey(projectId));
}