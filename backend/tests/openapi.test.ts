import SwaggerParser from '@apidevtools/swagger-parser';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildOpenApiSpec } from '../src/docs/openapi';
import { resources } from '../src/routes/admin/resources';
import { app, login } from './helpers';

const SELF = 'http://localhost:5000';

describe('OpenAPI documentation', () => {
  it('is a valid OpenAPI 3.1 document', async () => {
    const spec = buildOpenApiSpec();
    expect(spec.openapi).toBe('3.1.0');
    // Throws with a description of the first problem if the document is invalid.
    await SwaggerParser.validate(structuredClone(spec) as never);
  });

  it('documents every admin resource and the key public, form and auth routes', () => {
    const paths = Object.keys(buildOpenApiSpec().paths);
    for (const [segment] of resources) {
      expect(paths, segment).toContain(`/admin/${segment}`);
      expect(paths, segment).toContain(`/admin/${segment}/{id}`);
    }
    for (const p of ['/health', '/home', '/articles/{slug}', '/search', '/contact', '/subscribers', '/cpd/sessions/{id}/register', '/auth/login', '/admin/media', '/admin/menus/{key}', '/admin/users/{id}/password']) {
      expect(paths).toContain(p);
    }
  });

  it('builds request bodies from the validation schemas', () => {
    const spec = buildOpenApiSpec() as unknown as { components: { schemas: Record<string, { required?: string[]; properties?: Record<string, unknown> }> } };
    expect(spec.components.schemas.ArticlesInput.required).toContain('title');
    expect(spec.components.schemas.ContactInput.properties).toHaveProperty('consent');
    expect(spec.components.schemas.LoginInput.required).toEqual(expect.arrayContaining(['email', 'password']));
  });

  it('serves the spec and Swagger UI', async () => {
    const json = await request(app).get('/api/openapi.json');
    expect(json.status).toBe(200);
    expect(json.body.info.title).toBe('CARISCA Website API');
    const ui = await request(app).get('/api/docs/');
    expect(ui.status).toBe(200);
    expect(ui.text).toContain('swagger-ui');
    expect(ui.headers['content-security-policy']).toContain("script-src 'self'");
  });

  it('accepts same-origin requests from the docs page but still requires the CSRF token', async () => {
    const { agent, csrf } = await login('editor');
    const noToken = await agent.post('/api/v1/admin/categories').set('Origin', SELF).send({ name: 'Docs origin test' });
    expect(noToken.status).toBe(403);
    const withToken = await agent.post('/api/v1/admin/categories').set('Origin', SELF).set('X-CSRF-Token', csrf).send({ name: 'Docs origin test' });
    expect(withToken.status).toBe(201);
  });
});
