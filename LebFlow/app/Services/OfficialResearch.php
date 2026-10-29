Log::error('LebFlow research provider diagnostic', [
                'http_status' => $response->status(),
                'response_status' => $data['status'] ?? null,
                'error_code' => data_get($data, 'error.code'),
                'error_type' => data_get($data, 'error.type'),
                'incomplete_reason' => data_get($data, 'incomplete_details.reason'),
                'request_id' => $response->header('x-request-id'),
            ]);
            throw new RuntimeException('Research provider unavailable.');
        }

        $output = $data['output'] ?? null;
        if (! is_array($output)) {
            $this->failValidation('invalid_output', $response->header('x-request-id'));
        }

        $answer = '';
        $annotations = [];
        $webSearchUsed = false;

        foreach ($output as $item) {
            if (! is_array($item)) {
                continue;
            }
            if (($item['type'] ?? null) === 'web_search_call') {
                $webSearchUsed = true;
            }
            if (($item['type'] ?? null) !== 'message' || ! is_array($item['content'] ?? null)) {
                continue;
            }

            foreach ($item['content'] as $part) {
                if (! is_array($part) || ($part['type'] ?? null) !== 'output_text' || ! is_string($part['text'] ?? null)) {
                    continue;
                }

                $text = $part['text'];
                $offset = mb_strlen($answer, 'UTF-8');
                $answer .= $text;

                if (isset($part['annotations']) && ! is_array($part['annotations'])) {
                    $this->failValidation('annotations_not_array', $response->header('x-request-id'));
                }

                foreach ($part['annotations'] ?? [] as $citation) {
                    if (! is_array($citation) || ($citation['type'] ?? null) !== 'url_citation') {
                        continue;
                    }

                    $url = $citation['url'] ?? null;
                    if (! is_string($url) || ! filter_var($url, FILTER_VALIDATE_URL)) {
                        $this->failValidation('invalid_citation_url', $response->header('x-request-id'));
                    }
                    $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
                    $host = strtolower((string) parse_url($url, PHP_URL_HOST));
                    $allowed = false;
                    foreach (self::DOMAINS as $domain) {
                        if ($host === $domain || str_ends_with($host, '.'.$domain)) {
                            $allowed = true;
                            break;
                        }
                    }
                    if ($scheme !== 'https' || ! $allowed) {
                        Log::warning('LebFlow research citation rejected', [
                            'reason' => 'unapproved_domain_or_scheme',
                            'host' => $host,
                            'request_id' => $response->header('x-request-id'),
                        ]);
                        $this->failValidation('untrusted_citation', $response->header('x-request-id'));
                    }

                    $start = $citation['start_index'] ?? null;
                    $end = $citation['end_index'] ?? null;
                    if (! is_int($start) || ! is_int($end) || $start < 0 || $end <= $start || $end > mb_strlen($text, 'UTF-8')) {
                        $this->failValidation('invalid_citation_positions', $response->header('x-request-id'));
                    }
                    $title = $citation['title'] ?? $host;
                    $annotations[] = [
                        'start' => $offset + $start,
                        'end' => $offset + $end,
                        'url' => $url,
                        'title' => mb_substr(is_string($title) ? $title : $host, 0, 250, 'UTF-8'),
                    ];
                }
                $answer .= "\n\n";
            }
        }

        if (! $webSearchUsed) {
            $this->failValidation('web_search_not_used', $response->header('x-request-id'));
        }
        if (trim($answer) === '') {
            $this->failValidation('empty_answer', $response->header('x-request-id'));
        }
        if (mb_strlen($answer, 'UTF-8') > 16000) {
            $this->failValidation('answer_too_long', $response->header('x-request-id'));
        }
        if ($annotations === []) {
            $this->failValidation('no_supported_citations', $response->header('x-request-id'));
        }

        usort($annotations, static fn (array $a, array $b): int => $a['start'] <=> $b['start']);
        $previousEnd = 0;
        foreach ($annotations as $annotation) {
            if ($annotation['start'] < $previousEnd) {
                $this->failValidation('overlapping_citations', $response->header('x-request-id'));
            }
            $previousEnd = $annotation['end'];
        }

        return [
            'success' => true,
            'answer' => $answer,
            'status' => 'researched',
            'citations' => [],
            'annotations' => $annotations,
            'researchedAt' => now()->toIso8601String(),
        ];
    }

    private function failValidation(string $reason, ?string $requestId): never
    {
        Log::error('LebFlow research validation failed', [
            'reason' => $reason,
            'request_id' => $requestId,
        ]);
        throw new RuntimeException('Research response could not be verified.');
    }
