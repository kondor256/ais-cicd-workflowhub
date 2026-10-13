from rest_framework.routers import DefaultRouter

from .views import WorkflowItemViewSet

router = DefaultRouter()
router.register('items', WorkflowItemViewSet, basename='workflow-item')

urlpatterns = router.urls
