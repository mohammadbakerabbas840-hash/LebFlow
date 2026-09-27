<?php

namespace App\Services;

use App\Models\IdentityDocument;
use App\Models\User;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\ExecutableFinder;
use Symfony\Component\Process\Process;

class DocumentScanner
{
    public static function executable(string $configured): ?string
    {
        if (is_file($configured) && (DIRECTORY_SEPARATOR === '\\' || is_executable($configured))) {
            return $configured;
        }

        return (new ExecutableFinder)->find($configured);
    }

    public function scan(IdentityDocument $document): array
    {
        $clamav = self::executable(config('documents.clamav_binary'));
        if (! $clamav) {
            return $this->result('unavailable', false, ['scanner_unavailable']);
        }
        $directory = storage_path('app/scan-temp');
        if (! is_dir($directory) && ! mkdir($directory, 0700, true) && ! is_dir($directory)) {
            return $this->result('unavailable', false, ['scanner_unavailable']);
        }
        $path = tempnam($directory, 'scan-');
        if ($path === false) {
            return $this->result('unavailable', false, ['scanner_unavailable']);
        }
        try {
            chmod($path, 0600);
            $bytes = Crypt::decryptString(Storage::disk('identity')->get($document->path));
            if (strlen($bytes) > 5 * 1024 * 1024 || strlen($bytes) !== $document->size) {
                return $this->result('rejected', false, ['invalid_file']);
            }
            file_put_contents($path, $bytes);
            $arguments = [$clamav, '--no-summary', '--max-filesize=6M', '--max-scansize=12M', '--max-recursion=4'];
            if (config('documents.clamav_database')) {
                $arguments[] = '--database='.config('documents.clamav_database');
            }
            $virus = new Process([...$arguments, $path]);
            $virus->setTimeout(25)->run();
            if ($virus->getExitCode() === 1) {
                return $this->result('rejected', false, ['unsafe_file']);
            }
            if (! $virus->isSuccessful()) {
                return $this->result('unavailable', false, ['scanner_unavailable']);
            }
            // PDFs require a separate sandboxed rendering/review pipeline; do not execute a PDF parser here.
            if ($document->mime === 'application/pdf') {
                return $this->result('needs_review', true, ['pdf_requires_review']);
            }
            $image = @getimagesize($path);
            if (! $image || $image[0] * $image[1] > 20000000 || $image[0] > 10000 || $image[1] > 10000) {
                return $this->result('rejected', false, ['invalid_image']);
            }
            $ocr = new Process([config('documents.tesseract_binary'), $path, 'stdout', '-l', config('documents.ocr_languages'), '--psm', '6']);
            $ocr->setTimeout(25)->run();
            if (! $ocr->isSuccessful()) {
                return $this->result('unavailable', true, ['ocr_unavailable']);
            }
            $user = User::findOrFail($document->user_id);

            return $this->compare(mb_substr($ocr->getOutput(), 0, 30000), $user, $document->kind);
        } catch (\Throwable) {
            return $this->result('unavailable', false, ['scanner_unavailable']);
        } finally {
            if (is_file($path)) {
                unlink($path);
            }
        }
    }

    public function compare(string $text, User $user, string $kind): array
    {
        $normalized = $this->normalize($text);
        $checks = [
            'name' => (mb_strlen($this->normalize($user->name)) >= 4 && str_contains($normalized, $this->normalize($user->name))) || ($user->name_arabic && mb_strlen($this->normalize($user->name_arabic)) >= 4 && str_contains($normalized, $this->normalize($user->name_arabic))),
            'date_of_birth' => $user->dob && (str_contains($normalized, $this->normalize($user->dob->format('Y-m-d'))) || str_contains($normalized, $this->normalize($user->dob->format('d/m/Y')))),
            'document_type' => false,
        ];
        $labels = $kind === 'idPhoto' ? ['بطاقة هوية', 'بطاقة الهوية', 'identity card', 'carte d’identité', 'carte d identite'] : ['إخراج قيد فردي', 'بيان قيد إفرادي', 'بيان قيد فردي', 'individual civil status', 'extrait individuel'];
        foreach ($labels as $label) {
            $checks['document_type'] = $checks['document_type'] || str_contains($normalized, $this->normalize($label));
        }
        if ($kind === 'idPhoto') {
            $checks['id_number'] = mb_strlen($this->normalize($user->id_number ?? '')) >= 3 && str_contains($normalized, $this->normalize($user->id_number));
        }
        $failed = array_keys(array_filter($checks, fn (bool $match): bool => ! $match));

        return $this->result($failed ? 'needs_review' : 'consistent', true, $failed);
    }

    private function normalize(string $value): string
    {
        $value = strtr(mb_strtolower($value), ['٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4', '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9', 'أ' => 'ا', 'إ' => 'ا', 'آ' => 'ا', 'é' => 'e', 'è' => 'e', 'ê' => 'e']);

        return preg_replace('/[^\p{L}\p{N}]/u', '', $value);
    }

    private function result(string $status, bool $clear, array $reasons): array
    {
        return ['scan_status' => $status, 'malware_clear' => $clear, 'scan_report' => ['reasons' => $reasons, 'authenticityVerified' => false], 'scanned_at' => now()];
    }
}
