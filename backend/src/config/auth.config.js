module.exports = {
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: '24h',
  bcryptRounds: 10,
};
