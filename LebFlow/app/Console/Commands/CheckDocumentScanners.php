<?php

namespace App\Console\Commands;

use App\Services\DocumentScanner;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

#[Signature('documents:check {--live : Scan a harmless generated fixture and run OCR}')]
#[Description('Check scanner binaries, language data and optionally actual scanning')]
class CheckDocumentScanners extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $clam = DocumentScanner::executable(config('documents.clamav_binary'));
        $tess = DocumentScanner::executable(config('documents.tesseract_binary'));
        if (! $clam || ! $tess) {
            $this->error('Missing ClamAV or Tesseract executable. Files remain quarantined.');

            return self::FAILURE;
        }
        $languages = new Process([$tess, '--list-langs']);
        $languages->setTimeout(15)->run();
        foreach (explode('+', config('documents.ocr_languages')) as $language) {
            if (! preg_match('/^'.preg_quote($language, '/').'\s*$/m', $languages->getOutput())) {
                $this->error('Missing OCR language: '.$language);

                return self::FAILURE;
            }
        }
        $this->info('Scanner executables and requested OCR languages are available.');
        if (! $this->option('live')) {
            return self::SUCCESS;
        }
        if (! function_exists('imagecreatetruecolor')) {
            $this->error('GD is required to generate the test fixture.');

            return self::FAILURE;
        }
        $directory = storage_path('app/scan-temp');
        if (! is_dir($directory)) {
            mkdir($directory, 0700, true);
        }
        $path = tempnam($directory, 'check-');
        try {
            chmod($path, 0600);
            $image = imagecreatetruecolor(1200, 320);
            imagefill($image, 0, 0, imagecolorallocate($image, 255, 255, 255));
            $ink = imagecolorallocate($image, 0, 0, 0);
            imagestring($image, 5, 30, 30, 'IDENTITY CARD', $ink);
            imagestring($image, 5, 30, 65, 'TEST PERSON', $ink);
            imagestring($image, 5, 30, 100, '2000-01-01', $ink);
            imagepng($image, $path);
            $args = [$clam, '--no-summary'];
            if (config('documents.clamav_database')) {
                $args[] = '--database='.config('documents.clamav_database');
            }
            $virus = new Process([...$args, $path]);
            $virus->setTimeout(25)->run();
            if (! $virus->isSuccessful()) {
                $this->error('Clean-fixture malware scan failed. Check signatures and scanner logs.');

                return self::FAILURE;
            }
            $ocr = new Process([$tess, $path, 'stdout', '-l', config('documents.ocr_languages'), '--psm', '6']);
            $ocr->setTimeout(25)->run();
            if (! $ocr->isSuccessful() || ! str_contains(strtoupper($ocr->getOutput()), 'IDENTITY')) {
                $this->error('OCR did not read the synthetic fixture correctly.');

                return self::FAILURE;
            }
            $this->info('Live clean-file malware scan and OCR passed. This does not certify document authenticity or malicious-file detection coverage.');

            return self::SUCCESS;
        } finally {
            if (is_file($path)) {
                unlink($path);
            }
        }
    }
}
