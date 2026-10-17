<?php

namespace App\Services;

/** Authoring helpers produce the same public structured graph students edit. */
class ProgrammingExamples
{
    private array $nodes = [];

    private array $functions = [];

    private int $serial = 0;

    public function lit(mixed $v, ?string $type = null): array
    {
        return ['kind' => 'literal', 'type' => $type ?? (is_int($v) ? 'int' : (is_float($v) ? 'real' : (is_bool($v) ? 'bool' : 'string'))), 'value' => $v];
    }

    public function ref(string $name): array
    {
        return ['kind' => 'ref', 'name' => $name];
    }

    public function op(array $a, string $op, array $b): array
    {
        return ['kind' => 'binary', 'left' => $a, 'op' => $op, 'right' => $b];
    }

    public function node(string $kind, array $config, string $label): string
    {
        $id = 'n'.(++$this->serial);
        $this->nodes[$id] = ['kind' => $kind, 'label' => $label] + $config;

        return $id;
    }

    public function input(string $name, string $type = 'int', bool $update = false): string
    {
        return $this->node('input', compact('name', 'type', 'update') + ['prompt' => ''], 'Input '.$name);
    }

    public function declare(string $name, array $value, string $type = 'int'): string
    {
        return $this->node('declare', compact('name', 'value', 'type'), 'Initialize '.$name);
    }

    public function set(string $name, array $value): string
    {
        return $this->node('assign', compact('name', 'value'), 'Update '.$name);
    }

    public function out(array $value, string $label = 'Display result'): string
    {
        return $this->node('output', compact('value'), $label);
    }

    public function branch(array $condition, array $then, array $else = [], string $label = 'Condition?'): string
    {
        return $this->node('if', compact('condition', 'then', 'else'), $label);
    }

    public function loop(string $counter, array $from, array $to, array $body, int $step = 1): string
    {
        return $this->node('for', compact('counter', 'from', 'to', 'body', 'step'), 'For '.$counter.' (end excluded)');
    }

    public function repeat(string $kind, array $condition, array $body): string
    {
        return $this->node($kind, compact('condition', 'body'), $kind === 'do' ? 'Repeat, then test' : 'While condition is true');
    }

    public function array(array $items, string $type = 'int[]'): array
    {
        return ['kind' => 'array', 'type' => $type, 'items' => array_map($this->lit(...), $items)];
    }

    public function index(string $name, array $index): array
    {
        return ['kind' => 'index', 'array' => $this->ref($name), 'index' => $index];
    }

    public function length(string $name): array
    {
        return ['kind' => 'length', 'array' => $this->ref($name)];
    }

    public function arraySet(string $name, array $index, array $value): string
    {
        return $this->node('array_set', compact('name', 'index', 'value'), 'Update '.$name.' element');
    }

    public function ret(array $value): string
    {
        return $this->node('return', compact('value'), 'Return result');
    }

    public function fn(string $name, array $params, string $returns, array $body): void
    {
        $this->functions[] = compact('name', 'params', 'returns', 'body');
    }

    public function call(string $name, array $args): array
    {
        return ['kind' => 'call', 'name' => $name, 'args' => $args];
    }

    public function graph(array $body): array
    {
        return ['version' => 1, 'start' => 'start', 'end' => 'end', 'body' => $body, 'nodes' => $this->nodes, 'functions' => $this->functions];
    }

