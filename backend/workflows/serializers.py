from rest_framework import serializers

from .models import WorkflowItem


class WorkflowItemSerializer(serializers.ModelSerializer):
    title = serializers.CharField(
        max_length=200,
        error_messages={
            'required': 'Title is required',
            'blank': 'Title is required',
            'null': 'Title is required',
        },
    )

    class Meta:
        model = WorkflowItem
        fields = ['id', 'title', 'description', 'status', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
