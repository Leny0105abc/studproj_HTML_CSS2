<?php

namespace App\Services;

use InvalidArgumentException;

/** Structured graph: blocks contain ordered node IDs; branch/loop blocks are explicit edges.
 * Labels are presentation only. Expressions are typed trees, never executable text.
 */
class ProgrammingFlowchart
{
    private array $nodes = [];

    private array $seen = [];

    private array $functions = [];

    private array $types = [];

    private array $maps = [];

    private string $language;

    private array $lines = [];

    private function fail(string $message): never
    {
        throw new InvalidArgumentException($message);
    }

    private function name(mixed $name): string
    {
        // Prefixing generated identifiers prevents collisions with runtime and language keywords.
        if (! is_string($name) || ! preg_match('/^[a-z][a-z0-9_]{0,39}$/D', $name)) {
            $this->fail('Names must begin with a lowercase letter and contain only lowercase letters, digits, and underscores.');
        }

        return $name;
    }

    private function type(mixed $type): string
    {
        if (! in_array($type, ['int', 'real', 'bool', 'string', 'int[]', 'real[]', 'string[]'], true)) {
            $this->fail('Unsupported type. Use int, real, bool, string, int[], real[], or string[].');
        }

        return $type;
    }

    private function compatible(string $target, string $source): void
    {
        if ($target !== $source && ! ($target === 'real' && $source === 'int')) {
            $this->fail("Type mismatch: cannot assign {$source} to {$target}.");
        }
    }

    private function expression(mixed $e, array $scope, int $depth = 0): string
    {
        if ($depth > 30 || ! is_array($e)) {
            $this->fail('Invalid or excessively deep expression tree.');
        }
        $kind = $e['kind'] ?? '';
        if ($kind === 'literal') {
            $t = $this->type($e['type'] ?? null);
            $v = $e['value'] ?? null;
            $valid = match ($t) {
                'int' => is_int($v) && $v >= -2147483648 && $v <= 2147483647,
                'real' => (is_int($v) || is_float($v)) && is_finite((float) $v),
                'bool' => is_bool($v),
                'string' => is_string($v) && strlen($v) <= 2000 && ! preg_match('/[^\x20-\x7e\n\t]/', $v),
                default => false,
            };
            if (! $valid) {
                $this->fail('Invalid literal: use finite numbers, booleans, or ASCII text (up to 2000 characters).');
            }

            return $t;
        }
        if ($kind === 'ref') {
            $name = $this->name($e['name'] ?? null);

            return $scope[$name] ?? $this->fail("Undefined variable: {$name}.");
        }
        if ($kind === 'array') {
            $t = $this->type($e['type'] ?? null);
            if (! str_ends_with($t, '[]') || ! is_array($e['items'] ?? null) || count($e['items']) > 500) {
                $this->fail('An array needs an array type and at most 500 items.');
            }
            foreach ($e['items'] as $item) {
                $this->compatible(substr($t, 0, -2), $this->expression($item, $scope, $depth + 1));
            }

            return $t;
        }
        if ($kind === 'length' || $kind === 'index') {
            $array = $e['array'] ?? null;
            $t = $this->expression($array, $scope, $depth + 1);
            if (! str_ends_with($t, '[]')) {
                $this->fail('Length and index require an array.');
            }
            if ($kind === 'length') {
                return 'int';
            }
            $this->compatible('int', $this->expression($e['index'] ?? null, $scope, $depth + 1));
            if (($e['index']['kind'] ?? '') === 'literal') {
                $i = $e['index']['value'];
                $length = ($array['kind'] ?? '') === 'array' ? count($array['items']) : (($array['kind'] ?? '') === 'ref' ? ($scope['#'.$array['name']] ?? null) : null);
                if ($i < 0 || ($length !== null && $i >= $length)) {
                    $this->fail('Statically invalid array index.');
                }
            }

            return substr($t, 0, -2);
        }
        if ($kind === 'call') {
            $name = $this->name($e['name'] ?? null);
            $f = $this->functions[$name] ?? $this->fail("Unknown or forward/recursive function reference: {$name}.");
            if (count($e['args'] ?? []) !== count($f['params'])) {
                $this->fail("Wrong argument count for {$name}.");
            }
            foreach ($f['params'] as $i => $param) {
                $this->compatible($param['type'], $this->expression($e['args'][$i], $scope, $depth + 1));
            }

            return $f['returns'];
        }
        if ($kind === 'binary') {
            $a = $this->expression($e['left'] ?? null, $scope, $depth + 1);
            $b = $this->expression($e['right'] ?? null, $scope, $depth + 1);
            $op = $e['op'] ?? '';
            if (in_array($op, ['and', 'or'], true)) {
                if ($a !== 'bool' || $b !== 'bool') {
                    $this->fail('Logical operators require Boolean operands.');
                }

                return 'bool';
            }
            if (in_array($op, ['==', '!='], true) && $a === $b && ! str_ends_with($a, '[]')) {
                return 'bool';
            }
            if (! in_array($a, ['int', 'real'], true) || ! in_array($b, ['int', 'real'], true)) {
                $this->fail('This operator requires numeric operands; string concatenation is unsupported.');
            }
            if (in_array($op, ['<', '<=', '>', '>=', '==', '!='], true)) {
                return 'bool';
            }
            if (! in_array($op, ['+', '-', '*', '/', '%'], true)) {
                $this->fail('Unsupported binary operator.');
            }
            if (in_array($op, ['/', '%'], true) && ($e['right']['kind'] ?? '') === 'literal' && $e['right']['value'] == 0) {
                $this->fail('Division by zero.');
            }
            if ($op === '%' && ($a !== 'int' || $b !== 'int')) {
                $this->fail('Modulo requires integers.');
            }

            return $op === '/' || $a === 'real' || $b === 'real' ? 'real' : 'int';
        }
        $this->fail('Unsupported expression. Use literal, ref, binary, array, index, length, or call.');
    }

