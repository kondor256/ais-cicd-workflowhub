from rest_framework import mixins, viewsets

from .models import WorkflowItem
from .pagination import WorkflowItemPagination
from .serializers import WorkflowItemSerializer


class WorkflowItemViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = WorkflowItemSerializer
    pagination_class = WorkflowItemPagination

    def get_queryset(self):
        # -id breaks ties between equal timestamps, so pages never overlap or skip items.
        return WorkflowItem.objects.filter(owner=self.request.user).order_by('-created_at', '-id')

    def perform_create(self, serializer):
        # New items always start as pending, even if a status is sent.
        serializer.save(owner=self.request.user, status=WorkflowItem.Status.PENDING)
