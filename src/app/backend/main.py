from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import database
from routers import auth, profile, llm, tokens, user, conversations
from dotenv import load_dotenv
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(profile.router, prefix="/profile", tags=["profile"])
app.include_router(llm.router, prefix="/llm", tags=["llm"] )
app.include_router(tokens.router, prefix="/tokens", tags=["tokens"])
app.include_router(user.router, prefix="/user", tags=["user"])
app.include_router(conversations.router, prefix="/conversation", tags=["conversation"])





@app.get("/")
async def root():
    return {"message": "Welcome to your API"}

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()