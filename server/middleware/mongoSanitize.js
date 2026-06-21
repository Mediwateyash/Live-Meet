export function mongoSanitize(req, res, next) {
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          if (obj[i] && typeof obj[i] === 'object') {
            sanitize(obj[i]);
            if (Object.keys(obj[i]).length === 0) {
              obj.splice(i, 1);
              i--; 
            }
          }
        }
      } else {
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
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
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
}

