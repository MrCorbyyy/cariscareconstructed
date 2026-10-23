import type { AuthContext } from '../services/auth.service';

declare global {
   
  namespace Express {
    interface Request {
      /** Present when the request carries a valid admin session. */
      auth?: AuthContext;
    }
  }
}

export {};
