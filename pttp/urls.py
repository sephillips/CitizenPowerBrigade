from django.conf.urls import include, url
from django.contrib import admin

urlpatterns = [
    url(r'^pttp/', include('powermap.urls')),
    url(r'^admin/', include(admin.site.urls)),
]
