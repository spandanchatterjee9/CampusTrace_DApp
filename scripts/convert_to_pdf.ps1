$word = New-Object -ComObject Word.Application
$word.Visible = $false
$files = @("Spandan_Chatterjee_230905488_BT_Assignment2", "CampusTrace_Assignment_Report")
foreach ($name in $files) {
    $inDoc = "C:\Users\spand\college\CampusTrace_DApp\docs\report\" + $name + ".docx"
    $outPdf = "C:\Users\spand\college\CampusTrace_DApp\docs\report\" + $name + ".pdf"
    if (Test-Path $inDoc) {
        $doc = $word.Documents.Open($inDoc)
        $doc.SaveAs([ref]$outPdf, [ref]17)
        $doc.Close()
        Write-Host "Successfully converted: $outPdf"
    }
}
$word.Quit()
