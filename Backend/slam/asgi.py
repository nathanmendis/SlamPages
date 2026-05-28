import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'slam.settings')

django_asgi_app = get_asgi_application()

# ProtocolTypeRouter routes protocols to different ASGI applications
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    # Websockets and other protocol routers can be added here
})