    private function block(mixed $ids, array &$scope, ?string $returns, int $depth = 0): void
    {
        if (! is_array($ids) || ! array_is_list($ids) || $depth > 20) {
            $this->fail('Invalid block or excessive nesting.');
        }
        $terminated = false;
        foreach ($ids as $offset => $id) {
            if ($terminated) {
                $this->fail('Unreachable statements after unconditional function return.');
            }
            if (! is_string($id) || ! isset($this->nodes[$id])) {
                $this->fail('Connection references a missing node.');
            }
            if (isset($this->seen[$id])) {
                $this->fail("Node {$id} has multiple incoming ownership edges or an unsupported cycle.");
            }
            $this->seen[$id] = true;
            $n = $this->nodes[$id];
            $kind = $n['kind'] ?? '';
            if (in_array($kind, ['declare', 'input'], true)) {
                $name = $this->name($n['name'] ?? null);
                $t = $this->type($n['type'] ?? null);
                if ($kind === 'input' && ($n['update'] ?? false)) {
                    $this->compatible($scope[$name] ?? $this->fail("Undefined variable: {$name}."), $t);
                } elseif (isset($scope[$name])) {
                    $this->fail("Variable {$name} is already declared in this scope.");
                }
                if ($kind === 'input' && ! in_array($t, ['int', 'real', 'string'], true)) {
                    $this->fail('Input supports int, real, or string, one value per line.');
                }
                if ($kind === 'declare') {
                    $this->compatible($t, $this->expression($n['value'] ?? null, $scope));
                }
                $scope[$name] = $t;
                if ($kind === 'declare' && str_ends_with($t, '[]') && ($n['value']['kind'] ?? '') === 'array') {
                    $scope['#'.$name] = count($n['value']['items']);
                }
                $this->types[$id] = $t;
            } elseif ($kind === 'assign') {
                $name = $this->name($n['name'] ?? null);
                $this->compatible($scope[$name] ?? $this->fail("Undefined variable: {$name}."), $this->expression($n['value'] ?? null, $scope));
                $this->types[$id] = $scope[$name];
                // Collection assignments are restricted to equal static lengths; element updates
                // are unrestricted within bounds. This keeps later static bounds checks sound.
                if (str_ends_with($scope[$name], '[]')) {
                    $this->fail('Reassigning whole arrays is unsupported. Use array_set for element updates.');
                }
            } elseif ($kind === 'array_set') {
                $name = $this->name($n['name'] ?? null);
                $t = $scope[$name] ?? '';
                if (! str_ends_with($t, '[]')) {
                    $this->fail('Array update requires a declared array.');
                }
                $this->expression(['kind' => 'index', 'array' => ['kind' => 'ref', 'name' => $name], 'index' => $n['index'] ?? null], $scope);
                $this->compatible(substr($t, 0, -2), $this->expression($n['value'] ?? null, $scope));
                $this->types[$id] = substr($t, 0, -2);
            } elseif ($kind === 'output') {
                $t = $this->expression($n['value'] ?? null, $scope);
                if (str_ends_with($t, '[]')) {
                    $this->fail('Output array elements in a loop instead of printing a whole array.');
                }
                $this->types[$id] = $t;
            } elseif ($kind === 'return') {
                if (! $returns || $offset !== count($ids) - 1) {
                    $this->fail('Return is allowed only at the end of a function block.');
                }
                $this->compatible($returns, $this->expression($n['value'] ?? null, $scope));
                $this->types[$id] = $returns;
            } elseif ($kind === 'connector') {
                // Structured join/annotation: next edge is the next block member.
            } elseif (in_array($kind, ['if', 'while', 'do', 'for', 'select'], true)) {
                if ($kind === 'select') {
                    $t = $this->expression($n['value'] ?? null, $scope);
                    if (! in_array($t, ['int', 'string'], true) || ! is_array($n['cases'] ?? null) || ! $n['cases']) {
                        $this->fail('Selection needs an int/string value and nonempty cases.');
                    }
                    $values = [];
                    foreach ($n['cases'] as $case) {
                        if (($case['value']['kind'] ?? '') !== 'literal') {
                            $this->fail('Selection cases must be literals.');
                        }
                        $this->compatible($t, $this->expression($case['value'], $scope));
                        $key = json_encode($case['value']['value']);
                        if (in_array($key, $values, true)) {
                            $this->fail('Duplicate selection case.');
                        }
                        $values[] = $key;
                        $child = $scope;
                        $this->block($case['body'] ?? null, $child, $returns, $depth + 1);
                    }
                    $child = $scope;
                    $this->block($n['default'] ?? null, $child, $returns, $depth + 1);
                    $terminated = $this->terminates([$id]);

                    continue;
                }
                $child = $scope;
                if ($kind === 'for') {
                    $name = $this->name($n['counter'] ?? null);
                    if (isset($scope[$name])) {
                        $this->fail('For counter needs a fresh local name.');
                    }
                    $this->compatible('int', $this->expression($n['from'] ?? null, $scope));
                    $this->compatible('int', $this->expression($n['to'] ?? null, $scope));
                    if (! is_int($n['step'] ?? null) || $n['step'] === 0 || abs($n['step']) > 10000) {
                        $this->fail('For step must be a nonzero integer between -10000 and 10000.');
                    }
                    $child[$name] = 'int';
                } else {
                    $this->compatible('bool', $this->expression($n['condition'] ?? null, $scope));
                }
                $this->block($n[$kind === 'if' ? 'then' : 'body'] ?? null, $child, $kind === 'if' ? $returns : null, $depth + 1);
                if ($kind === 'if') {
                    $child = $scope;
                    $this->block($n['else'] ?? null, $child, $returns, $depth + 1);
                }
            } else {
                $this->fail("Unsupported node kind: {$kind}.");
            }
            $terminated = $this->terminates([$id]);
        }
    }

