// Deep-sanitize request objects to prevent MongoDB operator injection attacks.
// Removes keys that start with '$' or contain '.', and rejects string values
// that look like raw MongoDB operators being smuggled inside strings.

const DANGEROUS_OPERATORS = /(\$where|\$regex|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$or|\$and|\$nor|\$not|\$exists|\$elemMatch|\$expr|\$jsonSchema)/i

function sanitizeValue(value, key, obj) {
  if (typeof value === 'string') {
    // Reject string values that look like JavaScript code or embedded operator objects
    if (DANGEROUS_OPERATORS.test(value) && value.trim().startsWith('{')) {
      console.warn(`[SECURITY] Suspicious string value for key "${key}": ${value.slice(0, 80)}`)
      obj[key] = ''
    }
    // Block common $where / function injection patterns
    if (/function\s*\(|=>|return\s+this\./i.test(value)) {
      console.warn(`[SECURITY] JS function injection attempt in key "${key}"`)
      obj[key] = ''
    }
  }
}

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
            } else {
              sanitizeValue(obj[key], key, obj)
            }
          }
        }
      }
    }
  };

  if (req.body)   sanitize(req.body);
  if (req.query)  sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
}
