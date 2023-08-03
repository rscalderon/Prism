import { Router } from 'express';
import userController from '../controllers/userController.js';

// destructure imports into variables
const router = Router();
const { createUser, authUser, setToken } = userController; // destructure imports

router.post('/signup', createUser, setToken, (req, res) => {
  // set cookie
  // res.cookie('user', res.locals.user.username, { maxAge: 3600000 }); // level 1 authentication: regular cookie
  res.json(res.locals.user);
});

router.post('/login', authUser, setToken, (req, res) => {
  res.json(res.locals.user);
});

export default router;
