from rest_framework import mixins, viewsets

from .models import WorkflowItem
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

    def get_queryset(self):
        return WorkflowItem.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        # New items always start as pending, even if a status is sent.
        serializer.save(owner=self.request.user, status=WorkflowItem.Status.PENDING)