    private function terminates(array $ids): bool
    {
        if (! $ids) {
            return false;
        }
        $n = $this->nodes[$ids[count($ids) - 1]];
        if ($n['kind'] === 'return') {
            return true;
        }
        if ($n['kind'] === 'if') {
            return $this->terminates($n['then']) && $this->terminates($n['else']);
        }
        if ($n['kind'] === 'select') {
            foreach ($n['cases'] as $case) {
                if (! $this->terminates($case['body'])) {
                    return false;
                }
            }

            return $this->terminates($n['default']);
        }

        return false;
    }

    public function validate(array $graph): void
    {
        $this->validateShape($graph);
        $this->seen = $this->functions = $this->types = [];
        if (($graph['version'] ?? null) !== 1 || ! is_array($graph['nodes'] ?? null) || count($graph['nodes']) > 500) {
            $this->fail('Expected version 1 graph with at most 500 nodes.');
        }
        $this->nodes = $graph['nodes'];
        if (($graph['start'] ?? null) !== 'start' || ($graph['end'] ?? null) !== 'end') {
            $this->fail('Missing Start or required End path.');
        }
        foreach ($this->nodes as $id => $node) {
            if (! is_string($id) || ! preg_match('/^[a-z][a-z0-9_]{0,49}$/D', $id) || ! is_array($node)) {
                $this->fail('Invalid node ID/configuration.');
            }
            if (isset($node['next']) || isset($node['edges'])) {
                $this->fail('Unstructured edges are unsupported. Connect nodes through ordered blocks.');
            }
            foreach (['label', 'prompt'] as $text) {
                if (isset($node[$text]) && (! is_string($node[$text]) || strlen($node[$text]) > 2000 || preg_match('/[^\x20-\x7e\n\t]/', $node[$text]))) {
                    $this->fail('Labels/prompts must be ASCII text of at most 2000 characters.');
                }
            }
        }
        foreach ($graph['functions'] ?? [] as $f) {
            $name = $this->name($f['name'] ?? null);
            if (isset($this->functions[$name])) {
                $this->fail('Duplicate function.');
            }
            $returns = $this->type($f['returns'] ?? null);
            if (str_ends_with($returns, '[]')) {
                $this->fail('Array returns are not supported.');
            }
            $scope = [];
            foreach ($f['params'] ?? [] as $p) {
                $pn = $this->name($p['name'] ?? null);
                if (isset($scope[$pn])) {
                    $this->fail('Duplicate parameter.');
                }
                $scope[$pn] = $this->type($p['type'] ?? null);
            }
            if (! $scope && ! isset($f['params'])) {
                $this->fail('Function params must be an array.');
            }
            $this->block($f['body'] ?? null, $scope, $returns);
            $last = $this->nodes[end($f['body'])] ?? [];
            if (($last['kind'] ?? '') !== 'return') {
                $this->fail('Each function needs a final return covering all paths.');
            }
            $this->functions[$name] = $f;
        }
        $scope = [];
        $this->block($graph['body'] ?? null, $scope, null);
        if (count($this->seen) !== count($this->nodes)) {
            $this->fail('Disconnected nodes exist outside the Start-to-End path and function blocks.');
        }
    }

