import { compile } from 'tailwindcss';
import baseCss from '../tailwind/base.generated.json' with { type: 'json' };
import config from '../tailwind/config.json' with { type: 'json' };

export async function compileTailwind({ html, source = '', css = '' }) {
    if (
        typeof html !== 'string' ||
        html.length > 65536 ||
        typeof source !== 'string' ||
        source.length > 350000 ||
        typeof css !== 'string' ||
        css.length > 50000
    )
        throw Error('Tailwind input exceeds practice limits.');
    // The compiler receives complete tokens, never executes learner JavaScript,
    // and has no filesystem/module/import loader.
    const candidates = [
        ...new Set((html + '\n' + source).match(/[^\s"'`<>{}]+/g) ?? []),
    ].filter((value) => value.length <= 200);
    if (candidates.length > config.maxCandidates)
        throw Error('Too many Tailwind class candidates. Simplify the page.');
    const custom = css.replace(/@import\s+["']tailwindcss["'];?/g, '');
    if (/@(?:import|plugin|config|source)\b/.test(custom))
        throw Error(
            'The practice compiler supports local @theme, @apply and @custom-variant, but not external imports, plugins, config files or filesystem sources.',
        );
    const compiler = await compile(baseCss + '\n' + custom);
    const output = compiler.build(candidates);
    if (output.length > config.maxCssBytes)
        throw Error('Generated Tailwind CSS exceeds practice limits.');
    return output;
}
