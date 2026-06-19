export function mongoSanitize(req, res, next) {
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (typeof key === 'string' && (key.startsWith('$') || key.includes('.'))) {
          console.warn(`[SECURITY] NoSQL injection attempt on key: ${key} from ${req.ip}`);
          delete obj[key];
        } else if (obj[key] && typeof obj[key] === 'object') {
          sanitize(obj[key]);
          if (Object.keys(obj[key]).length === 0) {
            delete obj[key];
          }
        }
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
}

