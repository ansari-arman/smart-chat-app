import express from 'express';
import {changePasswordController, forgetController, login, logout, register , verifyEmail, verifyEmailController} from '../controllers/authController.js';
import authMiddleware from '../middleware.js/auth.js';

const router = express.Router();

router.post('/login',login);
router.post('/register',register);
router.get('/verify',verifyEmail);
router.get('/verify-email',verifyEmailController)
router.post('/change-password',changePasswordController)
router.get("/logout", logout);
router.post("/forget-password",forgetController)
router.get("/me", authMiddleware, (req, res) => {
  res.json({
    user: req.user
  });
});


export default router;