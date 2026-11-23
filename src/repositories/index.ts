import { UserRepository } from './user.repository.js';
import { WorkspaceRepository } from './workspace.repository.js';
import { ProjectRepository } from './project.repository.js';

export const userRepository = new UserRepository();
export const workspaceRepository = new WorkspaceRepository();
export const projectRepository = new ProjectRepository();