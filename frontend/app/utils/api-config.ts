/**
 * Central utility function for getting API URL
 * Reads ONLY from runtime environment variable: API_URL
 * http://localhost:8000
 */
export function getApiUrlSync(): string {
  return process.env.API_URL || 'https://ezsaty.livelyflower-7230f07a.westeurope.azurecontainerapps.io';
}

