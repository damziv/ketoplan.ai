// lib/session.js
import { getIronSession } from 'iron-session';

const sessionOptions = {
  password: process.env.IRON_SESSION_PASSWORD,
  cookieName: process.env.COOKIE_NAME || 'km_admin_session',
  cookieOptions: {
    // Must be false in local HTTP dev; true in production (HTTPS)
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    httpOnly: true,
    path: '/',
  },
};

// Wrap API routes (req,res)
export const withApiSession = (handler) => {
  return async (req, res) => {
    const session = await getIronSession(req, res, sessionOptions);
    req.session = session;
    return handler(req, res);
  };
};

// Wrap getServerSideProps
export const withPageSession = (gssp) => {
  return async (ctx) => {
    const { req, res } = ctx;
    const session = await getIronSession(req, res, sessionOptions);
    req.session = session;
    return gssp(ctx);
  };
};
