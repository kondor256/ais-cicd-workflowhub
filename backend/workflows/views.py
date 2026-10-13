from rest_framework import mixins, viewsets

from .models import WorkflowItem
from .serializers import WorkflowItemSerializer


class WorkflowItemViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = WorkflowItemSerializer

    def get_queryset(self):
        return WorkflowItem.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
