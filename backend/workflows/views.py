
from rest_framework import mixins, viewsets
from rest_framework.exceptions import ValidationError

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
        # Users can only access their own workflow items.
        queryset = WorkflowItem.objects.filter(
            owner=self.request.user
        ).order_by('-created_at', '-id')

        # Apply status filtering only to the list endpoint.
        if self.action == 'list':
            status = self.request.query_params.get('status')

            # No filter or "all" returns all items owned by the user.
            if status is not None and status != 'all':
                if status not in WorkflowItem.Status.values:
                    raise ValidationError({
                        'status': ['Invalid workflow status.']
                    })

                queryset = queryset.filter(status=status)

        return queryset

    def perform_create(self, serializer):
        # New items always start as pending, even if a status is sent.
        serializer.save(
            owner=self.request.user,
            status=WorkflowItem.Status.PENDING,
        )
