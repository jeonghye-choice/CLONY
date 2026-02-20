"""
구글 OAuth 로그인 엔드포인트
"""
from fastapi import HTTPException
from pydantic import BaseModel
import httpx
import os

class GoogleAuthRequest(BaseModel):
    id_token: str

async def google_oauth_login(request: GoogleAuthRequest):
    """
    구글 OAuth 로그인
    
    프론트엔드에서 받은 ID Token을 구글 API를 통해 검증하고
    사용자 정보를 조회하여 반환합니다.
    """
    try:
        # ID Token 검증 URL
        verify_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={request.id_token}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(verify_url)
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=401,
                    detail="유효하지 않은 구글 토큰입니다."
                )
            
            user_data = response.json()
            
            # 클라이언트 ID 검증 (보안상 권장되나, 여기서는 생략하거나 환경변수로 처리)
            # aud = user_data.get("aud")
            
            email = user_data.get("email")
            nickname = user_data.get("name") or user_data.get("given_name") or "구글 사용자"
            profile_image = user_data.get("picture")
            google_id = user_data.get("sub")
            
            # 응답 반환 (실제로는 DB 저장 및 세션 처리가 필요함)
            return {
                "nickname": nickname,
                "email": email,
                "googleId": google_id,
                "profileImage": profile_image,
                "provider": "google"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Google OAuth Error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"구글 인증 처리 중 오류 발생: {str(e)}"
        )
