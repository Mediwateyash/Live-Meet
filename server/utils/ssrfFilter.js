import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

export function isPrivateIp(ip) {
  if (!ip) return true;
  
  // Check for IPv4 loopback, private, link-local, and unspecified
  if (ip === '0.0.0.0' || ip === '::') return true;

  if (ip.includes('.')) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return true; // invalid IP is considered unsafe

    const [p0, p1, p2, p3] = parts;
    if (p0 === 127) return true; // 127.0.0.0/8
    if (p0 === 10) return true;  // 10.0.0.0/8
    if (p0 === 169 && p1 === 254) return true; // 169.254.0.0/16
    if (p0 === 192 && p1 === 168) return true; // 192.168.0.0/16
    if (p0 === 172 && (p1 >= 16 && p1 <= 31)) return true; // 172.16.0.0/12
  } else if (ip.includes(':')) {
    // IPv6
    const normalized = ip.toLowerCase();
    if (normalized === '::1') return true;
    if (normalized.startsWith('fe80:')) return true; // Link-local
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // Unique local
  }
  return false;
}

export async function validateUrlForSsrf(urlStr) {
  let parsed;
  try {
    parsed = new URL(urlStr);
  } catch (err) {
    throw new Error('Invalid URL format');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http and https protocols are allowed');
  }

  const hostname = parsed.hostname;
  if (!hostname) {
    throw new Error('Invalid hostname');
  }

  // Resolve hostname
  let ip;
  try {
    const res = await lookup(hostname);
    ip = res.address;
  } catch (err) {
    throw new Error('Could not resolve hostname');
  }

  if (isPrivateIp(ip)) {
    throw new Error('URL resolves to a restricted/private network address');
  }

  return true;
}
