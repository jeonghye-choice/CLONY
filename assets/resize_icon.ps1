
Add-Type -AssemblyName System.Drawing
$source = ".\my-logo.jpg"
$dest = ".\real-icon.png"
$dest2 = ".\real-splash.png"

try {
    $img = [System.Drawing.Image]::FromFile($source)
    # Resize to 1024x1024
    $resized = new-object System.Drawing.Bitmap($img, 1024, 1024)
    $resized.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $resized.Save($dest2, [System.Drawing.Imaging.ImageFormat]::Png)
    $img.Dispose()
    $resized.Dispose()
    Write-Output "RESIZE SUCCESS"
} catch {
    Write-Output $_.Exception.Message
}
