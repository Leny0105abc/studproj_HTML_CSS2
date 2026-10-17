<?php

// Development-only fixture server: php -S 127.0.0.1:8016 tests/browser/router.php
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$files = ['/' => __DIR__.'/python-runner.html', '/python-sandbox.html' => __DIR__.'/../../public/python-sandbox.html', '/python-sandbox.js' => __DIR__.'/../../public/python-sandbox.js', '/examples.json' => __DIR__.'/../../database/data/python-course.json'];
if (! isset($files[$path])) {
    http_response_code(404);
    exit;
}
header('Content-Type: '.(str_ends_with($path, '.js') ? 'text/javascript' : (str_ends_with($path, '.json') ? 'application/json' : 'text/html')));
readfile($files[$path]);
