from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import WorkflowItem

User = get_user_model()


class WorkflowItemTests(APITestCase):
    url = '/api/workflows/items/'

    def setUp(self):
        self.alice = User.objects.create_user('alice', 'alice@example.com', 'Tr1cky-horse-staple')
        self.bob = User.objects.create_user('bob', 'bob@example.com', 'Tr1cky-horse-staple')
        self.client.force_authenticate(self.alice)

    def test_create_returns_201_with_pending_status(self):
        response = self.client.post(self.url, {'title': 'Write report'})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['title'], 'Write report')
        self.assertEqual(response.json()['status'], 'pending')
        self.assertEqual(WorkflowItem.objects.get().owner, self.alice)

    def test_status_cannot_be_set_on_create(self):
        response = self.client.post(self.url, {'title': 'Sneaky', 'status': 'completed'})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['status'], 'pending')

    def test_new_item_appears_first_in_list(self):
        self.client.post(self.url, {'title': 'First'})
        self.client.post(self.url, {'title': 'Second'})
        titles = [item['title'] for item in self.client.get(self.url).json()]
        self.assertEqual(titles, ['Second', 'First'])

    def test_empty_title_rejected(self):
        response = self.client.post(self.url, {'title': ''})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {'title': ['Title is required']})
        self.assertFalse(WorkflowItem.objects.exists())

    def test_missing_title_rejected(self):
        response = self.client.post(self.url, {'description': 'No title'})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {'title': ['Title is required']})
        self.assertFalse(WorkflowItem.objects.exists())

    def test_list_contains_only_own_items(self):
        mine = WorkflowItem.objects.create(title='Mine', owner=self.alice)
        WorkflowItem.objects.create(title='Theirs', owner=self.bob)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item['id'] for item in response.json()], [mine.id])

    def test_other_users_item_is_404(self):
        item = WorkflowItem.objects.create(title='Alice only', owner=self.alice)
        self.client.force_authenticate(self.bob)
        self.assertEqual(self.client.get(f'{self.url}{item.id}/').status_code, 404)

    def test_own_item_can_be_retrieved(self):
        item = WorkflowItem.objects.create(title='Mine', owner=self.alice)
        response = self.client.get(f'{self.url}{item.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['id'], item.id)

    def test_unauthenticated_requests_are_unauthorised(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(self.url).status_code, 401)
        self.assertEqual(self.client.post(self.url, {'title': 'x'}).status_code, 401)
        self.assertFalse(WorkflowItem.objects.exists())


class WorkflowItemStatusUpdateTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user('alice', 'alice@example.com', 'Tr1cky-horse-staple')
        self.bob = User.objects.create_user('bob', 'bob@example.com', 'Tr1cky-horse-staple')
        self.item = WorkflowItem.objects.create(title='Write report', owner=self.alice)
        self.url = f'/api/workflows/items/{self.item.id}/'
        self.client.force_authenticate(self.alice)

    def test_patch_status_returns_200_and_persists(self):
        response = self.client.patch(self.url, {'status': 'in_progress'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'in_progress')
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, 'in_progress')

    def test_invalid_status_rejected_and_unchanged(self):
        response = self.client.patch(self.url, {'status': 'done!'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('status', response.json())
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, 'pending')

    def test_other_users_item_is_404_and_unchanged(self):
        self.client.force_authenticate(self.bob)
        response = self.client.patch(self.url, {'status': 'completed'})
        self.assertEqual(response.status_code, 404)
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, 'pending')

    def test_unauthenticated_patch_is_401(self):
        self.client.force_authenticate(None)
        response = self.client.patch(self.url, {'status': 'completed'})
        self.assertEqual(response.status_code, 401)
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, 'pending')

    def test_updated_at_changes(self):
        before = self.item.updated_at
        self.client.patch(self.url, {'status': 'completed'})
        self.item.refresh_from_db()
        self.assertGreater(self.item.updated_at, before)


class WorkflowItemEditTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user('alice', 'alice@example.com', 'Tr1cky-horse-staple')
        self.bob = User.objects.create_user('bob', 'bob@example.com', 'Tr1cky-horse-staple')
        self.item = WorkflowItem.objects.create(
            title='Write report', description='Draft', owner=self.alice)
        self.url = f'/api/workflows/items/{self.item.id}/'
        self.client.force_authenticate(self.alice)

    def test_patch_title_and_description_returns_200_and_updated_at_increases(self):
        before = self.item.updated_at
        response = self.client.patch(
            self.url, {'title': 'Write final report', 'description': 'Polished'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['title'], 'Write final report')
        self.assertEqual(response.json()['description'], 'Polished')
        self.item.refresh_from_db()
        self.assertEqual(self.item.title, 'Write final report')
        self.assertEqual(self.item.description, 'Polished')
        self.assertGreater(self.item.updated_at, before)

    def test_empty_title_rejected_and_nothing_changes(self):
        response = self.client.patch(self.url, {'title': '', 'description': 'Changed'})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {'title': ['Title is required']})
        self.item.refresh_from_db()
        self.assertEqual(self.item.title, 'Write report')
        self.assertEqual(self.item.description, 'Draft')

    def test_other_users_item_is_404_and_unchanged(self):
        self.client.force_authenticate(self.bob)
        response = self.client.patch(self.url, {'title': 'Hijacked'})
        self.assertEqual(response.status_code, 404)
        self.item.refresh_from_db()
        self.assertEqual(self.item.title, 'Write report')


class WorkflowItemDeleteTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user('alice', 'alice@example.com', 'Tr1cky-horse-staple')
        self.bob = User.objects.create_user('bob', 'bob@example.com', 'Tr1cky-horse-staple')
        self.item = WorkflowItem.objects.create(title='Write report', owner=self.alice)
        self.url = f'/api/workflows/items/{self.item.id}/'
        self.client.force_authenticate(self.alice)

    def test_delete_own_item_returns_204_and_then_404(self):
        self.assertEqual(self.client.delete(self.url).status_code, 204)
        self.assertFalse(WorkflowItem.objects.filter(id=self.item.id).exists())
        self.assertEqual(self.client.get(self.url).status_code, 404)

    def test_other_users_item_is_404_and_still_exists(self):
        self.client.force_authenticate(self.bob)
        self.assertEqual(self.client.delete(self.url).status_code, 404)
        self.assertTrue(WorkflowItem.objects.filter(id=self.item.id).exists())

    def test_unauthenticated_delete_is_401_and_item_still_exists(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.delete(self.url).status_code, 401)
        self.assertTrue(WorkflowItem.objects.filter(id=self.item.id).exists())
