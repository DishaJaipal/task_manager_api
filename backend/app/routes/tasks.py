from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError
from app.database import get_db
from app.models import User, Task, RoleEnum
from app.schemas import TaskCreate, TaskUpdate, TaskOut
from app.config import settings
from app.cache import get_cache, set_cache, delete_cache
from app.logger import logger
from typing import List

router = APIRouter(prefix="/tasks", tags=["Tasks"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# ─── Dependencies ─────────────────────────────────


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
):
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Admins only")
    return current_user


# Routes


@router.get("/", response_model=List[TaskOut])
async def get_tasks(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    cache_key = f"tasks:user:{current_user.id}"
    cached = await get_cache(cache_key)
    if cached:
        logger.info(f"Cache HIT for user {current_user.id}")
        return cached

    result = await db.execute(select(Task).where(Task.owner_id == current_user.id))
    tasks = result.scalars().all()
    serialized = [TaskOut.model_validate(t).model_dump(mode="json") for t in tasks]
    await set_cache(cache_key, serialized, expire=60)
    logger.info(f"Cache MISS — DB fetch for user {current_user.id}")
    return serialized


@router.post("/", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
async def create_task(
    body: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = Task(**body.model_dump(), owner_id=current_user.id)
    db.add(task)
    await db.commit()
    await db.refresh(task)
    await delete_cache(f"tasks:user:{current_user.id}")
    logger.info(f"Task created: '{task.title}' by user {current_user.id}")
    return task


@router.put("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: int,
    body: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.owner_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    await db.commit()
    await db.refresh(task)
    await delete_cache(f"tasks:user:{current_user.id}")
    logger.info(f"Task {task_id} updated by user {current_user.id}")
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.owner_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    await db.delete(task)
    await db.commit()
    await delete_cache(f"tasks:user:{current_user.id}")
    logger.info(f"Task {task_id} deleted by user {current_user.id}")


@router.get("/all", response_model=List[TaskOut])
async def get_all_tasks(
    _: User = Depends(require_admin), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Task))
    return result.scalars().all()
