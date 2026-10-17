<?php

return [
    // Only an administrator-controlled isolated service may execute Java.
    // Its API adapter must be verified before enabling this switch.
    'enabled' => env('JAVA_SANDBOX_ENABLED', false),
    'provider' => env('JAVA_SANDBOX_PROVIDER', 'generic'),
    'url' => env('JAVA_SANDBOX_URL'),
    'token' => env('JAVA_SANDBOX_TOKEN'),
];
