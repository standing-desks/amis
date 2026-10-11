"""Build the informative HTML views from the canonical draft and example."""
from pathlib import Path
import argparse
import re
import sys

import markdown

ROOT = Path(__file__).resolve().parents[1]


def outputs():
    example = (ROOT / 'examples/project-feedback.amis.json').read_text().replace('</', '<\\/')
    template = (ROOT / 'docs/guide.template.html').read_text()
    guide = template.replace('{{AMIS_EXAMPLE}}', example)
    content = markdown.markdown((ROOT / 'SPEC.md').read_text(), extensions=['tables', 'fenced_code'])
    # SPEC.md links are root-relative; this generated view lives under docs/.
    content = re.sub(r'href="(?!https?:|#)([^"]+)"', lambda m: 'href="../' + m[1] + '"', content)
    content = content.replace('<table>', '<div class="table-wrap"><table>').replace('</table>', '</table></div>')
    spec = '''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AMIS 0.4.0 · Agent Memory Interface Spec</title><link rel="stylesheet" href="assets/styles.css"></head>
<body><div class="wrap spec-document"><header class="top"><div class="wordmark"><span>⇄</span>AMIS</div><nav><a href="index.html">← Visual guide</a><a href="../SPEC.md">Markdown source</a></nav></header><main class="spec-content">''' + content + '</main></div></body></html>\n'
    return {ROOT / 'docs/index.html': guide, ROOT / 'docs/spec.html': spec}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    stale = []
    for path, content in outputs().items():
        if args.check:
            if not path.exists() or path.read_text() != content:
                stale.append(str(path.relative_to(ROOT)))
        else:
            path.write_text(content)
    if stale:
        print('Generated documentation is stale: ' + ', '.join(stale), file=sys.stderr)
        return 1
    print('Documentation is current.' if args.check else 'Built visual guide and specification.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
