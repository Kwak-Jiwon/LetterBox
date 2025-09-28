# check_credentials.py
import json
import os

FILENAME = 'credentials.json'

def main():
    print(f"'{FILENAME}' 파일의 내용을 확인합니다...")
    
    if not os.path.exists(FILENAME):
        print(f"\n[오류] '{FILENAME}' 파일을 찾을 수 없습니다!")
        print("Google Cloud Console에서 다운로드한 파일의 이름을 정확히 확인해주세요.")
        return

    try:
        with open(FILENAME, 'r') as f:
            data = json.load(f)
        
        print("\n--- 파일 내용 시작 ---")
        # 보기 좋게 출력
        print(json.dumps(data, indent=2))
        print("--- 파일 내용 끝 ---")

        # 파일 유형 자동 판별
        if 'installed' in data:
            print("\n[진단] 이 파일은 '데스크톱 앱' 유형입니다. (정상)")
        elif 'web' in data:
            print("\n[진단] 이 파일은 '웹 애플리케이션' 유형입니다. (오류의 원인!)")
        else:
            print("\n[진단] 알 수 없는 유형의 파일입니다.")

    except json.JSONDecodeError:
        print(f"\n[오류] '{FILENAME}' 파일이 올바른 JSON 형식이 아닙니다.")
    except Exception as e:
        print(f"\n[오류] 파일을 읽는 중 에러가 발생했습니다: {e}")

if __name__ == '__main__':
    main()