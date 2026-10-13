from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

User = get_user_model()


class RegisterTests(APITestCase):
    url = '/api/auth/register/'
    password = 'Tr1cky-horse-staple'

    def payload(self, **overrides):
        data = {
            'username': 'alice',
            'email': 'alice@example.com',
            'password': self.password,
            'password2': self.password,
        }
        data.update(overrides)
        return data

    def test_register_succeeds_and_creates_user(self):
        response = self.client.post(self.url, self.payload())
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json(), {'username': 'alice', 'email': 'alice@example.com'})
        self.assertTrue(User.objects.filter(username='alice').exists())

    def test_password_is_stored_hashed(self):
        self.client.post(self.url, self.payload())
        user = User.objects.get(username='alice')
        self.assertNotEqual(user.password, self.password)
        self.assertTrue(user.check_password(self.password))
        self.assertTrue(user.password.startswith('pbkdf2_'))

    def test_password_never_in_response(self):
        response = self.client.post(self.url, self.payload())
        self.assertNotIn('password', response.json())
        self.assertNotIn('password2', response.json())
        self.assertNotIn(self.password, response.content.decode())

    def test_duplicate_username_rejected(self):
        self.client.post(self.url, self.payload())
        response = self.client.post(self.url, self.payload(email='other@example.com'))
        self.assertEqual(response.status_code, 400)
        self.assertIn('username', response.json())
        self.assertEqual(User.objects.filter(username='alice').count(), 1)

    def test_mismatching_passwords_rejected(self):
        response = self.client.post(self.url, self.payload(password2='Different-pass-123'))
        self.assertEqual(response.status_code, 400)
        self.assertIn('password2', response.json())
        self.assertFalse(User.objects.exists())

    def test_weak_passwords_rejected(self):
        weak = {
            'too short': 'Ab1!',
            'common': 'password123',
            'numeric only': '918273645501',
            'similar to username': 'alice123',
        }
        for reason, password in weak.items():
            with self.subTest(reason):
                response = self.client.post(
                    self.url, self.payload(password=password, password2=password))
                self.assertEqual(response.status_code, 400)
                self.assertIn('password', response.json())
        self.assertFalse(User.objects.exists())

    def test_invalid_email_rejected(self):
        response = self.client.post(self.url, self.payload(email='not-an-email'))
        self.assertEqual(response.status_code, 400)
        self.assertIn('email', response.json())
        self.assertFalse(User.objects.exists())

    def test_missing_email_rejected(self):
        data = self.payload()
        del data['email']
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, 400)
        self.assertIn('email', response.json())
        self.assertFalse(User.objects.exists())


class AuthTokenTests(APITestCase):
    password = 'Tr1cky-horse-staple'

    def setUp(self):
        self.user = User.objects.create_user(
            'alice', 'alice@example.com', self.password)

    def login(self, **overrides):
        data = {'username': 'alice', 'password': self.password}
        data.update(overrides)
        return self.client.post('/api/auth/login/', data)

    def test_login_returns_token_that_works_on_me(self):
        response = self.login()
        self.assertEqual(response.status_code, 200)
        token = response.json()['token']
        self.assertTrue(Token.objects.filter(key=token, user=self.user).exists())

        me = self.client.get('/api/auth/me/', HTTP_AUTHORIZATION=f'Token {token}')
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.json(), {'username': 'alice', 'email': 'alice@example.com'})

    def test_login_twice_returns_same_token(self):
        self.assertEqual(self.login().json()['token'], self.login().json()['token'])
        self.assertEqual(Token.objects.count(), 1)

    def test_wrong_password_rejected_without_token(self):
        response = self.login(password='Wrong-pass-123')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {'detail': 'Invalid username or password'})
        self.assertFalse(Token.objects.exists())

    def test_unknown_user_rejected_without_token(self):
        response = self.login(username='nobody')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {'detail': 'Invalid username or password'})
        self.assertFalse(Token.objects.exists())

    def test_logout_deletes_token_and_token_stops_working(self):
        token = self.login().json()['token']
        auth = {'HTTP_AUTHORIZATION': f'Token {token}'}

        response = self.client.post('/api/auth/logout/', **auth)
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Token.objects.filter(key=token).exists())

        self.assertEqual(self.client.get('/api/auth/me/', **auth).status_code, 401)

    def test_me_without_token_is_unauthorised(self):
        self.assertEqual(self.client.get('/api/auth/me/').status_code, 401)

    def test_me_with_garbage_token_is_unauthorised(self):
        response = self.client.get('/api/auth/me/', HTTP_AUTHORIZATION='Token garbage')
        self.assertEqual(response.status_code, 401)

    def test_logout_without_token_is_unauthorised(self):
        self.assertEqual(self.client.post('/api/auth/logout/').status_code, 401)

    def test_health_and_register_stay_public(self):
        self.assertEqual(self.client.get('/api/health/').status_code, 200)
        response = self.client.post('/api/auth/register/', {
            'username': 'bob', 'email': 'bob@example.com',
            'password': self.password, 'password2': self.password,
        })
        self.assertEqual(response.status_code, 201)
