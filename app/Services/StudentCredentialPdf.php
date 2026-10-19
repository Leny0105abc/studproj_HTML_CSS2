<?php

namespace App\Services;

use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Carbon;

class StudentCredentialPdf
{
    public function render(array $credentials, string $generatedAt): string
    {
        $options = new Options(['defaultFont' => 'DejaVu Sans', 'isRemoteEnabled' => false, 'isPhpEnabled' => false, 'isJavascriptEnabled' => false, 'isFontSubsettingEnabled' => true]);
        $pdf = new Dompdf($options);
        $pdf->setPaper('A4');
        $pdf->loadHtml(view('pdf.student-passwords', ['credentials' => $credentials, 'generatedAt' => Carbon::parse($generatedAt)->timezone('Asia/Manila')->format('M j, Y g:i A').' (Philippines)'])->render(), 'UTF-8');
        $pdf->render();
        $canvas = $pdf->getCanvas();
        $font = $pdf->getFontMetrics()->getFont('DejaVu Sans');
        $canvas->page_text(42, 807, 'Private account list - Page {PAGE_NUM} of {PAGE_COUNT}', $font, 8, [0.35, 0.38, 0.43]);

        return $pdf->output();
    }
}
