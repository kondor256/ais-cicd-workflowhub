from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def health(request):
    # version = the commit the image was built from (used by the deploy smoke tests)
    return Response({'status': 'ok', 'version': settings.APP_VERSION})
