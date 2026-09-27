<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->has('email')) {
            $this->merge(['email' => strtolower(trim((string) $this->input('email')))]);
        }
        if ($this->has('name')) {
            $this->merge(['name' => trim((string) $this->input('name'))]);
        }
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['name' => ['sometimes', 'required', 'string', 'min:2', 'max:120'],
            'nameArabic' => ['sometimes', 'required', 'string', 'min:2', 'max:120', "regex:/^[\p{Arabic}\p{M} .’'\-]+$/u"],
            'email' => ['sometimes', 'required', 'email', 'max:254', Rule::unique('users', 'email')->ignore($this->user()->id)], 'dob' => ['sometimes', 'required', 'date_format:Y-m-d', 'before:today', 'after_or_equal:1900-01-01'], 'locale' => ['sometimes', 'in:en,ar,fr']];
    }
}
