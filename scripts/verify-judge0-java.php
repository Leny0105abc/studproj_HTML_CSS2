<?php

use App\Services\Judge0JavaSandbox;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$sandbox = app(Judge0JavaSandbox::class);
$normalize = fn ($text) => trim(preg_replace('/\s+/', ' ', $text));
$lessons = json_decode(file_get_contents(database_path('data/java-course.json')), true, flags: JSON_THROW_ON_ERROR);
foreach ($lessons as $index => $lesson) {
    if (in_array('--probes-only', $argv, true)) {
        continue;
    }
    $sample = $lesson['validation_rules']['java']['test_cases'][0];
    $result = null;
    for ($attempt = 0; $attempt < 3; $attempt++) {
        try {
            $result = $sandbox->run($lesson['example_java'], $sample['input']);
            break;
        } catch (RuntimeException $error) {
            if ($attempt === 2) {
                throw $error;
            } sleep(5);
        }
    }
    if ($result['runtime_errors'] !== '' || $normalize($result['output']) !== $normalize($sample['expected'])) {
        throw new RuntimeException('Example failed: '.$lesson['title'].' '.json_encode($result));
    }
    echo 'PASS '.($index + 1).': '.$lesson['title'].PHP_EOL;
    flush();
}
$main = fn ($body) => 'public class Main { public static void main(String[] args) throws Exception { '.$body.' } }';
$cases = [
    ['Compiler diagnostics', 'public class Main { invalid syntax }', '', fn ($r) => $r['compilation_output'] !== ''],
    ['Runtime diagnostics', $main('throw new IllegalStateException("test runtime error");'), '', fn ($r) => str_contains($r['runtime_errors'], 'test runtime error')],
    ['Scanner full name and multiline input', 'import java.util.*; '.$main('Scanner s=new Scanner(System.in); System.out.println(s.nextLine()+"|"+s.nextInt()+"|"+s.nextDouble());'), "Maria Santos\n19\n95.5\n", fn ($r) => $normalize($r['output']) === 'Maria Santos|19|95.5' && $r['runtime_errors'] === ''],
    ['Fresh files', $main('System.out.println(java.nio.file.Files.exists(java.nio.file.Path.of("students.txt")));'), '', fn ($r) => $normalize($r['output']) === 'false'],
    ['Application files blocked', $main('try {java.nio.file.Files.readString(java.nio.file.Path.of("/.env")); System.out.println("FAIL");} catch(SecurityException e){System.out.println("Denied");}'), '', fn ($r) => $normalize($r['output']) === 'Denied'],
    ['Environment credentials blocked', $main('try {System.getenv("DB_PASSWORD"); System.out.println("FAIL");} catch(SecurityException e){System.out.println("Denied");}'), '', fn ($r) => $normalize($r['output']) === 'Denied'],
    ['Shell and processes blocked', $main('try {new ProcessBuilder("sh","-c","echo forbidden").start(); System.out.println("FAIL");} catch(SecurityException e){System.out.println("Denied");}'), '', fn ($r) => $normalize($r['output']) === 'Denied'],
    ['Network blocked', $main('try {new java.net.Socket("example.com",80); System.out.println("FAIL");} catch(SecurityException e){System.out.println("Denied");}'), '', fn ($r) => $normalize($r['output']) === 'Denied'],
    ['Guard cannot be disabled', $main('try {System.setSecurityManager(null); System.out.println("FAIL");} catch(SecurityException e){System.out.println("Denied");}'), '', fn ($r) => $normalize($r['output']) === 'Denied'],
    ['Guard files immutable', $main('try {java.nio.file.Files.writeString(java.nio.file.Path.of("sandbox.policy"),"grant { permission java.security.AllPermission; };"); System.out.println("FAIL");} catch(SecurityException e){System.out.println("Denied");}'), '', fn ($r) => $normalize($r['output']) === 'Denied'],
    ['Execution timeout', $main('while(true){}'), '', fn ($r) => $r['runtime_errors'] !== ''],
    ['Memory limit', 'import java.util.*; '.$main('List<byte[]> data=new ArrayList<>(); while(true) data.add(new byte[1048576]);'), '', fn ($r) => str_contains($r['runtime_errors'], 'OutOfMemoryError')],
    ['Thread limit', $main('for(int i=0;i<10000;i++) new Thread(()->{try{Thread.sleep(60000);}catch(InterruptedException e){}}).start();'), '', fn ($r) => $r['runtime_errors'] !== '' && (str_contains($r['runtime_errors'], 'thread') || str_contains($r['runtime_errors'], 'Time Limit') || str_contains($r['runtime_errors'], 'Runtime Error'))],
    ['Output limit', $main('while(true) System.out.println("01234567890123456789");'), '', fn ($r) => $r['runtime_errors'] !== '' && strlen($r['output']) <= 65536],
    ['File-size limit', $main('try(var out=new java.io.FileOutputStream("large.dat")){out.write(new byte[1048576]);}'), '', fn ($r) => $r['runtime_errors'] !== ''],
    ['File-count limit', $main('for(int i=0;i<1000;i++) java.nio.file.Files.writeString(java.nio.file.Path.of("file"+i),"1");'), '', fn ($r) => str_contains($r['runtime_errors'], 'creation limit')],
];
foreach ($cases as [$name, $source, $input, $check]) {
    $result = null;
    for ($attempt = 0; $attempt < 3; $attempt++) {
        try {
            $result = $sandbox->run($source, $input);
            break;
        } catch (RuntimeException $error) {
            if ($attempt === 2) {
                throw $error;
            } sleep(5);
        }
    }
    if (! $check($result)) {
        throw new RuntimeException('Probe failed: '.$name.' '.json_encode($result));
    }
    echo 'PASS '.$name.PHP_EOL;
    flush();
}
echo 'All authored Java examples and isolation probes passed against Judge0.'.PHP_EOL;
