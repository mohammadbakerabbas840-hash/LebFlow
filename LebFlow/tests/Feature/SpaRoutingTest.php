<?php

namespace Tests\Feature;

use Tests\TestCase;

class SpaRoutingTest extends TestCase
{
    public function test_laravel_serves_the_frontend_and_client_routes(): void
    {
        $this->get('/')->assertOk()->assertHeader('Content-Type', 'text/html; charset=utf-8');
        $this->get('/services/passport')->assertOk();
    }

    public function test_spa_fallback_does_not_hide_missing_api_or_asset_routes(): void
    {
        $this->get('/api/v1/missing')->assertNotFound();
        $this->get('/api/v1/connection-test')->assertNotFound();
        $this->get('/assets/missing.js')->assertNotFound();
        $this->get('/storage/private.png')->assertForbidden();
    }
}
