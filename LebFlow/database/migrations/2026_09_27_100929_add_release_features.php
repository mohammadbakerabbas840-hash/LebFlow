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
        Schema::create('family_members', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('name');
            $table->text('name_arabic');
            $table->text('dob');
            $table->string('relationship', 30);
            $table->timestamps();
        });
        Schema::table('services', function (Blueprint $table): void {
            $table->unsignedInteger('version')->default(1);
        });
        Schema::table('service_cases', function (Blueprint $table): void {
            $table->dropUnique(['user_id', 'service_id']);
            $table->foreignUuid('family_member_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('case_slot', 60)->default('self');
            $table->timestamp('archived_at')->nullable();
            $table->unsignedInteger('service_version')->default(1);
            $table->unique(['user_id', 'service_id', 'case_slot']);
        });
        Schema::create('case_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('service_case_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('value')->nullable();
            $table->timestamp('created_at');
        });
        Schema::create('service_revisions', function (Blueprint $table): void {
            $table->id();
            $table->string('service_id');
            $table->foreign('service_id')->references('id')->on('services');
            $table->foreignId('author_id')->constrained('users');
            $table->foreignId('reviewer_id')->nullable()->constrained('users');
            $table->unsignedInteger('base_version');
            $table->json('content');
            $table->json('previous_content');
            $table->string('status')->default('draft');
            $table->text('reason');
            $table->timestamps();
        });
        Schema::create('offices', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->json('name');
            $table->json('address');
            $table->json('services');
            $table->string('phone')->nullable();
            $table->string('source_url', 1000);
            $table->date('reviewed_at');
            $table->json('accessibility')->nullable();
            $table->json('hours')->nullable();
            $table->timestamps();
        });
        Schema::create('assistant_feedback', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('service_id')->nullable();
            $table->string('category');
            $table->text('comment')->nullable();
            $table->string('status')->default('open');
            $table->timestamps();
        });
        Schema::create('account_sessions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('session_hash', 64)->unique();
            $table->string('agent', 200);
            $table->timestamp('last_seen_at');
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
        });
        Schema::table('users', function (Blueprint $table): void {
            $table->boolean('is_admin')->default(false);
            $table->text('mfa_secret')->nullable();
            $table->boolean('mfa_confirmed')->default(false);
            $table->text('mfa_recovery')->nullable();
            $table->unsignedBigInteger('mfa_last_step')->default(0);
            $table->boolean('email_reminders')->default(false);
            $table->date('last_digest_at')->nullable();
            $table->unsignedInteger('auth_version')->default(1);
        });
        Schema::table('identity_documents', function (Blueprint $table): void {
            $table->string('review_status')->default('unreviewed');
            $table->string('review_reason', 200)->nullable();
            $table->foreignId('reviewer_id')->nullable()->constrained('users');
            $table->timestamp('reviewed_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        throw new RuntimeException('Release migration is forward-only: restore a tested backup to roll back without losing family cases or audit history.');
    }
};
