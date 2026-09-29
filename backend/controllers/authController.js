exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    const demoEmail = process.env.DEMO_ADMIN_EMAIL;
    const demoPassword = process.env.DEMO_ADMIN_PASSWORD;
    const demoToken = process.env.DEMO_AUTH_TOKEN;

    if (email === demoEmail && password === demoPassword) {
      return res.json({
        token: demoToken,
        user: { name: 'Admin', email },
      });
    }
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid email or password',
    });
  } catch (err) {
    next(err);
  }
};
