@echo off
chcp 65001 > nul
cd /d "%~dp0"

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [안내] PC에 Git이 설치되어 있지 않아 winget으로 Git 설치를 시작합니다...
    winget install --id Git.Git -e --source winget
    set "PATH=%PATH%;C:\Program Files\Git\cmd"
)

echo [1/5] Git 저장소 초기화...
git init

echo [2/5] 파일 스테이징 (node_modules 제외)...
git add .

echo [3/5] 첫 커밋 생성...
git commit -m "첫 배포"

echo [4/5] 브랜치 main 설정 및 원격 저장소 연결...
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/a01043971030-lab/pettime.git

echo [5/5] GitHub 원격 저장소로 푸시...
git push -u origin main

echo.
echo [완료] 배포 푸시가 완료되었습니다!
pause
