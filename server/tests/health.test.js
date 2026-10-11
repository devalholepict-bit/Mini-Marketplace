const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it('should return HTTP 200 with success status, message, and an ISO timestamp', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'MeuLink API is running');
    expect(response.body).toHaveProperty('timestamp');

    // Verify timestamp is a valid ISO 8601 string
    const timestampDate = new Date(response.body.timestamp);
    expect(timestampDate.toISOString()).toBe(response.body.timestamp);
  });

  it('should return 404 for an unknown endpoint', async () => {
    const response = await request(app).get('/api/unknown-endpoint');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.message).toMatch(/Resource not found/);
  });
});
