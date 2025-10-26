const PROJECTS_KEY = "dyad_projects";
const MESSAGES_KEY_PREFIX = "dyad_messages_";
const CODE_KEY_PREFIX = "dyad_code_";

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  credits: number;
}

export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

export const getAllProjects = (): Project[] => {
  const projectsJson = localStorage.getItem(PROJECTS_KEY);
  return projectsJson ? JSON.parse(projectsJson) : [];
};

export const createProject = (name: string): Project => {
  const projects = getAllProjects();
  const newProject: Project = {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    credits: 10,
  };
  projects.unshift(newProject);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  return newProject;
};

export const getProjectById = (id: string): Project | undefined => {
  const projects = getAllProjects();
  return projects.find((p) => p.id === id);
};

export const updateProjectName = (id: string, newName: string): void => {
  const projects = getAllProjects();
  const projectIndex = projects.findIndex((p) => p.id === id);
  if (projectIndex !== -1) {
    projects[projectIndex].name = newName;
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }
};

export const deleteProject = (id: string): void => {
  const projects = getAllProjects();
  const updatedProjects = projects.filter(p => p.id !== id);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));

  // Also remove associated messages and code
  localStorage.removeItem(`${MESSAGES_KEY_PREFIX}${id}`);
  localStorage.removeItem(`${CODE_KEY_PREFIX}${id}`);
};

export const getMessages = (projectId: string): StoredMessage[] => {
  const messagesJson = localStorage.getItem(`${MESSAGES_KEY_PREFIX}${projectId}`);
  return messagesJson ? JSON.parse(messagesJson) : [];
};

export const setMessages = (projectId: string, messages: StoredMessage[]): void => {
  localStorage.setItem(`${MESSAGES_KEY_PREFIX}${projectId}`, JSON.stringify(messages));
};

export const getCode = (projectId: string): string => {
  return localStorage.getItem(`${CODE_KEY_PREFIX}${projectId}`) || "";
};

export const setCode = (projectId: string, code: string): void => {
  localStorage.setItem(`${CODE_KEY_PREFIX}${projectId}`, code);
};

export const getCredits = (projectId: string): number => {
  const project = getProjectById(projectId);
  return project ? project.credits : 0;
};