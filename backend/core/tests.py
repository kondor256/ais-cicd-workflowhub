import os
import subprocess
import sys

from django.conf import settings
from django.test import SimpleTestCase, override_settings
from rest_framework.test import APITestCase


class HealthCheckTests(APITestCase):
    def test_health_returns_ok(self):
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'status': 'ok'})

    def test_health_rejects_post(self):
        response = self.client.post('/api/health/')
        self.assertEqual(response.status_code, 405)


class CorsTests(APITestCase):
    """The browser may call the API from the frontend origin (WFH-15)."""

    FRONTEND = 'http://localhost:8080'

    @override_settings(CORS_ALLOWED_ORIGINS=[FRONTEND])
    def test_allowed_origin_gets_cors_header(self):
        response = self.client.get('/api/health/', headers={'Origin': self.FRONTEND})
        self.assertEqual(response.headers.get('Access-Control-Allow-Origin'), self.FRONTEND)

    @override_settings(CORS_ALLOWED_ORIGINS=[FRONTEND])
    def test_other_origin_gets_no_cors_header(self):
        response = self.client.get('/api/health/', headers={'Origin': 'http://evil.example'})
        self.assertNotIn('Access-Control-Allow-Origin', response.headers)


class RequiredSettingsTests(SimpleTestCase):
    """The backend must refuse to start when a required variable is missing."""

    def run_check(self, **overrides):
        env = {k: v for k, v in os.environ.items()
               if k not in ('DJANGO_SECRET_KEY', 'DATABASE_URL')}
        env['ENV_FILE'] = os.devnull  # ignore any local backend/.env
        env.update(overrides)
        return subprocess.run(
            [sys.executable, 'manage.py', 'check'],
            cwd=settings.BASE_DIR, env=env, capture_output=True, text=True,
        )

    def test_missing_secret_key_fails_with_clear_error(self):
        result = self.run_check(DATABASE_URL='sqlite:///:memory:')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('DJANGO_SECRET_KEY', result.stderr)

    def test_missing_database_url_fails_with_clear_error(self):
        result = self.run_check(DJANGO_SECRET_KEY='test-key')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('DATABASE_URL', result.stderr)
