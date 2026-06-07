const { Router } = require('express');
const storyController = require('../controllers/storyController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = Router();

router.use(authMiddleware);

router.get('/', storyController.getStories);
router.get('/:id', storyController.getStoryById);
router.post('/', roleMiddleware('admin', 'scrum_master'), storyController.createStory);
router.put('/:id', roleMiddleware('admin', 'scrum_master'), storyController.updateStory);
router.delete('/:id', roleMiddleware('admin', 'scrum_master'), storyController.deleteStory);

module.exports = router;
