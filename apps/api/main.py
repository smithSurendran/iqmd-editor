from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from routers import auth, patients, templates, documents
from export import export as export_router

app = FastAPI(
    title="IQMD Physician Editor API",
    version="1.0.0",
    description="Backend API for the IQMD Physician Documentation Editor"
)

# cors - allowed Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Routers
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(templates.router)  
app.include_router(documents.router)
app.include_router(export_router.router)

@app.get("/health", response_model=dict)
def health_check():
    return {"status": "ok"}
