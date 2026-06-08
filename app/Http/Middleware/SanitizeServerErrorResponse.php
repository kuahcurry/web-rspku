<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeServerErrorResponse
{
    /**
     * Remove sensitive exception details from 5xx JSON responses.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! $response instanceof JsonResponse) {
            return $response;
        }

        if ($response->getStatusCode() < 500) {
            return $response;
        }

        $data = $response->getData(true);
        if (! is_array($data)) {
            $data = [];
        }

        unset($data['error'], $data['exception'], $data['trace'], $data['file'], $data['line']);

        $data['success'] = false;
        $data['message'] = 'Internal server error';

        $response->setData($data);

        return $response;
    }
}