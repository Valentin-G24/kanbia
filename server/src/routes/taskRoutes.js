const { Router } = require('express');
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = Router();

router.use(authMiddleware);

router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', roleMiddleware('admin', 'scrum_master'), taskController.createTask);
router.put('/:id', roleMiddleware('admin', 'scrum_master', 'developer'), taskController.updateTask);
router.patch('/:id/status', roleMiddleware('admin', 'scrum_master', 'developer'), taskController.updateTaskStatus);
router.delete('/:id', roleMiddleware('admin', 'scrum_master'), taskController.deleteTask);

module.exports = router;
