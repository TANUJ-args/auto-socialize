# 🧹 SocialFlow Git Cleanup Script
# This script safely removes sensitive files from git tracking while keeping them locally

Write-Host "🧹 SocialFlow Git Cleanup Starting..." -ForegroundColor Green

# Change to project directory
$projectPath = "c:\PROJECTS\ai-social-draft-main"
Set-Location $projectPath

Write-Host "📂 Working in: $projectPath" -ForegroundColor Blue

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "⚠️  Git not initialized. Initializing git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
}

# Create backup directory for sensitive files
$backupDir = "$env:USERPROFILE\Documents\SocialFlow-Backup-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Write-Host "💾 Created backup directory: $backupDir" -ForegroundColor Blue

# Files to remove from git tracking (but keep locally)
$sensitiveFiles = @(
    "backend/.env",
    "backend/.env.production", 
    "backend/test-*.js",
    "backend/package-lock.json"
)

# Create list of existing sensitive files
$existingFiles = @()
foreach ($pattern in $sensitiveFiles) {
    $files = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
    $existingFiles += $files
}

if ($existingFiles.Count -eq 0) {
    Write-Host "✅ No sensitive files found to clean up!" -ForegroundColor Green
} else {
    Write-Host "🔍 Found $($existingFiles.Count) sensitive files to handle:" -ForegroundColor Yellow
    
    # Backup sensitive files
    Write-Host "💾 Backing up sensitive files..." -ForegroundColor Blue
    foreach ($file in $existingFiles) {
        $backupPath = Join-Path $backupDir $file.Name
        Copy-Item $file.FullName $backupPath -Force
        Write-Host "   📄 Backed up: $($file.Name)" -ForegroundColor Gray
    }
    
    # Remove from git tracking (if git repository exists and files are tracked)
    Write-Host "🗑️  Removing files from git tracking..." -ForegroundColor Blue
    
    try {
        # Check if files are tracked
        $trackedFiles = git ls-files | Where-Object { $_ -match "(\.env|test-.*\.js|package-lock\.json)" }
        
        if ($trackedFiles) {
            Write-Host "📋 Removing tracked sensitive files from git..." -ForegroundColor Yellow
            foreach ($file in $trackedFiles) {
                git rm --cached $file
                Write-Host "   🗑️  Removed from tracking: $file" -ForegroundColor Gray
            }
        } else {
            Write-Host "✅ No sensitive files currently tracked in git" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "ℹ️  No files currently tracked in git (new repository)" -ForegroundColor Cyan
    }
}

# Clean up node_modules if committed (shouldn't be)
Write-Host "🧹 Checking for node_modules..." -ForegroundColor Blue
try {
    $nodeModules = git ls-files | Where-Object { $_ -match "node_modules" }
    if ($nodeModules) {
        Write-Host "⚠️  Found node_modules in git. Removing..." -ForegroundColor Yellow
        git rm -r --cached node_modules/
        git rm -r --cached backend/node_modules/
    }
}
catch {
    Write-Host "✅ node_modules not tracked (good!)" -ForegroundColor Green
}

# Add .gitignore files
Write-Host "📋 Adding .gitignore files to git..." -ForegroundColor Blue
git add .gitignore
git add backend/.gitignore

# Show current status
Write-Host "`n📊 Current git status:" -ForegroundColor Blue
git status --short

Write-Host "`n🎯 Next Steps:" -ForegroundColor Green
Write-Host "1. 🔒 Regenerate ALL API keys (they may have been exposed)" -ForegroundColor Yellow
Write-Host "2. 📝 Commit the .gitignore changes: git commit -m '🔒 Add comprehensive .gitignore'" -ForegroundColor Yellow  
Write-Host "3. 🚀 Your repository is now safe for public sharing!" -ForegroundColor Yellow
Write-Host "4. 💾 Sensitive files backed up to: $backupDir" -ForegroundColor Yellow

Write-Host "`n✅ Cleanup completed successfully!" -ForegroundColor Green

# Show what's protected now
Write-Host "`n🛡️  Now protected from git:" -ForegroundColor Cyan
Write-Host "   • All .env files" -ForegroundColor Gray
Write-Host "   • API keys and tokens" -ForegroundColor Gray  
Write-Host "   • Test files with credentials" -ForegroundColor Gray
Write-Host "   • Upload directories" -ForegroundColor Gray
Write-Host "   • Build artifacts" -ForegroundColor Gray
Write-Host "   • Personal notes and drafts" -ForegroundColor Gray
Write-Host "   • Database files" -ForegroundColor Gray
Write-Host "   • SSL certificates" -ForegroundColor Gray

Read-Host "`nPress Enter to continue..."