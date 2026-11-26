import {Router} from 'express';
import authRoutes from './auth.route.js';
import userRoutes from './user.route.js';
import workspaceRoutes from './workspace.route.js';
import projectRoutes from './project.route.js';
import taskRoutes from './task.route.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/', projectRoutes);
router.use('/', taskRoutes);

export default router;