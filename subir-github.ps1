# Script para enviar o projeto ao GitHub
# Repositorio: https://github.com/mlealguilherme-ui/sistema-camarpe
$REPO_URL = "https://github.com/mlealguilherme-ui/sistema-camarpe.git"

# Encontrar o Git (PATH ou instalacao padrao no Windows)
$gitExe = $null
if (Get-Command git -ErrorAction SilentlyContinue) {
  $gitExe = "git"
} elseif (Test-Path "C:\Program Files\Git\bin\git.exe") {
  $gitExe = "C:\Program Files\Git\bin\git.exe"
} elseif (Test-Path "C:\Program Files (x86)\Git\bin\git.exe") {
  $gitExe = "C:\Program Files (x86)\Git\bin\git.exe"
}

if (-not $gitExe) {
  Write-Host ""
  Write-Host "ERRO: Git nao encontrado." -ForegroundColor Red
  Write-Host ""
  Write-Host "1. Baixe e instale o Git: https://git-scm.com/download/win"
  Write-Host "2. Na instalacao, marque a opcao 'Add Git to PATH'."
  Write-Host "3. Feche e abra o terminal de novo e rode este script outra vez."
  Write-Host ""
  exit 1
}

function Run-Git {
  param([string]$ArgList)
  if ($gitExe -eq "git") {
    Invoke-Expression "git $ArgList"
  } else {
    Invoke-Expression "& '$gitExe' $ArgList"
  }
}

Set-Location $PSScriptRoot
Write-Host "Git encontrado. Enviando projeto ao GitHub..." -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path .git)) { Run-Git "init" }
Run-Git "add ."
Run-Git "status"
Run-Git "commit -m `"Primeiro commit - Sistema Camarpe`""
Run-Git "branch -M main"
$remotes = Run-Git "remote" 2>$null
if (-not $remotes -or $remotes -notmatch "origin") { Run-Git "remote add origin $REPO_URL" }
else { Run-Git "remote set-url origin $REPO_URL" }
Write-Host ""
Write-Host "Enviando para o GitHub (pode abrir janela de login)..." -ForegroundColor Cyan
Run-Git "push -u origin main"
Write-Host ""
Write-Host "Pronto! Repositorio: https://github.com/mlealguilherme-ui/sistema-camarpe" -ForegroundColor Green
