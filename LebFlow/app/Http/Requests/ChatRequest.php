<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ChatRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'message' => ['required', 'string', 'min:3', 'max:2000'],
            'history' => ['sometimes', 'array', 'max:6'], 'history.*' => ['array:role,content'], 'history.*.role' => ['required', 'in:user,assistant'], 'history.*.content' => ['required', 'string', 'max:2000'],
            'locale' => ['sometimes', 'in:en,ar,fr'],
            'research' => ['sometimes', 'boolean'],
            'serviceId' => ['sometimes', 'nullable', 'string', 'exists:services,id'],
        ];
    }
}
