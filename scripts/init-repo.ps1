Param(
  [string]$RemoteUrl = '',
  [string]$Branch = 'main'
)

Write-Output "Initializing git repository..."
if (-not (Test-Path -Path .git)) {
  git init | Out-Null
} else {
  Write-Output ".git already exists"
}

# Configure local user if missing
if (-not (git config user.name)) {
  git config user.name "Your Name"
}
if (-not (git config user.email)) {
  git config user.email "you@example.com"
}

git add .
# commit if no commits yet
$hasHead = $null
try{ git rev-parse --verify HEAD | Out-Null; $hasHead = $true } catch { $hasHead = $false }
if (-not $hasHead) {
  git commit -m "Initial commit"
} else {
  Write-Output "Repository already has commits"
}

if ($RemoteUrl -ne ''){
  if (-not (git remote)) { git remote add origin $RemoteUrl } else { git remote set-url origin $RemoteUrl }
  git branch -M $Branch
  Write-Output "Pushing to origin/$Branch..."
  git push -u origin $Branch
} else {
  Write-Output "No remote provided. Run: git remote add origin <URL> ; git push -u origin main"
}

Write-Output "Done."