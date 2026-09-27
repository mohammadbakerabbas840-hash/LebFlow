<?php

return [
    'clamav_binary' => env('CLAMAV_BINARY', 'clamscan'),
    'clamav_database' => env('CLAMAV_DATABASE'),
    'tesseract_binary' => env('TESSERACT_BINARY', 'tesseract'),
    'ocr_languages' => env('OCR_LANGUAGES', 'ara+eng+fra'),
];
