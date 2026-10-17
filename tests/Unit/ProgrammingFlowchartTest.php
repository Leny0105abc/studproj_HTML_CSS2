<?php

use App\Services\ProgrammingExamples;
use App\Services\ProgrammingFlowchart;

test('all thirty graphs validate and produce deterministic complete source with traceable nodes', function () {
    $service = new ProgrammingFlowchart;
    for ($number = 1; $number <= 30; $number++) {
        $graph = ProgrammingExamples::make($number);
        $programs = $service->generate($graph);
        expect($service->generate($graph))->toBe($programs);
        expect($programs['python']['code'])->toContain('def cl_main():');
        expect($programs['cpp']['code'])->toContain('int main()');
        expect($programs['java']['code'])->toContain('public class Main');
        foreach ($programs as $program) {
            expect(count(explode("\n", rtrim($program['code']))))->toBe(count($program['nodes']));
            foreach (array_keys($graph['nodes']) as $id) {
                expect($program['nodes'])->toContain($id);
            }
        }
        expect($service->plan($graph)['pseudocode'])->toContain('START')->toEndWith('END');
    }
});

test('invalid graphs fail closed with clear diagnostics', function (Closure $mutate, string $message) {
    $graph = ProgrammingExamples::make(1);
    $mutate($graph);
    expect(fn () => (new ProgrammingFlowchart)->generate($graph))->toThrow(InvalidArgumentException::class, $message);
})->with([
    'missing start' => [fn (&$g) => $g['start'] = '', 'Missing Start'],
    'missing end' => [fn (&$g) => $g['end'] = '', 'End path'],
    'disconnected' => [fn (&$g) => $g['nodes']['orphan'] = ['kind' => 'connector'], 'Disconnected'],
    'missing edge' => [fn (&$g) => $g['body'][] = 'missing', 'missing node'],
    'arbitrary edge' => [fn (&$g) => $g['nodes']['n1']['next'] = 'n3', 'Unstructured'],
    'cycle' => [fn (&$g) => $g['body'][] = 'n1', 'cycle'],
    'undefined' => [fn (&$g) => $g['nodes']['n3']['value']['left']['name'] = 'unknown', 'Undefined variable'],
    'wrong type' => [fn (&$g) => $g['nodes']['n1']['type'] = 'string', 'numeric operands'],
    'bad name' => [fn (&$g) => $g['nodes']['n1']['name'] = 'a; system()', 'Names must'],
    'unknown expression' => [fn (&$g) => $g['nodes']['n3']['value']['kind'] = 'raw', 'Unsupported expression'],
    'missing loop condition' => [fn (&$g) => $g['nodes']['n3'] = ['kind' => 'while', 'body' => []], 'expression tree'],
    'branch structure' => [fn (&$g) => $g['nodes']['n3'] = ['kind' => 'if', 'condition' => ['kind' => 'literal', 'type' => 'bool', 'value' => true], 'then' => [], 'else' => ['missing']], 'missing node'],
    'function reference' => [fn (&$g) => $g['nodes']['n3']['value'] = ['kind' => 'call', 'name' => 'missing', 'args' => []], 'function reference'],
    'zero divisor' => [fn (&$g) => $g['nodes']['n3']['value'] = ['kind' => 'binary', 'op' => '/', 'left' => ['kind' => 'literal', 'type' => 'int', 'value' => 1], 'right' => ['kind' => 'literal', 'type' => 'int', 'value' => 0]], 'Division by zero'],
]);

test('all supported node kinds occur in authored fixtures and empty blocks are legal', function () {
    $kinds = [];
    for ($i = 1; $i <= 30; $i++) {
        foreach (ProgrammingExamples::make($i)['nodes'] as $n) {
            $kinds[] = $n['kind'];
        }
    }
    foreach (['input', 'declare', 'assign', 'output', 'if', 'select', 'while', 'for', 'do', 'return', 'array_set'] as $kind) {
        expect($kinds)->toContain($kind);
    }
    $g = ['version' => 1, 'start' => 'start', 'end' => 'end', 'nodes' => ['join' => ['kind' => 'connector']], 'body' => ['join'], 'functions' => []];
    expect((new ProgrammingFlowchart)->generate($g)['python']['code'])->toContain('# Connector join');
    $g['nodes'] = [];
    $g['body'] = [];
    expect((new ProgrammingFlowchart)->generate($g)['python']['code'])->toContain('    pass');
});

test('static bounds malformed graphs and unsupported function control flow are rejected', function () {
    $p = new ProgrammingExamples;
    $graph = $p->graph([$p->declare('values', $p->array([]), 'int[]'), $p->out($p->index('values', $p->lit(0)))]);
    expect(fn () => (new ProgrammingFlowchart)->generate($graph))->toThrow(InvalidArgumentException::class, 'array index');
    $graph = ProgrammingExamples::make(14);
    $graph['functions'][0]['params'] = 'raw text';
    expect(fn () => (new ProgrammingFlowchart)->generate($graph))->toThrow(InvalidArgumentException::class, 'signature');
    $graph = ProgrammingExamples::make(1);
    $graph['edges'] = [['from' => 'start', 'to' => 'end']];
    expect(fn () => (new ProgrammingFlowchart)->generate($graph))->toThrow(InvalidArgumentException::class, 'Unsupported graph');
});
