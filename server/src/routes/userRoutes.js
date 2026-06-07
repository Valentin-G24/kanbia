const { Router } = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = Router();

router.use(authMiddleware);

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.patch('/:id/role', roleMiddleware('admin'), userController.updateUserRole);
router.delete('/:id', roleMiddleware('admin'), userController.deactivateUser);

module.exports = router;
