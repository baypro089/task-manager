import { UserRepository } from './user.repository.js';
import { WorkspaceRepository } from './workspace.repository.js';
export const userRepository = new UserRepository();
export const workspaceRepository = new WorkspaceRepository();