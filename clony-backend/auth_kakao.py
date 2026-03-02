"""
카카오 OAuth 로그인 엔드포인트
"""
from fastapi import HTTPException
from pydantic import BaseModel
import httpx
import os

class KakaoAuthRequest(BaseModel):
    code: str
    redirect_uri: str

async def kakao_oauth_login(request: KakaoAuthRequest):
    """
    카카오 OAuth 로그인
    
    프론트엔드에서 받은 authorization code를 카카오 토큰으로 교환하고
    사용자 정보를 조회하여 반환합니다.
    """
    try:
        # 1. 카카오에서 REST API 키 가져오기
        # TODO: 환경변수나 설정 파일에서 가져오도록 변경
        KAKAO_REST_API_KEY = os.getenv("KAKAO_REST_API_KEY", "YOUR_REST_API_KEY_HERE")
        
        if KAKAO_REST_API_KEY == "YOUR_REST_API_KEY_HERE":
            raise HTTPException(
                status_code=500,
                detail="카카오 REST API 키가 설정되지 않았습니다. 환경변수 KAKAO_REST_API_KEY를 설정해주세요."
            )
        
        # 2. Authorization code를 Access Token으로 교환
        token_url = "https://kauth.kakao.com/oauth/token"
        token_data = {
            "grant_type": "authorization_code",
            "client_id": KAKAO_REST_API_KEY,
            "redirect_uri": request.redirect_uri,
            "code": request.code
        }
        
        async with httpx.AsyncClient() as client:
            # 토큰 요청
            token_response = await client.post(
                token_url,
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=token_response.status_code,
                    detail=f"카카오 토큰 발급 실패: {token_response.text}"
                )
            
            token_json = token_response.json()
            access_token = token_json.get("access_token")
            
            if not access_token:
                raise HTTPException(
                    status_code=500,
                    detail="Access token을 받지 못했습니다."
                )
            
            # 3. Access Token으로 사용자 정보 조회
            user_url = "https://kapi.kakao.com/v2/user/me"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
            }
            
            user_response = await client.get(user_url, headers=headers)
            
            if user_response.status_code != 200:
                raise HTTPException(
                    status_code=user_response.status_code,
                    detail=f"카카오 사용자 정보 조회 실패: {user_response.text}"
                )
            
            user_json = user_response.json()
            
            # 4. 필요한 사용자 정보 추출
            kakao_id = user_json.get("id")
            kakao_account = user_json.get("kakao_account", {})
            profile = kakao_account.get("profile", {})
            
            nickname = profile.get("nickname", "카카오 사용자")
            profile_image = profile.get("profile_image_url")
            email = kakao_account.get("email")
            
            # 5. 응답 반환 (실제로는 DB에 저장하고 세션/JWT 토큰 발급)
            return {
                "nickname": nickname,
                "kakaoId": kakao_id,
                "email": email,
                "profileImage": profile_image,
                "provider": "kakao"
            }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Kakao OAuth Error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"카카오 인증 처리 중 오류 발생: {str(e)}"
        )
