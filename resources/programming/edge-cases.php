<?php

use App\Services\ProgrammingExamples;

$build = function (callable $body): array {
    $p = new ProgrammingExamples;

    return $p->graph($body($p));
};
$case = fn ($number, $graph, $tests) => ['number' => $number, 'graph' => $graph, 'tests' => $tests];
$ok = fn ($input, $expected) => ['name' => 'edge', 'input' => $input, 'expected' => $expected];
$error = fn ($input) => ['name' => 'expected error', 'input' => $input, 'error' => true];

return [
    $case('descending-range', $build(fn ($p) => [$p->loop('i', $p->lit(5), $p->lit(0), [$p->out($p->ref('i'))], -2)]), [$ok('', "5\n3\n1\n")]),
    $case('empty-array', $build(function ($p) {
        $p->fn('mean', [['name' => 'values', 'type' => 'real[]']], 'real', [$p->branch($p->op($p->length('values'), '==', $p->lit(0)), [$p->ret($p->lit(0.0))]), $p->ret($p->lit(1.0))]);

        return [$p->declare('values', $p->array([], 'real[]'), 'real[]'), $p->loop('i', $p->lit(0), $p->length('values'), [$p->out($p->lit('Should not appear'))]), $p->out($p->call('mean', [$p->ref('values')]))];
    }), [$ok('', "0.000000\n")]),
    $case('array-arguments-copy', $build(function ($p) {
        $p->fn('replace_first', [['name' => 'values', 'type' => 'int[]']], 'int', [$p->arraySet('values', $p->lit(0), $p->lit(99)), $p->ret($p->index('values', $p->lit(0)))]);

        return [$p->declare('values', $p->array([5, 7]), 'int[]'), $p->out($p->call('replace_first', [$p->ref('values')])), $p->out($p->index('values', $p->lit(0)))];
    }), [$ok('', "99\n5\n")]),
    $case('typed-real-and-boolean', $build(fn ($p) => [$p->declare('real_number', $p->lit(2), 'real'), $p->set('real_number', $p->lit(3)), $p->out($p->op($p->ref('real_number'), '/', $p->lit(2))), $p->out($p->op($p->lit(true), 'and', $p->lit(false))), $p->out($p->op($p->lit(1), '==', $p->lit(1.0))), $p->out($p->op($p->lit('A'), '!=', $p->lit('B')))]), [$ok('', "1.500000\nfalse\ntrue\ntrue\n")]),
    $case('text-input-whitespace', $build(fn ($p) => [$p->input('name', 'string'), $p->out($p->ref('name'))]), [$ok(" a b \n", " a b \n"), $ok("\n", "\n")]),
    $case('decimal-rounding', $build(fn ($p) => [$p->input('number', 'real'), $p->out($p->ref('number'))]), [$ok("1.2345665\n", "1.234567\n"), $ok("-1.2345665\n", "-1.234567\n"), $ok("-0.0000001\n", "0.000000\n"), $error("NaN\n"), $error("Infinity\n"), $error("\n")]),
    $case('integer-input-and-overflow', ProgrammingExamples::make(1), [$error("\n2\n"), $error("abc\n2\n"), $error("2147483648\n0\n"), $error("2147483647\n1\n"), $error('')]),
    $case('dynamic-zero-divisor', ProgrammingExamples::make(5), [$error("1\n0\n"), $ok("-7\n-3\n", "2.333333\n2\n")]),
    $case('dynamic-array-bounds', $build(fn ($p) => [$p->declare('values', $p->array([5, 7]), 'int[]'), $p->input('index'), $p->out($p->index('values', $p->ref('index')))]), [$error("-1\n"), $error("2\n"), $ok("1\n", "7\n")]),
    $case('connector-only', $build(fn ($p) => [$p->node('connector', [], 'Join')]), [$ok('', '')]),
];
