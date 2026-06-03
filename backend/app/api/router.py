from fastapi import APIRouter

from app.routers import admin_auth, admin_categories, admin_requests, admin_resources
from app.routers import public_categories, public_requests, public_resources

api_router = APIRouter(prefix="/api")
api_router.include_router(public_categories.router, tags=["public-categories"])
api_router.include_router(public_resources.router, tags=["public-resources"])
api_router.include_router(public_requests.router, tags=["public-requests"])
api_router.include_router(admin_auth.router, prefix="/admin/auth", tags=["admin-auth"])
api_router.include_router(admin_categories.router, prefix="/admin/categories", tags=["admin-categories"])
api_router.include_router(admin_resources.router, prefix="/admin/resources", tags=["admin-resources"])
api_router.include_router(admin_requests.router, prefix="/admin/requests", tags=["admin-requests"])
