<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['savedServices' => ['sometimes', 'array', 'max:100'], 'savedServices.*' => ['string', 'distinct', 'exists:services,id'], 'readNotifications' => ['sometimes', 'array', 'max:500'], 'readNotifications.*' => ['string', 'distinct', 'max:160'], 'appointmentAlerts' => ['sometimes', 'boolean'], 'expiryAlerts' => ['sometimes', 'boolean'], 'incompleteAlerts' => ['sometimes', 'boolean'], 'updateAlerts' => ['sometimes', 'boolean']];
    }
}