    public static function make(int $lesson): array
    {
        $p = new self;
        $r = $p->ref(...);
        $l = $p->lit(...);
        $op = $p->op(...);
        $body = match ($lesson) {
            1 => [$p->input('a'), $p->input('b'), $p->declare('total', $op($r('a'), '+', $r('b'))), $p->out($r('total'), 'Display sum')],
            2 => [$p->input('width', 'real'), $p->input('height', 'real'), $p->declare('area', $op($r('width'), '*', $r('height')), 'real'), $p->out($r('area'), 'Display rectangle area')],
            3 => [$p->declare('unit_price', $l(12.5), 'real'), $p->input('quantity'), $p->declare('cost', $op($r('unit_price'), '*', $r('quantity')), 'real'), $p->out($r('cost'))],
            4 => [$p->input('name', 'string'), $p->input('age'), $p->out($r('name'), 'Display name'), $p->out($r('age'), 'Display age')],
            5 => [$p->input('a'), $p->input('b'), $p->out($op($r('a'), '/', $r('b')), 'Display decimal quotient'), $p->out($op($r('a'), '%', $r('b')), 'Display nonnegative remainder')],
            6 => [$p->input('celsius', 'real'), $p->declare('fahrenheit', $op($op($op($r('celsius'), '*', $l(9)), '/', $l(5)), '+', $l(32)), 'real'), $p->out($r('fahrenheit'))],
            7 => [$p->input('number'), $p->branch($op($op($r('number'), '%', $l(2)), '==', $l(0)), [$p->out($l('Even'))], [$p->out($l('Odd'))], 'number mod 2 = 0?')],
            8 => [$p->input('day'), $p->node('select', ['value' => $r('day'), 'cases' => array_map(fn ($i, $name) => ['value' => $l($i), 'body' => [$p->out($l($name))]], range(1, 7), ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']), 'default' => [$p->out($l('Invalid day'))]], 'Select day 1 to 7')],
            9 => [$p->input('n'), $p->declare('i', $l(1)), $p->declare('total', $l(0)), $p->repeat('while', $op($r('i'), '<=', $r('n')), [$p->set('total', $op($r('total'), '+', $r('i'))), $p->set('i', $op($r('i'), '+', $l(1)))]), $p->out($r('total'))],
            10 => $p->gradeEvaluation(),
            11 => [$p->input('n'), $p->declare('total', $l(0)), $p->loop('i', $l(1), $op($r('n'), '+', $l(1)), [$p->set('total', $op($r('total'), '+', $r('i')))]), $p->out($r('total'))],
            12 => [$p->declare('number', $l(0)), $p->declare('total', $l(0)), $p->repeat('do', $op($r('number'), '!=', $l(0)), [$p->input('number', 'int', true), $p->set('total', $op($r('total'), '+', $r('number')))]), $p->out($r('total'))],
            13 => [$p->input('size'), $p->loop('row', $l(1), $op($r('size'), '+', $l(1)), [$p->loop('column', $l(1), $op($r('size'), '+', $l(1)), [$p->out($op($r('row'), '*', $r('column')), 'Display table cell')])])],
            14 => $p->functionArea(),
            15 => [$p->declare('scores', $p->array([70, 80, 90]), 'int[]'), $p->input('replacement'), $p->arraySet('scores', $l(0), $r('replacement')), $p->loop('i', $l(0), $p->length('scores'), [$p->out($p->index('scores', $r('i')))])],
            16 => $p->statistics(),
            17 => [$p->input('grade'), $p->repeat('while', $op($op($r('grade'), '<', $l(0)), 'or', $op($r('grade'), '>', $l(100))), [$p->out($l('Invalid grade')), $p->input('grade', 'int', true)]), $p->branch($op($r('grade'), '>=', $l(75)), [$p->out($l('Pass'))], [$p->out($l('Fail'))], 'grade >= 75?')],
            18, 20 => $p->gradeManagement($lesson === 20),
            19 => [$p->input('n'), $p->declare('count', $l(0)), $p->loop('i', $l(0), $r('n'), [$p->set('count', $op($r('count'), '+', $l(1)))]), $p->out($r('count'), 'Display exact iteration count')],
            21 => $p->discount(),
            22 => [$p->input('grade'), $p->input('attendance'), $p->branch($op($op($r('grade'), '>=', $l(90)), 'and', $op($r('attendance'), '>=', $l(95))), [$p->out($l('Honors'))], [$p->branch($op($r('grade'), '>=', $l(75)), [$p->out($l('Pass'))], [$p->out($l('Fail'))])], 'Honor policy satisfied?')],
            23 => [$p->declare('number', $l(0)), $p->declare('positive_count', $l(0)), $p->repeat('do', $op($r('number'), '!=', $l(0)), [$p->input('number', 'int', true), $p->branch($op($r('number'), '>', $l(0)), [$p->set('positive_count', $op($r('positive_count'), '+', $l(1)))])]), $p->out($r('positive_count'))],
            24 => [$p->input('rows'), $p->loop('row', $l(1), $op($r('rows'), '+', $l(1)), [$p->loop('column', $l(0), $r('row'), [$p->out($l('*'), 'Display star token')]), $p->out($l('|'), 'Mark end of row')])],
            25 => $p->weightedGrade(),
            26 => $p->sort(),
            27 => $p->menu(),
            28 => [$p->input('limit'), $p->declare('total', $l(0)), $p->loop('i', $l(1), $op($r('limit'), '+', $l(1)), [$p->branch($op($op($r('i'), '%', $l(2)), '==', $l(0)), [$p->set('total', $op($r('total'), '+', $r('i')))])]), $p->out($r('total'))],
            29 => [$p->input('a'), $p->input('b'), $p->declare('average', $op($op($r('a'), '+', $r('b')), '/', $l(2)), 'real'), $p->out($r('average'))],
            30 => $p->records(),
        };

        return ['version' => 1, 'start' => 'start', 'end' => 'end', 'body' => $body, 'nodes' => $p->nodes, 'functions' => $p->functions];
    }

    private function gradeEvaluation(): array
    {
        $a = $this->ref('a');
        $b = $this->ref('b');
        $c = $this->ref('c');
        $valid = $this->lit(true);
        foreach ([$a, $b, $c] as $v) {
            $valid = $this->op($valid, 'and', $this->op($this->op($v, '>=', $this->lit(0)), 'and', $this->op($v, '<=', $this->lit(100))));
        }

        return [$this->input('a', 'real'), $this->input('b', 'real'), $this->input('c', 'real'), $this->branch($valid, [
            $this->declare('average', $this->op($this->op($this->op($a, '+', $b), '+', $c), '/', $this->lit(3)), 'real'),
            $this->out($this->ref('average')), $this->branch($this->op($this->ref('average'), '>=', $this->lit(75)), [$this->out($this->lit('Pass'))], [$this->out($this->lit('Fail'))]),
        ], [$this->out($this->lit('Invalid grade'))], 'All grades from 0 to 100?')];
    }

    private function functionArea(): array
    {
        $this->fn('area', [['name' => 'width', 'type' => 'real'], ['name' => 'height', 'type' => 'real']], 'real', [$this->ret($this->op($this->ref('width'), '*', $this->ref('height')))]);

        return [$this->input('width', 'real'), $this->input('height', 'real'), $this->out($this->call('area', [$this->ref('width'), $this->ref('height')]), 'Call area and display return value')];
    }

    private function statistics(): array
    {
        return [$this->declare('scores', $this->array([70, 85, 60, 95]), 'int[]'), $this->input('replacement'), $this->arraySet('scores', $this->lit(0), $this->ref('replacement')), $this->declare('minimum', $this->index('scores', $this->lit(0))), $this->declare('maximum', $this->index('scores', $this->lit(0))), $this->declare('total', $this->lit(0)), $this->loop('i', $this->lit(0), $this->length('scores'), [
            $this->declare('score', $this->index('scores', $this->ref('i'))), $this->set('total', $this->op($this->ref('total'), '+', $this->ref('score'))),
            $this->branch($this->op($this->ref('score'), '<', $this->ref('minimum')), [$this->set('minimum', $this->ref('score'))]),
            $this->branch($this->op($this->ref('score'), '>', $this->ref('maximum')), [$this->set('maximum', $this->ref('score'))]),
        ]), $this->out($this->ref('minimum')), $this->out($this->ref('maximum')), $this->out($this->op($this->ref('total'), '/', $this->length('scores')))];
    }

    private function meanFunction(): void
    {
        $this->fn('mean', [['name' => 'values', 'type' => 'real[]']], 'real', [
            $this->branch($this->op($this->length('values'), '==', $this->lit(0)), [$this->ret($this->lit(0.0))]),
            $this->declare('total', $this->lit(0.0), 'real'), $this->loop('i', $this->lit(0), $this->length('values'), [$this->set('total', $this->op($this->ref('total'), '+', $this->index('values', $this->ref('i'))))]),
            $this->ret($this->op($this->ref('total'), '/', $this->length('values'))),
        ]);
    }

    private function gradeManagement(bool $project): array
    {
        $this->meanFunction();
        $body = [$this->declare('grades', $this->array([0.0, 0.0, 0.0], 'real[]'), 'real[]'), $this->loop('i', $this->lit(0), $this->length('grades'), [
            $this->input('grade', 'real'), $this->repeat('while', $this->op($this->op($this->ref('grade'), '<', $this->lit(0)), 'or', $this->op($this->ref('grade'), '>', $this->lit(100))), [$this->out($this->lit('Invalid grade')), $this->input('grade', 'real', true)]),
            $this->arraySet('grades', $this->ref('i'), $this->ref('grade')),
        ]), $this->declare('average', $this->call('mean', [$this->ref('grades')]), 'real'), $this->out($this->ref('average'))];
        if ($project) {
            $body[] = $this->loop('j', $this->lit(0), $this->length('grades'), [$this->branch($this->op($this->index('grades', $this->ref('j')), '>=', $this->lit(75)), [$this->out($this->lit('Pass'))], [$this->out($this->lit('Fail'))])]);
        }

        return $body;
    }

    private function discount(): array
    {
        $this->fn('discount', [['name' => 'amount', 'type' => 'real']], 'real', [$this->branch($this->op($this->ref('amount'), '>=', $this->lit(1000)), [$this->ret($this->op($this->ref('amount'), '*', $this->lit(0.9)))]), $this->ret($this->ref('amount'))]);

        return [$this->input('price', 'real'), $this->input('quantity'), $this->declare('subtotal', $this->op($this->ref('price'), '*', $this->ref('quantity')), 'real'), $this->out($this->call('discount', [$this->ref('subtotal')]))];
    }

    private function weightedGrade(): array
    {
        $this->fn('weighted', [['name' => 'exam', 'type' => 'real'], ['name' => 'project', 'type' => 'real'], ['name' => 'exam_weight', 'type' => 'real']], 'real', [$this->ret($this->op($this->op($this->ref('exam'), '*', $this->ref('exam_weight')), '+', $this->op($this->ref('project'), '*', $this->op($this->lit(1), '-', $this->ref('exam_weight')))))]);

        return [$this->input('exam', 'real'), $this->input('project', 'real'), $this->out($this->call('weighted', [$this->ref('exam'), $this->ref('project'), $this->lit(0.6)]))];
    }

    private function sort(): array
    {
        $a = $this->index('values', $this->ref('j'));
        $b = $this->index('values', $this->op($this->ref('j'), '+', $this->lit(1)));

        return [$this->declare('values', $this->array([9, 2, 7, 2]), 'int[]'), $this->input('replacement'), $this->arraySet('values', $this->lit(0), $this->ref('replacement')), $this->loop('pass', $this->lit(0), $this->length('values'), [$this->loop('j', $this->lit(0), $this->op($this->length('values'), '-', $this->lit(1)), [$this->branch($this->op($a, '>', $b), [$this->declare('temporary', $a), $this->arraySet('values', $this->ref('j'), $b), $this->arraySet('values', $this->op($this->ref('j'), '+', $this->lit(1)), $this->ref('temporary'))])])]), $this->loop('i', $this->lit(0), $this->length('values'), [$this->out($this->index('values', $this->ref('i')))])];
    }

    private function menu(): array
    {
        $this->meanFunction();

        return [$this->declare('grades', $this->array([80.0, 90.0], 'real[]'), 'real[]'), $this->declare('choice', $this->lit(0)), $this->repeat('do', $this->op($this->ref('choice'), '!=', $this->lit(0)), [$this->input('choice', 'int', true), $this->node('select', ['value' => $this->ref('choice'), 'cases' => [
            ['value' => $this->lit(1), 'body' => [$this->out($this->call('mean', [$this->ref('grades')]))]],
            ['value' => $this->lit(2), 'body' => [$this->out($this->length('grades'))]],
            ['value' => $this->lit(0), 'body' => [$this->out($this->lit('Goodbye'))]],
        ], 'default' => [$this->out($this->lit('Invalid option'))]], 'Menu: 1 mean, 2 count, 0 exit')])];
    }

    private function records(): array
    {
        $this->meanFunction();
        $find = [$this->input('query', 'string'), $this->declare('found', $this->lit(-1)), $this->loop('i', $this->lit(0), $this->length('names'), [$this->branch($this->op($this->index('names', $this->ref('i')), '==', $this->ref('query')), [$this->set('found', $this->ref('i'))])]), $this->branch($this->op($this->ref('found'), '>=', $this->lit(0)), [$this->out($this->index('grades', $this->ref('found')))], [$this->out($this->lit('Not found'))])];
        $update = [$this->input('index'), $this->input('grade', 'real'), $this->branch($this->op($this->op($this->op($this->ref('index'), '>=', $this->lit(0)), 'and', $this->op($this->ref('index'), '<', $this->length('grades'))), 'and', $this->op($this->op($this->ref('grade'), '>=', $this->lit(0)), 'and', $this->op($this->ref('grade'), '<=', $this->lit(100)))), [$this->arraySet('grades', $this->ref('index'), $this->ref('grade')), $this->out($this->lit('Updated'))], [$this->out($this->lit('Invalid update'))])];
        $report = [$this->loop('i', $this->lit(0), $this->length('names'), [$this->out($this->index('names', $this->ref('i'))), $this->out($this->index('grades', $this->ref('i'))), $this->branch($this->op($this->index('grades', $this->ref('i')), '>=', $this->lit(75)), [$this->out($this->lit('Pass'))], [$this->out($this->lit('Fail'))])]), $this->out($this->call('mean', [$this->ref('grades')]))];

        return [$this->declare('names', $this->array(['', ''], 'string[]'), 'string[]'), $this->declare('grades', $this->array([0.0, 0.0], 'real[]'), 'real[]'), $this->loop('student', $this->lit(0), $this->length('names'), [$this->input('name', 'string'), $this->input('score', 'real'), $this->repeat('while', $this->op($this->op($this->ref('score'), '<', $this->lit(0)), 'or', $this->op($this->ref('score'), '>', $this->lit(100))), [$this->out($this->lit('Invalid grade')), $this->input('score', 'real', true)]), $this->arraySet('names', $this->ref('student'), $this->ref('name')), $this->arraySet('grades', $this->ref('student'), $this->ref('score'))]), $this->declare('choice', $this->lit(0)), $this->repeat('do', $this->op($this->ref('choice'), '!=', $this->lit(0)), [$this->input('choice', 'int', true), $this->node('select', ['value' => $this->ref('choice'), 'cases' => [
            ['value' => $this->lit(1), 'body' => $find], ['value' => $this->lit(2), 'body' => $update], ['value' => $this->lit(3), 'body' => $report], ['value' => $this->lit(0), 'body' => [$this->out($this->lit('Goodbye'))]],
        ], 'default' => [$this->out($this->lit('Invalid option'))]], 'Menu: 1 search, 2 update, 3 report, 0 exit')])];
    }
}
