<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Ilovepdf\CompressTask;

class PdfCompressionController extends Controller
{
    public function compress(Request $request)
    {
        // Increase execution time for large PDFs
        set_time_limit(300); // 5 minutes
        
        Log::info('PDF Compression Request Received', [
            'has_file' => $request->hasFile('pdf'),
            'level' => $request->input('level'),
            'file_size' => $request->hasFile('pdf') ? $request->file('pdf')->getSize() : null
        ]);

        try {
            $request->validate([
                'pdf' => 'required|file|mimes:pdf|max:51200', // Max 50MB
                'level' => 'required|in:light,medium,strong'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed', ['errors' => $e->errors()]);
            return response()->json([
                'error' => 'Validation failed',
                'details' => $e->errors()
            ], 422);
        }

        try {
            $file = $request->file('pdf');
            $level = $request->input('level');
            $originalSize = $file->getSize();
            
            // Get iLovePDF API keys from .env
            $publicKey = env('ILOVEPDF_PUBLIC_KEY');
            $secretKey = env('ILOVEPDF_SECRET_KEY');
            
            if (!$publicKey || !$secretKey) {
                return response()->json([
                    'error' => 'iLovePDF API keys not configured. Please add ILOVEPDF_PUBLIC_KEY and ILOVEPDF_SECRET_KEY to .env file.'
                ], 500);
            }
            
            // Create temp directory if not exists
            if (!file_exists(storage_path('app/temp'))) {
                mkdir(storage_path('app/temp'), 0755, true);
            }
            
            // Save uploaded file with .pdf extension
            $tempFileName = 'upload_' . time() . '_' . uniqid() . '.pdf';
            $tempFilePath = storage_path('app/temp/' . $tempFileName);
            $file->move(storage_path('app/temp'), $tempFileName);
            
            // Create compress task
            $compressTask = new CompressTask($publicKey, $secretKey);
            
            // Map compression levels to iLovePDF compression levels
            // iLovePDF levels: 'low' (less compression), 'recommended', 'extreme'
            $ilovepdfLevel = match($level) {
                'light' => 'low',
                'medium' => 'recommended',
                'strong' => 'extreme',
                default => 'recommended'
            };
            
            // Set compression level
            $compressTask->setCompressionLevel($ilovepdfLevel);
            
            // Upload file
            $compressTask->addFile($tempFilePath);
            
            // Process compression
            $compressTask->execute();
            
            // Download compressed file
            $downloadPath = storage_path('app/temp');
            $compressTask->download($downloadPath);
            
            // Get the downloaded file name (from the task's outputFileName property)
            $downloadedFileName = $compressTask->outputFileName;
            $outputFilename = $downloadPath . '/' . $downloadedFileName;
            
            if (!file_exists($outputFilename)) {
                throw new \Exception('Compressed file not found at: ' . $outputFilename);
            }
            
            $compressedSize = filesize($outputFilename);
            $reduction = (($originalSize - $compressedSize) / $originalSize) * 100;
            
            // Read compressed file
            $compressedContent = file_get_contents($outputFilename);
            
            // Clean up
            @unlink($tempFilePath);
            @unlink($outputFilename);
            
            Log::info('PDF Compression Successful', [
                'original_size' => $originalSize,
                'compressed_size' => $compressedSize,
                'reduction' => round($reduction, 1)
            ]);
            
            return response()->json([
                'success' => true,
                'original_size' => $originalSize,
                'compressed_size' => $compressedSize,
                'reduction_percentage' => round($reduction, 1),
                'compressed_pdf' => base64_encode($compressedContent),
                'original_filename' => $file->getClientOriginalName()
            ]);
            
        } catch (\Exception $e) {
            Log::error('PDF Compression Error: ' . $e->getMessage());
            
            return response()->json([
                'error' => 'Failed to compress PDF: ' . $e->getMessage()
            ], 500);
        }
    }
}
