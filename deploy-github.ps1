# FrameIt → GitHub 업로드 (git config 전역 설정 없이 실행)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host "GitHub 로그인 확인 중..." -ForegroundColor Cyan
gh auth status | Out-Null

$userJson = gh api user 2>$null
if (-not $userJson) { throw "gh 로그인이 필요합니다: gh auth login" }
$user = $userJson | ConvertFrom-Json
$login = $user.login
$email = $user.email
if (-not $email) {
  $email = if ($user.id) { "{0}+{1}@users.noreply.github.com" -f $user.id, $login } else { "{0}@users.noreply.github.com" -f $login }
}
$name = if ($user.name) { $user.name } else { $login }

Write-Host "계정: $login <$email>" -ForegroundColor Green

if (-not (Test-Path .git)) {
  git init
  Write-Host "git 저장소 초기화 완료" -ForegroundColor Green
}

git add .

$status = git status --porcelain
if ($status) {
  git -c "user.name=$name" -c "user.email=$email" commit -m "Initial deploy: FrameIt"
  Write-Host "커밋 완료" -ForegroundColor Green
} else {
  Write-Host "커밋할 변경 없음 (이미 커밋됨)" -ForegroundColor Yellow
}

$repoName = "frameit"
$remoteUrl = gh repo view $login/$repoName --json url -q .url 2>$null

if ($remoteUrl) {
  Write-Host "저장소가 이미 있습니다: $remoteUrl" -ForegroundColor Yellow
  git remote remove origin 2>$null
  git remote add origin "https://github.com/$login/$repoName.git"
} else {
  Write-Host "GitHub 저장소 생성 중: $repoName ..." -ForegroundColor Cyan
  gh repo create $repoName --public --source=. --remote=origin --description "FrameIt — 사진을 프레임 안에 넣어보자"
}

$branch = git branch --show-current
if (-not $branch) {
  git checkout -b main
  $branch = "main"
}
if ($branch -eq "master") { } else { git branch -M main 2>$null }

Write-Host "push 중..." -ForegroundColor Cyan
git push -u origin main

$url = "https://github.com/$login/$repoName"
Write-Host ""
Write-Host "완료! $url" -ForegroundColor Green
Write-Host "Vercel: https://vercel.com/new → Import $login/$repoName" -ForegroundColor Cyan
