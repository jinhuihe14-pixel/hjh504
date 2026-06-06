from fastapi import APIRouter
from pydantic import BaseModel
import uuid


router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponseData(BaseModel):
    token: str
    username: str
    role: str


class LoginResponse(BaseModel):
    success: bool
    message: str
    data: LoginResponseData | None = None


USERS = {
    "admin": {
        "password": "123456",
        "role": "系统管理员",
    }
}


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    user = USERS.get(request.username)

    if not user or user["password"] != request.password:
        return LoginResponse(
            success=False,
            message="用户名或密码错误",
            data=None,
        )

    token = str(uuid.uuid4()).replace("-", "")

    return LoginResponse(
        success=True,
        message="登录成功",
        data=LoginResponseData(
            token=token,
            username=request.username,
            role=user["role"],
        )
    )
