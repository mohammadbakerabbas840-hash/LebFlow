<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('identity_documents', function (Blueprint $table) {
            $table->string('scan_status')->default('pending');
            $table->boolean('malware_clear')->default(false);
            $table->json('scan_report')->nullable();
            $table->timestamp('scanned_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('identity_documents', function (Blueprint $table) {
            $table->dropColumn(['scan_status', 'malware_clear', 'scan_report', 'scanned_at']);
        });
    }
};
