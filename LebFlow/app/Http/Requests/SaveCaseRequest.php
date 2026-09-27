<?php

namespace App\Http\Requests;

use App\Models\Service;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class SaveCaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        if ($this->route('case')) {
            $this->user()->cases()->findOrFail($this->route('case'));
        }

        return true;
    }

    public function rules(): array
    {
        return [
            'familyMemberId' => [$this->isMethod('post') ? 'nullable' : 'prohibited', 'uuid', Rule::exists('family_members', 'id')->where('user_id', $this->user()->id)],
            'serviceId' => [$this->isMethod('post') ? 'required' : 'prohibited', 'string', 'exists:services,id'],
            'kind' => ['sometimes', 'in:application,renewal'], 'stage' => ['sometimes', 'in:Preparing documents,Ready to submit,Appointment,Submitted,Processing,Completed'],
            'documents' => ['sometimes', 'array', 'max:30'], 'documents.*' => ['string', 'distinct', 'max:80'],
            'notApplicable' => ['sometimes', 'array', 'max:30'], 'notApplicable.*' => ['string', 'distinct', 'max:80'],
            'due' => ['sometimes', 'nullable', 'date_format:Y-m-d'], 'expiresOn' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'appointment' => ['sometimes', 'nullable', 'array:date,time,mode,branchId,reference'],
            'appointment.date' => ['required_with:appointment', 'date_format:Y-m-d'], 'appointment.time' => ['required_with:appointment', 'date_format:H:i'],
            'appointment.mode' => ['sometimes', 'in:demo'], 'appointment.branchId' => ['required_if:appointment.mode,demo', 'in:demo-beirut,demo-north,demo-south'], 'appointment.reference' => ['sometimes', 'string', 'max:64'],
            'passportAnswers' => ['sometimes', 'array:route,ageBand,hasPrevious'], 'passportAnswers.route' => ['required_with:passportAnswers', 'in:application,renewal'],
            'passportAnswers.ageBand' => ['required_with:passportAnswers', 'in:adult,minor'], 'passportAnswers.hasPrevious' => ['required_with:passportAnswers', 'in:yes,no'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }
            $existing = $this->route('case') ? $this->user()->cases()->findOrFail($this->route('case')) : null;
            $service = Service::findOrFail($existing?->service_id ?? $this->input('serviceId'));
            $kind = $this->input('kind', $existing?->payload['kind'] ?? 'application');
            if ($kind === 'renewal' && ! isset($service->content['renewal'])) {
                $validator->errors()->add('kind', 'This service has no renewal route.');
            }
            $allowed = collect($service->content['documents'])->filter(fn ($d): bool => (! ($d['renewalOnly'] ?? false) || $kind === 'renewal') && (! ($d['applicationOnly'] ?? false) || $kind === 'application'))->pluck('id')->all();
            foreach (['documents' => $allowed, 'notApplicable' => $service->conditional_documents] as $field => $valid) {
                if (array_diff($this->input($field, []), $valid)) {
                    $validator->errors()->add($field, 'One or more documents do not belong to this checklist.');
                }
            }
            $answers = $this->input('passportAnswers', $existing?->payload['passportAnswers'] ?? null);
            if ($answers && ($service->id !== 'passport' || $answers['route'] !== $kind || ($kind === 'renewal' && $answers['hasPrevious'] === 'no'))) {
                $validator->errors()->add('passportAnswers', 'This route needs separate authority guidance.');
            }
            if ($this->input('appointment')) {
                $date = Carbon::createFromFormat('!Y-m-d H:i', $this->input('appointment.date').' '.$this->input('appointment.time'), 'Asia/Beirut');
                if ($date->isPast()) {
                    $validator->errors()->add('appointment', 'Choose a future date and time in Beirut.');
                }
                if ($this->input('appointment.mode') === 'demo' && ($date->isSunday() || ! in_array($date->format('H:i'), ['09:00', '10:30', '12:00', '14:00'], true))) {
                    $validator->errors()->add('appointment', 'The demo slot is unavailable.');
                }
            }
        }];
    }
}
