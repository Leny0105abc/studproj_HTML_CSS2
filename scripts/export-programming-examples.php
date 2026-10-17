<?php

use App\Services\ProgrammingExamples;
use App\Services\ProgrammingFlowchart;

// Trusted authored fixtures only. Does not connect to the application database.
require __DIR__.'/../vendor/autoload.php';
$flowchart = new ProgrammingFlowchart;
$lessons = json_decode(file_get_contents(__DIR__.'/../database/data/programming-course.json'), true, flags: JSON_THROW_ON_ERROR);
if (in_array('--edges', $argv, true)) {
    $lessons = require __DIR__.'/../resources/programming/edge-cases.php';
}
foreach ($lessons as &$lesson) {
    $lesson['graph'] ??= ProgrammingExamples::make($lesson['number']);
    $lesson['programs'] = $flowchart->generate($lesson['graph']);
    $lesson['plan'] = $flowchart->plan($lesson['graph']);
}
unset($lesson);
echo json_encode($lessons, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT);
