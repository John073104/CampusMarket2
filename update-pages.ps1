# Script to add standalone: true and necessary imports to all page components

$files = Get-ChildItem -Path ".\src\app" -Recurse -Filter "*page.ts" -Exclude "*.spec.ts" | Select-Object -ExpandProperty FullName

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    
    # Skip if already has standalone: true
    if ($content -match "standalone:\s*true") {
        Write-Host "Skipping $file (already standalone)" -ForegroundColor Yellow
        continue
    }
    
    # Check if it already has IonicModule import
    if ($content -match "from '@ionic/angular'") {
        Write-Host "Skipping $file (already has IonicModule)" -ForegroundColor Yellow
        continue
    }
    
    # Add imports after the first import statement
    if ($content -match "import { Component") {
        $content = $content -replace "(import { Component[^}]*} from '@angular/core';)", "`$1`nimport { CommonModule } from '@angular/common';`nimport { FormsModule } from '@angular/forms';`nimport { IonicModule } from '@ionic/angular';"
        
        # Add standalone and imports to @Component decorator
        $content = $content -replace "(@Component\(\{[^)]*)(styleUrls:[^\]]*\])(,?\s*\})", "`$1`$2,`n  standalone: true,`n  imports: [CommonModule, FormsModule, IonicModule]`n}"
        
        Set-Content -Path $file -Value $content
        Write-Host "Updated $file" -ForegroundColor Green
    }
}

Write-Host "`nAll page components updated!" -ForegroundColor Cyan
