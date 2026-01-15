
Add-Type -AssemblyName System.Drawing
$source = ".\my-logo.jpg"
$dest = ".\real-icon.png"
$dest2 = ".\real-splash.png"

try {
    $img = [System.Drawing.Image]::FromFile($source)
    $img.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $img.Save($dest2, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output "SUCCESS"
} catch {
    Write-Output $_.Exception.Message
}
