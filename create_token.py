# create_token.py (윈도우 환경용 최종 단순화 버전)
from google_auth_oauthlib.flow import InstalledAppFlow
import os

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

def main():
    if os.path.exists('token.json'):
        os.remove('token.json')
        print("'token.json' 파일을 삭제하고 새로 시작합니다.")

    flow = InstalledAppFlow.from_client_secrets_file(
        'credentials.json', SCOPES)

    # 윈도우에서는 이 코드가 자동으로 브라우저를 열어줍니다!
    creds = flow.run_local_server(port=0)

    with open('token.json', 'w') as token:
        token.write(creds.to_json())

    print("\n성공적으로 'token.json' 파일을 생성했습니다!")

if __name__ == '__main__':
    main()