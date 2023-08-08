// user authentication middleware
import User, { HydratedDocument, IUser } from '../db/models/userSchema'; // import user model
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Controller } from '../../types/types';
// mvp of this stretch feature: basic user auth, lasts while window is open
// stretch feature level 1: sets a JWT in cookie to use for auth purposes
// stretch feature level
interface jwtPayload extends JwtPayload {
  username?: string;
}
const userController: Controller = {};

// create a new user in database with signup field
userController.createUser = async function (req, res, next) {
  // username nand password should come in on response body
  const { username, password } = req.body;
  const existingUser: HydratedDocument<IUser> | undefined = await User.findOne({
    username,
  });

  // console.log('user exists? ', ); // show when user doesn't exist
  if (!existingUser) {
    const user: HydratedDocument<IUser> = await User.create({
      username,
      password,
    });
    res.locals.user = { username: user.username, created: true };
    res.status(201);
  } else {
    res.status(202);
    res.locals.user = { created: false };
  }
  return next();
};

// authenticate user by comparing password with database hash
userController.authUser = async function (req, res, next) {
  // if user is already token authenticated, we can continue
  if (res.locals.user.auth) return next();
  // username nand password should come in on response body
  const { username, password } = req.body;
  const user: HydratedDocument<IUser> = await User.findOne({ username });
  // authenticate passsword with comparison method on user model
  res.locals.user = {
    username: username,
    auth: user && (await user.matchPassword(password)),
  };

  return next();
};

// setToken : create JWT for authenticated users
// use this for authorization
userController.setToken = function (req, res, next) {
  // set JWT only if eitther user has successfully been created (signup) or authenticated (signin)
  if (res.locals.user.auth || res.locals.user.created) {
    res.locals.jwt = jwt.sign(
      { username: res.locals.user.username },
      process.env.JWT_SECRET,
      {
        expiresIn: 3600, // set expiry to 1 hour
      }
    );
    // store token in cookie
    res.cookie('token', res.locals.jwt, {
      maxAge: 3600000, // one hour
      secure: process.env.NODE_ENV !== 'development',
      httpOnly: true,
    });
  }
  return next();
};

// verifyToken: verify  authentication token
userController.verifyToken = (req, res, next) => {
  // if there's no token, the user isn't logged in yet or the cookie has been deleted
  if (!req.cookies.token) {
    res.locals.user = { auth: false, message: 'missing token' };
    return next();
  }

  // verify token

  try {
    const decodedToken: jwtPayload | string = jwt.verify(
      req.cookies.token,
      process.env.JWT_SECRET
    ) as jwtPayload;
    if (decodedToken.username) {
      res.locals.user = { username: decodedToken.username, auth: true };
    } else {
      res.locals.user = { auth: false, message: 'TokenInvalid' };
    }
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      res.locals.user = { auth: false, message: 'TokenExpired' };
    } else {
      return next({
        message: { err: 'An error occured ' },
        log: 'Error occurred in verifying JWT in verifyToken middleware',
        error: err,
      });
    }
  } finally {
    return next();
  }
};

// The deleteUser middleware here is mainly used for testing.
userController.deleteUser = async (req, res, next) => {
  const { username } = req.body;

  // deletion authorization is tied to either the password or the jwt to prevent unauthorized users from using this method.
  const authorized: boolean =
    res.locals.user.auth && res.locals.user.username === username;
  if (!authorized) {
    res.locals.user = {
      username: username,
      deleted: false,
      message: 'insufficient permissions',
    };
    return next();
  }
  const deleted: boolean =
    (await User.deleteOne({ username: username })).deletedCount === 1;

  res.locals.user = { username: username, deleted: deleted };
  return next();
};
export default userController;
