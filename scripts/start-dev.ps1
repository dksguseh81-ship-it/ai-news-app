# 개발 서버(localhost:3000)를 시작한다. 로그온 시 작업 스케줄러가 실행한다.
# - 이미 3000번 포트가 열려 있으면 중복 실행하지 않는다.
# - 서버가 종료되면 5초 뒤 다시 시작한다.
# - 로그는 저장소 밖(%LOCALAPPDATA%\ai-news-collector\dev.log)에 남긴다.

$ErrorActionPreference = "Stop"

$project = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $env:LOCALAPPDATA "ai-news-collector"
$log = Join-Path $logDir "dev.log"
New-Item -ItemType Directory -Force $logDir | Out-Null
if ((Test-Path $log) -and (Get-Item $log).Length -gt 5MB) { Remove-Item $log -Force }

function Write-Log($msg) {
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg" | Add-Content -Path $log -Encoding utf8
}

function Test-PortOpen {
  [bool](Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue)
}

if (Test-PortOpen) {
  Write-Log "3000번 포트가 이미 사용 중이라 시작하지 않습니다."
  exit 0
}

$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
Set-Location $project

while ($true) {
  Write-Log "개발 서버 시작"
  # npm 출력(stderr 포함)을 로그 파일로 보낸다.
  & cmd.exe /c "`"$npm`" run dev >> `"$log`" 2>&1"
  Write-Log "개발 서버 종료 (exit $LASTEXITCODE). 5초 뒤 재시작"
  Start-Sleep -Seconds 5
  if (Test-PortOpen) { Write-Log "다른 프로세스가 포트를 사용 중이라 종료합니다."; exit 0 }
}
