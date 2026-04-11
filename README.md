# 트리 마인드맵 프로그램 (Vite/NPM 프로젝트)

이 프로젝트는 Vite를 사용하여 현대적인 개발 환경으로 마이그레이션된 마인드맵 프로그램입니다.

## 🚀 로컬 실행 방법

이 폴더를 VS Code 등 터미널에서 연 뒤 아래 명령어를 차례대로 실행하세요.

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```
실행 후 터미널에 나타나는 주소(`http://localhost:5173`)를 브라우저에서 열면 됩니다.

## 📂 프로젝트 구조

- `index.html`: 메인 인터페이스
- `mindmap.js`: 마인드맵 로직 (ES Module 방식)
- `style.css`: 디자인 스타일 가이드
- `package.json`: NPM 설정 및 스크립트

## ⬆️ GitHub에 올리는 방법

1. GitHub에서 새로운 저장소(Repository)를 생성합니다.
2. 로컬 터미널에서 아래 명령어를 실행합니다.

```bash
# git 초기화
git init

# 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit"

# 원격 저장소 연결 (저장소 주소를 넣어주세요)
git remote add origin https://github.com/사용자이름/저장소이름.git

# 푸시
git push -u origin main
```

## 🛠 주요 기능
- **실시간 자동 저장**: 글자를 입력할 때마다 즉시 저장됩니다.
- **오쏘고날(직선) 디자인**: 전구간 90도 꺾인 깔끔한 선으로 연결됩니다.
- **백업 및 복구**: JSON 파일로 데이터를 내보내거나 가져올 수 있습니다.
- **PNG 저장**: 제작한 마인드맵을 이미지 파일로 저장할 수 있습니다.
