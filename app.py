# app.py (인코딩 자동 감지 기능이 추가된 최종 버전)

import os.path
import base64
import re
from flask import Flask, jsonify, request
from flask_cors import CORS
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from transformers import pipeline

# --- 상수 및 정규식 정의 ---
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
UNSUB_REGEX = re.compile(
    r"(unsubscribe|unsub|opt\s*out|manage\s*subscription|"
    r"수신거부|구독\s*취소|구독해지|수신\s*동의\s*철회)",
    re.IGNORECASE
)
KOREA_ADDR_REGEX = re.compile(
    r"(대한민국|한국|서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)"
    r".{0,50}((시|도|특별시|광역시)|(구|군|읍|면|동|리))?.{0,80}((로|길)\s*\d{1,4}|\d{1,4}(-\d{1,4})?번지|\b\d{5}\b)",
    re.UNICODE
)

# --- AI 요약 모델 로드 ---
print("AI 요약 모델을 로드하는 중입니다... (시간이 걸릴 수 있습니다)")
summarizer = pipeline('summarization', model='gogamza/kobart-summarization')
print("AI 요약 모델 로드 완료.")


# --- Helper 함수 정의 ---

# <<-- 새로 추가된 함수: 이메일 헤더에서 인코딩(charset)을 추출합니다 -->>
def get_charset_from_headers(headers):
    content_type = next((h['value'] for h in headers if h['name'].lower() == 'content-type'), None)
    if content_type and 'charset=' in content_type:
        charset = content_type.split('charset=')[-1].strip()
        # "euc-kr" 같은 따옴표를 제거
        return charset.replace('"', '')
    return 'utf-8' # 기본값은 utf-8

def is_newsletter(body_text: str) -> bool:
    tail = body_text[-1500:] if len(body_text) > 1500 else body_text
    has_unsub = bool(UNSUB_REGEX.search(tail))
    has_addr = bool(KOREA_ADDR_REGEX.search(tail))
    return has_unsub and has_addr

def get_message_body(payload, headers):
    charset = get_charset_from_headers(headers) # 헤더에서 인코딩 방식 가져오기
    
    if 'parts' in payload:
        for part in payload['parts']:
            if part.get('mimeType') == 'text/html':
                data = part.get('body', {}).get('data')
                if data: return base64.urlsafe_b64decode(data).decode(charset, errors="ignore")
        for part in payload['parts']:
            if part.get('mimeType') == 'text/plain':
                data = part.get('body', {}).get('data')
                if data: return base64.urlsafe_b64decode(data).decode(charset, errors="ignore")
        for part in payload['parts']:
            # 재귀 호출 시에는 해당 파트의 헤더를 사용해야 하지만, 복잡성을 위해 상위 헤더의 charset을 사용
            part_headers = part.get('headers', headers)
            text = get_message_body(part, part_headers)
            if text: return text
    else:
        data = payload.get('body', {}).get('data')
        if data: return base64.urlsafe_b64decode(data).decode(charset, errors="ignore")
    return ""

# --- Flask 앱 인스턴스 생성 ---
app = Flask(__name__)
CORS(app)


# --- API 라우트(경로) 정의 ---
@app.route('/api/newsletters', methods=['GET'])
def fetch_newsletters_api():
    # ... (인증 로직은 이전과 동일) ...
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            return jsonify({"error": "token.json 파일이 없습니다."}), 500
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    try:
        service = build('gmail', 'v1', credentials=creds)
        results = service.users().messages().list(userId='me', maxResults=50, q="newer_than:7d is:unread").execute()
        messages = results.get('messages', [])

        if not messages: return jsonify([])

        newsletter_list = []
        for message in messages:
            msg = service.users().messages().get(userId='me', id=message['id'], format="full").execute()
            payload = msg.get('payload', {})
            headers = payload.get('headers', [])
            subject = next((h['value'] for h in headers if h['name'].lower() == 'subject'), '(제목 없음)')
            
            # <<-- get_message_body에 headers 전달 -->>
            body_text = get_message_body(payload, headers)
            if not body_text: continue

            if is_newsletter(body_text): # is_newsletter는 임시로 True로 둘 수 있습니다.
                sender = next((h['value'] for h in headers if h['name'].lower() == 'from'), '(보낸사람 없음)')
                newsletter_list.append({
                    "id": message['id'], 
                    "sender": sender, 
                    "subject": subject,
                    "summary": msg.get('snippet', ''),
                    "body": body_text
                })
        
        return jsonify(newsletter_list)

    except Exception as e:
        print(f'뉴스레터 API 오류 발생: {e}')
        return jsonify({"error": "서버 내부 오류 발생"}), 500


@app.route('/api/summarize', methods=['POST'])
def summarize_text_api():
    # ... (이전과 동일) ...
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "요약할 텍스트가 없습니다."}), 400
        
        text_to_summarize = data['text']
        summary = summarizer(text_to_summarize, max_length=200, min_length=50, do_sample=False)
        return jsonify({"summary": summary[0]['summary_text']})
    except Exception as e:
        print(f'요약 API 오류 발생: {e}')
        return jsonify({"error": "텍스트 요약 중 서버 오류 발생"}), 500


# --- 앱 실행 ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)