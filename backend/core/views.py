
import os

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def health(request):
    return Response({
        'status': 'ok',
        'git_sha': os.environ.get('GIT_SHA', 'unknown'),
    })
