const jwt = require('jsonwebtoken');

const isAdmin = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/auth/login');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.admin) return next();
  } catch (err) {
    return res.redirect('/authss/login');
  }
};

module.exports = { isAdmin };