<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class StrongPassword implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Minimum 8 characters
        if (strlen($value) < 8) {
            $fail('Password harus minimal 8 karakter.');
            return;
        }

        // Must contain at least one uppercase letter
        if (!preg_match('/[A-Z]/', $value)) {
            $fail('Password harus mengandung minimal satu huruf besar.');
            return;
        }

        // Must contain at least one lowercase letter
        if (!preg_match('/[a-z]/', $value)) {
            $fail('Password harus mengandung minimal satu huruf kecil.');
            return;
        }

        // Must contain at least one number
        if (!preg_match('/[0-9]/', $value)) {
            $fail('Password harus mengandung minimal satu angka.');
            return;
        }

        // Must contain at least one special character
        if (!preg_match('/[!@#$%^&*(),.?":{}|<>]/', $value)) {
            $fail('Password harus mengandung minimal satu karakter khusus (!@#$%^&*(),.?":{}|<>).');
            return;
        }
    }
}