    public function validateShape(array $graph): void
    {
        if (array_diff(array_keys($graph), ['version', 'start', 'end', 'body', 'nodes', 'functions'])) {
            $this->fail('Unsupported graph fields. Use structured block connections, not arbitrary edges.');
        }
        if (($graph['version'] ?? null) !== 1 || ! is_string($graph['start'] ?? null) || ! is_string($graph['end'] ?? null) || ! is_array($graph['nodes'] ?? null) || count($graph['nodes']) > 500 || ! is_array($graph['functions'] ?? null) || ! array_is_list($graph['functions']) || count($graph['functions']) > 30) {
            $this->fail('Expected version 1 graph with nodes, Start/End markers, and a function list.');
        }
        $block = function ($ids) {
            if (! is_array($ids) || ! array_is_list($ids) || count($ids) > 500) {
                $this->fail('Every connection block must be a list of at most 500 node IDs.');
            }
            foreach ($ids as $id) {
                if (! is_string($id) || ! preg_match('/^[a-z][a-z0-9_]{0,49}$/D', $id)) {
                    $this->fail('Invalid connection ID.');
                }
            }
        };
        $block($graph['body'] ?? null);
        foreach ($graph['nodes'] as $id => $node) {
            if (! is_string($id) || ! preg_match('/^[a-z][a-z0-9_]{0,49}$/D', $id) || ! is_array($node) || ! is_string($node['kind'] ?? null) || ! is_string($node['label'] ?? '')) {
                $this->fail('Invalid node configuration.');
            }
            foreach (['body', 'then', 'else', 'default'] as $key) {
                if (isset($node[$key])) {
                    $block($node[$key]);
                }
            }
            if (isset($node['cases'])) {
                if (! is_array($node['cases']) || ! array_is_list($node['cases']) || count($node['cases']) > 30) {
                    $this->fail('Selection cases must be a list of at most 30 cases.');
                }
                foreach ($node['cases'] as $case) {
                    if (! is_array($case) || ! is_array($case['value'] ?? null)) {
                        $this->fail('Invalid selection case.');
                    } $block($case['body'] ?? null);
                }
            }
            foreach (['value', 'condition', 'index', 'from', 'to'] as $key) {
                if (isset($node[$key]) && ! is_array($node[$key])) {
                    $this->fail('Expression configuration must be an object.');
                }
            }
        }
        foreach ($graph['functions'] as $f) {
            if (! is_array($f) || ! is_string($f['name'] ?? null) || ! is_string($f['returns'] ?? null) || ! is_array($f['params'] ?? null) || ! array_is_list($f['params']) || count($f['params']) > 16) {
                $this->fail('Invalid function signature.');
            }
            foreach ($f['params'] as $p) {
                if (! is_array($p) || ! is_string($p['name'] ?? null) || ! is_string($p['type'] ?? null)) {
                    $this->fail('Invalid function parameter.');
                }
            }
            $block($f['body'] ?? null);
        }
    }

