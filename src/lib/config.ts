export const DEFAULT_PHP_API_BASE_URL: string =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_PHP_API_BASE_URL) || 'http://localhost';
