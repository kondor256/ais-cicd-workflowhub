from rest_framework.pagination import PageNumberPagination


class WorkflowItemPagination(PageNumberPagination):
    """20 items per page: ?page=N returns {count, next, previous, results}."""

    page_size = 20
