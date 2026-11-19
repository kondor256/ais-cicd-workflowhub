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
        titles = [item['title'] for item in self.client.get(self.url).json()['results']]
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
        self.assertEqual([item['id'] for item in response.json()['results']], [mine.id])
        self.assertEqual(response.json()['count'], 1)

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


class WorkflowItemStatusFilterTests(APITestCase):
    url = '/api/workflows/items/'

    def setUp(self):
        self.alice = User.objects.create_user(
            'alice', 'alice@example.com', 'Tr1cky-horse-staple'
        )
        self.bob = User.objects.create_user(
            'bob', 'bob@example.com', 'Tr1cky-horse-staple'
        )

        self.pending = WorkflowItem.objects.create(
            title='Pending task',
            owner=self.alice,
            status=WorkflowItem.Status.PENDING,
        )
        self.in_progress = WorkflowItem.objects.create(
            title='In progress task',
            owner=self.alice,
            status=WorkflowItem.Status.IN_PROGRESS,
        )
        self.completed = WorkflowItem.objects.create(
            title='Completed task',
            owner=self.alice,
            status=WorkflowItem.Status.COMPLETED,
        )
        self.bob_item = WorkflowItem.objects.create(
            title='Bob private task',
            owner=self.bob,
            status=WorkflowItem.Status.IN_PROGRESS,
        )

        self.client.force_authenticate(self.alice)

    def get_item_ids(self, response):
        self.assertEqual(response.status_code, 200)
        body = response.json()

        # Supports both the existing API and WFH-21 pagination.
        results = body['results'] if isinstance(body, dict) else body

        return {item['id'] for item in results}

    def test_filter_in_progress_returns_only_matching_items(self):
        response = self.client.get(
            self.url, {'status': 'in_progress'}
        )
        self.assertEqual(
            self.get_item_ids(response),
            {self.in_progress.id},
        )

    def test_filter_pending_and_completed(self):
        cases = [
            ('pending', self.pending.id),
            ('completed', self.completed.id),
        ]

        for status, expected_id in cases:
            with self.subTest(status=status):
                response = self.client.get(
                    self.url, {'status': status}
                )
                self.assertEqual(
                    self.get_item_ids(response),
                    {expected_id},
                )

    def test_all_returns_all_own_items(self):
        response = self.client.get(self.url, {'status': 'all'})
        self.assertEqual(
            self.get_item_ids(response),
            {
                self.pending.id,
                self.in_progress.id,
                self.completed.id,
            },
        )

    def test_no_status_returns_all_own_items(self):
        response = self.client.get(self.url)
        self.assertEqual(
            self.get_item_ids(response),
            {
                self.pending.id,
                self.in_progress.id,
                self.completed.id,
            },
        )

    def test_invalid_status_returns_400(self):
        for status in ['invalid', 'done', '']:
            with self.subTest(status=status):
                response = self.client.get(
                    self.url, {'status': status}
                )
                self.assertEqual(response.status_code, 400)
                self.assertIn('status', response.json())

    def test_filter_never_exposes_another_users_items(self):
        response = self.client.get(
            self.url, {'status': 'in_progress'}
        )
        self.assertNotIn(
            self.bob_item.id,
            self.get_item_ids(response),
        )

        self.client.force_authenticate(self.bob)
        response = self.client.get(
            self.url, {'status': 'in_progress'}
        )
        self.assertEqual(
            self.get_item_ids(response),
            {self.bob_item.id},
        )

    def test_status_filter_does_not_block_item_detail(self):
        response = self.client.get(
            f'{self.url}{self.pending.id}/',
            {'status': 'invalid'},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['id'], self.pending.id)


class WorkflowItemPaginationTests(APITestCase):
    url = '/api/workflows/items/'

    def setUp(self):
        self.alice = User.objects.create_user('alice', 'alice@example.com', 'Tr1cky-horse-staple')
        self.bob = User.objects.create_user('bob', 'bob@example.com', 'Tr1cky-horse-staple')
        WorkflowItem.objects.bulk_create(
            WorkflowItem(title=f'Item {n}', owner=self.alice) for n in range(1, 26))
        self.client.force_authenticate(self.alice)

    def test_first_page_has_20_items_count_and_next(self):
        body = self.client.get(self.url).json()
        self.assertEqual(body['count'], 25)
        self.assertEqual(len(body['results']), 20)
        self.assertIn('page=2', body['next'])
        self.assertIsNone(body['previous'])

    def test_second_page_has_the_rest_and_no_next(self):
        response = self.client.get(self.url, {'page': 2})
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(len(body['results']), 5)
        self.assertIsNone(body['next'])
        self.assertIsNotNone(body['previous'])

    def test_pages_do_not_overlap_when_timestamps_are_equal(self):
        # All items get the same created_at, so only the -id tie-breaker keeps the order stable.
        WorkflowItem.objects.update(created_at=WorkflowItem.objects.first().created_at)
        first = self.client.get(self.url).json()['results']
        second = self.client.get(self.url, {'page': 2}).json()['results']
        ids = [item['id'] for item in first + second]
        self.assertEqual(len(set(ids)), 25)
        self.assertEqual(ids, sorted(ids, reverse=True))

    def test_page_out_of_range_is_404(self):
        self.assertEqual(self.client.get(self.url, {'page': 3}).status_code, 404)

    def test_invalid_page_is_404(self):
        self.assertEqual(self.client.get(self.url, {'page': 'abc'}).status_code, 404)

    def test_count_includes_only_own_items(self):
        WorkflowItem.objects.create(title='Theirs', owner=self.bob)
        self.client.force_authenticate(self.bob)
        body = self.client.get(self.url).json()
        self.assertEqual(body['count'], 1)
        self.assertEqual([item['title'] for item in body['results']], ['Theirs'])



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
