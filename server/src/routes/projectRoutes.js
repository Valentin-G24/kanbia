const { Router } = require('express');
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = Router();

router.use(authMiddleware);

router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);
router.post('/', roleMiddleware('admin'), projectController.createProject);
router.put('/:id', roleMiddleware('admin'), projectController.updateProject);
router.delete('/:id', roleMiddleware('admin'), projectController.deleteProject);
router.post('/:id/members', roleMiddleware('admin'), projectController.addMember);
router.delete('/:id/members/:userId', roleMiddleware('admin'), projectController.removeMember);

module.exports = router;
