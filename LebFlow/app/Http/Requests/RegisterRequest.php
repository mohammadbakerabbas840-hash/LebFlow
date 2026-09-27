<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['email' => strtolower(trim((string) $this->input('email'))), 'name' => trim((string) $this->input('name'))]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:120', "regex:/^[\p{Latin}\p{M} .’'\-]+$/u"],
            'nameArabic' => ['required', 'string', 'min:2', 'max:120', "regex:/^[\p{Arabic}\p{M} .’'\-]+$/u"],
            'email' => ['required', 'email', 'max:254', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(12)], 'dob' => ['required', 'date_format:Y-m-d', 'before:today', 'after_or_equal:1900-01-01'],
            'idNumber' => ['nullable', 'string', 'min:3', 'max:30'], 'locale' => ['sometimes', 'in:en,ar,fr'], 'consent' => ['accepted'],
            'idPhoto' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'extract' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ];
    }
}
