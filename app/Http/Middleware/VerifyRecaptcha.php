<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use ReCaptcha\ReCaptcha;

class VerifyRecaptcha
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip reCAPTCHA in local environment if needed
        if (app()->environment('local') && !env('RECAPTCHA_ENABLED', false)) {
            return $next($request);
        }

        $recaptchaToken = $request->input('recaptcha_token');

        if (!$recaptchaToken) {
            return response()->json([
                'success' => false,
                'message' => 'reCAPTCHA token is missing',
                'errors' => ['recaptcha_token' => ['reCAPTCHA verification is required']]
            ], 422);
        }

        $secretKey = env('RECAPTCHA_SECRET_KEY');

        if (!$secretKey) {
            \Log::error('reCAPTCHA secret key is not configured');
            // In production, you might want to fail here, but for now we'll log and continue
            return $next($request);
        }

        try {
            $recaptcha = new ReCaptcha($secretKey);
            $response = $recaptcha
                ->setExpectedHostname($request->getHost())
                ->verify($recaptchaToken, $request->ip());

            if (!$response->isSuccess()) {
                $errors = $response->getErrorCodes();
                \Log::warning('reCAPTCHA verification failed', [
                    'errors' => $errors,
                    'ip' => $request->ip()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'reCAPTCHA verification failed. Please try again.',
                    'errors' => ['recaptcha_token' => ['reCAPTCHA verification failed']]
                ], 422);
            }

            // Optional: Check score for v3 (0.0 to 1.0, higher is better)
            $score = $response->getScore();
            $minScore = env('RECAPTCHA_MIN_SCORE', 0.5);

            if ($score < $minScore) {
                \Log::warning('reCAPTCHA score too low', [
                    'score' => $score,
                    'min_score' => $minScore,
                    'ip' => $request->ip()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Suspicious activity detected. Please try again.',
                    'errors' => ['recaptcha_token' => ['reCAPTCHA score too low']]
                ], 422);
            }

        } catch (\Exception $e) {
            \Log::error('reCAPTCHA verification exception', [
                'error' => $e->getMessage(),
                'ip' => $request->ip()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'reCAPTCHA verification error. Please try again.',
                'errors' => ['recaptcha_token' => ['An error occurred during verification']]
            ], 422);
        }

        return $next($request);
    }
}
