from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .serializers import UserSerializer, ProfileSerializer
from .models import Profile


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)

    def post(self, request):
        profile = request.user.profile
        profile.clicks += 1
        profile.save()
        return Response({'clicks': profile.clicks})


class ClickView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile = request.user.profile
        clicks_to_add = request.data.get('clicks_to_add', 1)
        profile.clicks += clicks_to_add
        profile.save()
        return Response({
            'clicks': profile.clicks,
            'boost_count': profile.boost_count
        })


class BuyBoostView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile = request.user.profile

        # Рассчитываем стоимость (100 * текущий множитель)
        cost = 100 * profile.boost_count

        # Проверяем, достаточно ли кликов
        if profile.clicks >= cost:
            # Списываем стоимость
            profile.clicks -= cost
            # Увеличиваем множитель буста
            profile.boost_count += 1
            profile.save()
            return Response({
                'boost_count': profile.boost_count,
                'clicks': profile.clicks
            })
        else:
            return Response(
                {'error': f'Недостаточно кликов! Нужно {cost} кликов, у вас {profile.clicks}'},
                status=status.HTTP_400_BAD_REQUEST
            )