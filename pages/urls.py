from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard_view, name='dashboard'),
    path('files/', views.files_view, name='files'),
    path('profile/', views.profile_view, name='profile'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    path('files/delete/<int:file_id>/', views.delete_file_view, name='delete_file'),
    path('files/delete-all/', views.delete_all_files_view, name='delete_all_files'),
    path('files/star/<int:file_id>/', views.star_file_view, name='star_file'),
    path('files/<int:file_id>/download/', views.file_download_view, name='file_download'),

]
