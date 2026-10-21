"""Same-origin game API. Set DATABASE_URL to PostgreSQL in production."""
import os
from contextlib import asynccontextmanager
from pathlib import Path
from time import time
from uuid import uuid4
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import create_engine, String, Float, Integer, select, update
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, Session

class Base(DeclarativeBase):
    pass

class Run(Base):
    __tablename__ = "runs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    started: Mapped[float] = mapped_column(Float)
    nickname: Mapped[str | None] = mapped_column(String(20), nullable=True)
    score: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    duration: Mapped[float | None] = mapped_column(Float, nullable=True)

class ScoreSubmission(BaseModel):
    model_config = ConfigDict(extra="forbid")
    nickname: str = Field(min_length=1, max_length=20, pattern=r"^[A-Za-z0-9 _-]+$")
    score: int = Field(ge=0, le=100000, strict=True)
    duration: float = Field(ge=0, le=86400, allow_inf_nan=False)


def create_app(database_url: str | None = None):
    url = database_url or os.getenv("DATABASE_URL", "sqlite:///./crusader.db")
    engine = create_engine(url, connect_args={"check_same_thread": False} if url.startswith("sqlite") else {}, pool_pre_ping=True)

    @asynccontextmanager
    async def lifespan(app):
        Base.metadata.create_all(engine)
        yield
        engine.dispose()

    app = FastAPI(title="Exploration Crusader API", lifespan=lifespan)

    @app.get("/api/health")
    def health():
        with Session(engine) as db:
            db.execute(select(1))
        return {"status": "ok"}

    @app.post("/api/runs", status_code=201)
    def start_run():
        run = Run(id=str(uuid4()), started=time())
        with Session(engine) as db:
            db.add(run)
            db.commit()
            return {"id": run.id}

    @app.post("/api/runs/{run_id}/score")
    def save_score(run_id: str, payload: ScoreSubmission):
        name = payload.nickname.strip()
        if not name:
            raise HTTPException(422, "Enter a pilot name.")
        with Session(engine) as db:
            run = db.get(Run, run_id)
            if run is None:
                raise HTTPException(404, "Expedition not found.")
            if run.score is not None:
                raise HTTPException(409, "This expedition has already been submitted.")
            age = time() - run.started
            if age > 86400:
                raise HTTPException(410, "Expedition expired. Start a new flight.")
            if payload.duration > age + 2 or payload.score > int(payload.duration / .9) + 1:
                raise HTTPException(422, "Score does not match the expedition duration.")
            result = db.execute(update(Run).where(Run.id == run_id, Run.score.is_(None)).values(nickname=name, score=payload.score, duration=payload.duration))
            if result.rowcount != 1:
                raise HTTPException(409, "This expedition has already been submitted.")
            db.commit()
        return {"saved": True}

    @app.get("/api/leaderboard")
    def leaderboard():
        with Session(engine) as db:
            rows = db.scalars(select(Run).where(Run.score.is_not(None)).order_by(Run.score.desc(), Run.duration.asc(), Run.started.asc()).limit(20)).all()
            return [{"nickname": r.nickname, "score": r.score, "duration": r.duration} for r in rows]

    dist = Path(__file__).resolve().parents[1] / "frontend" / "dist"
    if dist.is_dir():
        app.mount("/", StaticFiles(directory=dist, html=True), name="game")
    return app

app = create_app()