    private function identifier(string $name): string
    {
        return 'v_'.$name;
    }

    private function q(string $text): string
    {
        return json_encode($text, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
    }

    private function targetType(string $type): string
    {
        if ($this->language === 'python') {
            return '';
        }
        if (str_ends_with($type, '[]')) {
            $base = $this->targetType(substr($type, 0, -2));

            return $this->language === 'cpp' ? "vector<{$base}>" : $base.'[]';
        }

        return ['int' => 'int', 'real' => 'double', 'string' => $this->language === 'cpp' ? 'string' : 'String', 'bool' => $this->language === 'cpp' ? 'bool' : 'boolean'][$type];
    }

    private function expr(array $e): string
    {
        $py = $this->language === 'python';
        $java = $this->language === 'java';

        return match ($e['kind']) {
            'literal' => match ($e['type']) {
                'string' => $this->q($e['value']),
                'bool' => $py ? ($e['value'] ? 'True' : 'False') : ($e['value'] ? 'true' : 'false'),
                'real' => json_encode((float) $e['value'], JSON_PRESERVE_ZERO_FRACTION),
                default => $this->language === 'cpp' && $e['value'] === -2147483648 ? '(-2147483647 - 1)' : (string) $e['value'],
            },
            'ref' => $this->identifier($e['name']),
            'array' => ($py ? '[' : ($java ? 'new '.$this->targetType($e['type']) : $this->targetType($e['type'])).'{').implode(', ', array_map(fn ($item) => $this->coerce($this->expr($item), substr($e['type'], 0, -2)), $e['items'])).($py ? ']' : '}'),
            'length' => $py ? 'len('.$this->expr($e['array']).')' : ($java ? $this->expr($e['array']).'.length' : 'static_cast<int>('.$this->expr($e['array']).'.size())'),
            'index' => 'cl_get('.$this->expr($e['array']).', '.$this->expr($e['index']).')',
            'call' => $this->identifier($e['name']).'('.implode(', ', array_map(function ($a, $p) use ($py, $java) {
                $s = $this->expr($a);

                return str_ends_with($p['type'], '[]') ? ($py ? $s.'[:]' : ($java ? $s.'.clone()' : $s)) : $this->coerce($s, $p['type']);
            }, $e['args'], $this->functions[$e['name']]['params'])).')',
            'binary' => $this->binary($e),
        };
    }

    private function coerce(string $value, string $type): string
    {
        return $this->language === 'python' && $type === 'real' ? 'float('.$value.')' : $value;
    }

    private function binary(array $e): string
    {
        $a = $this->expr($e['left']);
        $b = $this->expr($e['right']);
        $op = $e['op'];
        if (in_array($op, ['/', '%'], true)) {
            return ($op === '/' ? 'cl_div' : 'cl_mod')."({$a}, {$b})";
        }
        if (in_array($op, ['+', '-', '*'], true)) {
            return ['+' => 'cl_add', '-' => 'cl_sub', '*' => 'cl_mul'][$op]."({$a}, {$b})";
        }
        if ($this->language !== 'python') {
            $op = ['and' => '&&', 'or' => '||'][$op] ?? $op;
        }
        // String equality uses a value comparison in Java; numeric/Boolean equality also works boxed.
        if ($this->language === 'java' && in_array($op, ['==', '!='], true)) {
            return ($op === '!=' ? '!' : '')."cl_eq({$a}, {$b})";
        }

        return "({$a} {$op} {$b})";
    }

    private function line(string $text, int $indent, ?string $id = null): void
    {
        $this->lines[] = str_repeat('    ', $indent).$text;
        $this->maps[] = $id;
    }

    private function emit(array $ids, int $indent): void
    {
        $py = $this->language === 'python';
        $java = $this->language === 'java';
        $semi = $py ? '' : ';';
        if (! $ids && $py) {
            $this->line('pass', $indent);
        }
        foreach ($ids as $id) {
            $n = $this->nodes[$id];
            $k = $n['kind'];
            $line = fn ($s, $i = null) => $this->line($s, $i ?? $indent, $id);
            $name = isset($n['name']) ? $this->identifier($n['name']) : '';
            $v = isset($n['value']) ? $this->expr($n['value']) : '';
            if (in_array($k, ['declare', 'assign', 'array_set', 'return'], true)) {
                $v = $this->coerce($v, $this->types[$id]);
            }
            if ($k === 'declare' || $k === 'input') {
                if ($k === 'input') {
                    $v = 'cl_read_'.($n['type'] === 'string' ? 'string' : $n['type']).'('.$this->q($n['prompt'] ?? '').')';
                }
                $line(($py || ($k === 'input' && ($n['update'] ?? false)) ? '' : $this->targetType($n['type']).' ').$name.' = '.$v.$semi);
            } elseif ($k === 'assign') {
                $line($name.' = '.$v.$semi);
            } elseif ($k === 'array_set') {
                $line('cl_set('.$name.', '.$this->expr($n['index']).', '.$v.')'.$semi);
            } elseif ($k === 'output') {
                $value = $this->types[$id] === 'bool' ? ($py ? '("true" if '.$v.' else "false")' : '('.$v.' ? "true" : "false")') : $v;
                $line('cl_print('.$value.')'.$semi);
            } elseif ($k === 'return') {
                $line('return '.$v.$semi);
            } elseif ($k === 'connector') {
                $line(($py ? 'pass # ' : '// ').'Connector '.$id);
            } elseif ($k === 'select') {
                foreach ($n['cases'] as $i => $case) {
                    $condition = $this->binary(['left' => $n['value'], 'op' => '==', 'right' => $case['value']]);
                    $line(($i ? ($py ? 'elif ' : 'else if (') : ($py ? 'if ' : 'if (')).$condition.($py ? ':' : ') {'));
                    $this->emit($case['body'], $indent + 1);
                    if (! $py) {
                        $line('}');
                    }
                }
                $line($py ? 'else:' : 'else {');
                $this->emit($n['default'], $indent + 1);
                if (! $py) {
                    $line('}');
                }
            } elseif (in_array($k, ['if', 'while', 'for', 'do'], true)) {
                $condition = isset($n['condition']) ? $this->expr($n['condition']) : '';
                if ($k === 'for') {
                    $c = $this->identifier($n['counter']);
                    $from = $this->expr($n['from']);
                    $to = $this->expr($n['to']);
                    $step = $n['step'];
                    // Capture bounds once in all languages, including when the body changes variables.
                    if (! $py) {
                        $line('int cl_to_'.$id.' = '.$to.';');
                    }
                    $line($py ? "for {$c} in range({$from}, {$to}, {$step}):" : "for (int {$c} = {$from}; {$c} ".($step > 0 ? '<' : '>')." cl_to_{$id}; {$c} = cl_add({$c}, {$step})) {");
                } else {
                    $line($py ? ($k === 'do' ? 'while True:' : $k.' '.$condition.':') : ($k === 'do' ? 'do {' : $k.' ('.$condition.') {'));
                }
                $this->emit($n[$k === 'if' ? 'then' : 'body'], $indent + 1);
                if ($k === 'do' && $py) {
                    $line('if not '.$condition.':', $indent + 1);
                    $line('break', $indent + 2);
                }
                if (! $py) {
                    $line($k === 'do' ? '} while ('.$condition.');' : '}');
                }
                if ($k === 'if' && $n['else']) {
                    $line($py ? 'else:' : 'else {');
                    $this->emit($n['else'], $indent + 1);
                    if (! $py) {
                        $line('}');
                    }
                }
            }
        }
    }

    public function generate(array $graph): array
    {
        $this->validate($graph);
        $result = [];
        foreach (['python', 'cpp', 'java'] as $language) {
            $this->language = $language;
            $this->lines = $this->maps = [];
            $runtime = require __DIR__.'/../../resources/programming/runtimes.php';
            foreach (explode("\n", trim($runtime[$language])) as $line) {
                $this->line($line, 0);
            }
            $py = $language === 'python';
            $java = $language === 'java';
            foreach ($graph['functions'] ?? [] as $f) {
                $params = implode(', ', array_map(fn ($p) => ($py ? '' : $this->targetType($p['type']).' ').$this->identifier($p['name']), $f['params']));
                $this->line($py ? 'def '.$this->identifier($f['name']).'('.$params.'):' : ($java ? 'static ' : '').$this->targetType($f['returns']).' '.$this->identifier($f['name']).'('.$params.') {', $java ? 1 : 0);
                $this->emit($f['body'], $java ? 2 : 1);
                if (! $py) {
                    $this->line('}', $java ? 1 : 0);
                }
            }
            $this->line($py ? 'def cl_main():' : ($java ? 'public static void main(String[] args) {' : 'int main() {'), $java ? 1 : 0);
            if ($language === 'cpp') {
                $this->line('cout << fixed << setprecision(6);', 1);
            }
            $this->emit($graph['body'], $java ? 2 : 1);
            if (! $py) {
                $this->line('}', $java ? 1 : 0);
            }
            if ($java) {
                $this->line('}', 0);
            }
            if ($py) {
                $this->line('cl_main()', 0);
            }
            $result[$language] = ['code' => implode("\n", $this->lines)."\n", 'nodes' => $this->maps];
        }

        return $result;
    }

    public function plan(array $graph): array
    {
        $this->validate($graph);
        $display = function (array $e) use (&$display): string {
            return match ($e['kind']) {
                'literal' => json_encode($e['value'], JSON_PRESERVE_ZERO_FRACTION),
                'ref' => $e['name'],
                'binary' => '('.$display($e['left']).' '.$e['op'].' '.$display($e['right']).')',
                'array' => '['.implode(', ', array_map($display, $e['items'])).']',
                'index' => $display($e['array']).'['.$display($e['index']).']',
                'length' => 'LENGTH('.$display($e['array']).')',
                'call' => $e['name'].'('.implode(', ', array_map($display, $e['args'])).')',
            };
        };
        $lines = [];
        $walk = function (array $ids, int $depth) use (&$walk, &$lines, $display) {
            foreach ($ids as $id) {
                $n = $this->nodes[$id];
                $k = $n['kind'];
                $prefix = str_repeat('    ', $depth);
                $text = match ($k) {
                    'input' => 'INPUT '.$n['name'].' AS '.$n['type'],
                    'declare', 'assign' => $n['name'].' <- '.$display($n['value']),
                    'array_set' => $n['name'].'['.$display($n['index']).'] <- '.$display($n['value']),
                    'output' => 'OUTPUT '.$display($n['value']),
                    'return' => 'RETURN '.$display($n['value']),
                    'if' => 'IF '.$display($n['condition']).' THEN',
                    'while' => 'WHILE '.$display($n['condition']),
                    'do' => 'REPEAT',
                    'for' => 'FOR '.$n['counter'].' FROM '.$display($n['from']).' TO EXCLUDING '.$display($n['to']).' STEP '.$n['step'],
                    'select' => 'SELECT '.$display($n['value']),
                    'connector' => 'CONNECTOR '.$id,
                };
                $lines[] = $prefix.$text;
                if (in_array($k, ['for', 'while', 'do'], true)) {
                    $walk($n['body'], $depth + 1);
                    $lines[] = $prefix.($k === 'do' ? 'CONTINUE WHILE '.$display($n['condition']) : 'END '.$k);
                } elseif ($k === 'if') {
                    $walk($n['then'], $depth + 1);
                    if ($n['else']) {
                        $lines[] = $prefix.'ELSE';
                        $walk($n['else'], $depth + 1);
                    }
                    $lines[] = $prefix.'END IF';
                } elseif ($k === 'select') {
                    foreach ($n['cases'] as $case) {
                        $lines[] = $prefix.'CASE '.$display($case['value']);
                        $walk($case['body'], $depth + 1);
                    }
                    $lines[] = $prefix.'DEFAULT';
                    $walk($n['default'], $depth + 1);
                    $lines[] = $prefix.'END SELECT';
                }
            }
        };
        foreach ($graph['functions'] ?? [] as $f) {
            $lines[] = 'FUNCTION '.$f['name'].'('.implode(', ', array_map(fn ($p) => $p['name'].' AS '.$p['type'], $f['params'])).') RETURNS '.$f['returns'];
            $walk($f['body'], 1);
            $lines[] = 'END FUNCTION';
        }
        $lines[] = 'START';
        $walk($graph['body'], 0);
        $lines[] = 'END';

        return ['pseudocode' => implode("\n", $lines), 'algorithm' => array_map(fn ($line, $i) => ($i + 1).'. '.$line, $lines, array_keys($lines))];
    }
}
