
Add-Type -AssemblyName System.Drawing
$iconPath = "c:\Users\choje\OneDrive\바탕 화면\clony\clony-mobile\assets\real-icon.png"
$splashPath = "c:\Users\choje\OneDrive\바탕 화면\clony\clony-mobile\assets\real-splash.png"
$sourcePath = "C:\Users\choje\.gemini\antigravity\brain\d3e447ff-acde-4264-a5ea-0c3ac07408fd\uploaded_image_1767663379169.jpg"

$img = [System.Drawing.Image]::FromFile($sourcePath)
$img.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png)
$img.Save($splashPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Conversion Complete"
