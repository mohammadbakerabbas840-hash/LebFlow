<?php

return [
    'research_enabled' => env('RAG_RESEARCH_ENABLED', false),
    'vector_enabled' => env('RAG_VECTOR_ENABLED', false),
    'url' => env('QDRANT_URL', 'http://127.0.0.1:6333'),
    'api_key' => env('QDRANT_API_KEY'),
    'collection' => env('QDRANT_COLLECTION', 'lebflow_guides_v1'),
    'embedding_model' => env('RAG_EMBEDDING_MODEL', 'text-embedding-3-small'),
    'dimensions' => (int) env('RAG_EMBEDDING_DIMENSIONS', 1536),
    'score_threshold' => (float) env('RAG_SCORE_THRESHOLD', 0.35),
];
