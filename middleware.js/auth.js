import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  let token = req.cookies.access_token;
//   console.log(token)
  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    let decoded = jwt.verify(token, "SECRET_KEYS");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware;