export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  screenshot?: string;
}

const PROJECTS_KEY = "dyad-projects";
const MESSAGES_KEY_PREFIX = "dyad-messages-";

export const getProjects = (): Project[] => {
  try {
    const projects = localStorage.getItem(PROJECTS_KEY);
    return projects ? JSON.parse(projects) : [];
  } catch (error) {
    console.error("Failed to parse projects from localStorage", error);
    return [];
  }
};

export const setProjects = (projects: Project[]): void => {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error("Failed to save projects to localStorage", error);
  }
};

export const getMessages = (projectId: string): StoredMessage[] => {
  try {
    const messages = localStorage.getItem(`${MESSAGES_KEY_PREFIX}${projectId}`);
    return messages ? JSON.parse(messages) : [];
  } catch (error) {
    console.error(`Failed to parse messages for project ${projectId}`, error);
    return [];
  }
};

export const setMessages = (projectId: string, messages: StoredMessage[]): void => {
  try {
    localStorage.setItem(`${MESSAGES_KEY_PREFIX}${projectId}`, JSON.stringify(messages));
  } catch (error) {
    console.error(`Failed to save messages for project ${projectId}`, error);
  }
};

export const createProjectFromPrompt = async (prompt: string): Promise<string | null> => {
  const projectName = prompt.trim().slice(0, 50) || "Nuevo Proyecto";
  // This assumes an Electron function exists to handle directory selection and project creation.
  const newProjectData = await window.electron.createProject(projectName);

  if (!newProjectData) {
    return null; // User cancelled or an error occurred
  }

  const projects = getProjects();
  const newProject: Project = {
    id: newProjectData.id,
    name: newProjectData.name,
    path: newProjectData.path,
  };

  setProjects([...projects, newProject]);

  const initialMessage: StoredMessage = {
    role: 'user',
    content: prompt,
    createdAt: new Date().toISOString(),
  };
  
  setMessages(newProject.id, [initialMessage]);
  
  return newProject.id;
};

export const addMessage = (projectId: string, message: { role: 'user' | 'assistant', content: string }): void => {
  const messages = getMessages(projectId);
  const newMessage: StoredMessage = {
    ...message,
    createdAt: new Date().toISOString(),
  };
  setMessages(projectId, [...messages, newMessage]);
};