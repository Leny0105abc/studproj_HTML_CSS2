<?php

return [
    // Fail closed until an operator verifies the private service's isolation contract.
    'enabled' => env('VBNET_SANDBOX_ENABLED', false),
    'verified' => env('VBNET_SANDBOX_VERIFIED', false),
    'url' => env('VBNET_SANDBOX_URL'),
    'token' => env('VBNET_SANDBOX_TOKEN'),
    'version' => env('VBNET_SANDBOX_VERSION', '10.0'),
];
