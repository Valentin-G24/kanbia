const { Router } = require('express');
const epicController = require('../controllers/epicController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = Router();

router.use(authMiddleware);

router.get('/project/:projectId', epicController.getEpics);
router.get('/:id', epicController.getEpicById);
router.post('/project/:projectId', roleMiddleware('admin', 'scrum_master'), epicController.createEpic);
router.put('/:id', roleMiddleware('admin', 'scrum_master'), epicController.updateEpic);
router.delete('/:id', roleMiddleware('admin', 'scrum_master'), epicController.deleteEpic);

module.exports = router;
