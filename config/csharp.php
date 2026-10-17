<?php

return [
    // Fail closed until an operator verifies the private service's isolation contract.
    'enabled' => env('CSHARP_SANDBOX_ENABLED', false),
    'verified' => env('CSHARP_SANDBOX_VERIFIED', false),
    'url' => env('CSHARP_SANDBOX_URL'),
    'token' => env('CSHARP_SANDBOX_TOKEN'),
    'version' => env('CSHARP_SANDBOX_VERSION', '10.0'),
];
