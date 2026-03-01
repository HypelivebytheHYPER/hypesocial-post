import { describe, it, expect, beforeAll } from 'vitest';
import type { SocialPost, CreateSocialPostDto } from '@/types/post-for-me';

// Integration tests - require dev server running
const API_BASE = process.env.TEST_API_URL || 'http://localhost:3000/api';

describe('Posts API - Happy Path Integration', () => {
  let createdPostId: string;

  describe('POST /posts', () => {
    it('should create a new draft post', async () => {
      const payload: CreateSocialPostDto = {
        caption: 'Integration test post',
        isDraft: true,
        socialAccountIds: [],
        media: [],
        scheduledAt: null,
        platformConfigurations: {},
        tags: [],
      };

      const response = await fetch(`${API_BASE}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);

      const data: SocialPost = await response.json();
      expect(data.id).toBeDefined();
      expect(data.caption).toBe(payload.caption);
      expect(data.status).toBe('draft');

      createdPostId = data.id;
    });
  });

  describe('GET /posts', () => {
    it('should return list of posts', async () => {
      const response = await fetch(`${API_BASE}/posts`);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.items)).toBe(true);
      expect(typeof data.total).toBe('number');
    });
  });

  describe('GET /posts/:id', () => {
    it('should return single post', async () => {
      const response = await fetch(`${API_BASE}/posts/${createdPostId}`);

      expect(response.ok).toBe(true);

      const data: SocialPost = await response.json();
      expect(data.id).toBe(createdPostId);
      expect(data.caption).toBe('Integration test post');
    });
  });

  describe('DELETE /posts/:id', () => {
    it('should delete the post', async () => {
      const response = await fetch(`${API_BASE}/posts/${createdPostId}`, {
        method: 'DELETE',
      });

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
    });
  });
});

describe('Accounts API - Happy Path', () => {
  it('should return list of accounts', async () => {
    const response = await fetch(`${API_BASE}/accounts`);

    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(Array.isArray(data.items)).toBe(true);
  });
});
