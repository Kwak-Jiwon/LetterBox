import os.path
import base64
import re
from flask import Flask, jsonify
from flask_cors import CORS
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# --- 기존 코드의 설정 및 함수들 ---
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

UNSUB_REGEX = re.compile(
    r"(unsubscribe|unsub|opt\s*out|manage\s*subscription|"
    r"수신거부|구독\s*취소|구독해지|수신\s*동의\s*철회)",
    re.IGNORECASE
)
KOREA_ADDR_REGEX = re.compile(
    r"(대한민국|한국|서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)"
    r".{0,50}("
    r"(시|도|특별시|광역시)"
    r"|"
    r"(구|군|읍|면|동|리)"
    r")?.{0,80}("
    r"(로|길)\s*\d{1,4}"
    r"|"
    r"\d{1,4}(-\d{1,4})?번지"
    r"|"
    r"\b\d{5}\b"
    r")",
    re.UNICODE
)

def is_newsletter(body_text: str) -> bool:
    tail = body_text[-1500:] if len(body_text) > 1500 else body_text
    has_unsub = bool(UNSUB_REGEX.search(tail))
    has_addr = bool(KOREA_ADDR_REGEX.search(tail))
    
    # --- 🐞 디버깅 메시지 ---
    print(f"    - '수신거부' 포함 여부: {has_unsub}")
    print(f"    - '주소' 포함 여부: {has_addr}")
    # --------------------------
    
    return has_unsub and has_addr

def get_message_body(payload):
    if 'parts' in payload:
        for part in payload['parts']:
            if part.get('mimeType', '').startswith('text/plain'):
                text = get_message_body(part)
                if text: return text
        for part in payload['parts']:
            text = get_message_body(part)
            if text: return text
    else:
        data = payload.get('body', {}).get('data')
        if data:
            return base64.urlsafe_b64decode(data).decode('utf-8', errors="ignore")
    return ""

app = Flask(__name__)
CORS(app)

@app.route('/api/newsletters', methods=['GET'])
def fetch_newsletters_api():
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # token.json이 없으면 에러를 반환하여 문제를 명확히 알림
            return jsonify({"error": "token.json 파일이 없습니다. create_token.py를 먼저 실행해주세요."}), 500
            
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    try:
        service = build('gmail', 'v1', credentials=creds)
        results = service.users().messages().list(
            userId='me',
            maxResults=50,
            q="newer_than:7d is:unread"
        ).execute()
        messages = results.get('messages', [])

        # --- 🐞 디버깅 메시지 ---
        print("\n" + "="*50)
        print("API 요청 받음. 이메일 스캔 시작...")
        if not messages:
            print("결과: 최근 7일 내 안 읽은 메시지를 찾을 수 없습니다.")
            print("="*50 + "\n")
            return jsonify([])
        print(f"결과: {len(messages)}개의 안 읽은 메일을 찾았습니다.")
        # --------------------------

        newsletter_list = []
        for i, message in enumerate(messages):
            msg = service.users().messages().get(userId='me', id=message['id'], format="full").execute()
            payload = msg.get('payload', {})
            headers = payload.get('headers', [])
            subject = next((h['value'] for h in headers if h['name'].lower() == 'subject'), '(제목 없음)')
            
            # --- 🐞 디버깅 메시지 ---
            print(f"\n[{i+1}/{len(messages)}] '{subject}' 메일 검사 중...")
            # --------------------------

            body_text = get_message_body(payload)
            
            if not body_text:
                print("    - 본문을 찾을 수 없습니다.")
                continue

            # 전체 본문 내용도 한번 출력해봅니다.
            # print("    - 추출된 본문:\n", body_text[:500] + "...") # 너무 길면 일부만 출력

            if is_newsletter(body_text):
                print("    -> 뉴스레터로 판별됨!")
                sender = next((h['value'] for h in headers if h['name'].lower() == 'from'), '(보낸사람 없음)')
                newsletter_list.append({
                    "id": message['id'], "sender": sender, "subject": subject,
                    "summary": msg.get('snippet', ''),
                })
            else:
                print("    -> 뉴스레터가 아님.")

        # --- 🐞 디버깅 메시지 ---
        print("\n스캔 완료.")
        print(f"최종적으로 찾은 뉴스레터 개수: {len(newsletter_list)}개")
        print("="*50 + "\n")
        # --------------------------
        
        return jsonify(newsletter_list)

    except HttpError as error:
        print(f'Gmail API 오류가 발생했습니다: {error}')
        return jsonify({"error": str(error)}), 500
    except Exception as e:
        print(f'알 수 없는 서버 오류가 발생했습니다: {e}')
        return jsonify({"error": "서버 내부 오류 발생"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)