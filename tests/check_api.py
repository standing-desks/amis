"""Consumer checks for the importable AMIS API, including optimized Python."""
import copy
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import amis_contract as amis


class ConsumerChecks(unittest.TestCase):
    def setUp(self):
        self.bundle = amis.loads((ROOT / 'examples/project-feedback.amis.json').read_text())

    def test_import_is_quiet_and_does_not_write_to_the_callers_directory(self):
        with tempfile.TemporaryDirectory() as directory:
            result = subprocess.run([sys.executable, '-B', '-c', 'import amis_contract'],
                cwd=directory, env=dict(os.environ, PYTHONPATH=str(ROOT)),
                capture_output=True, text=True, check=True)
            self.assertEqual(result.stdout, '')
            self.assertEqual(result.stderr, '')
            self.assertEqual(list(Path(directory).iterdir()), [])

    def test_optimized_python_still_rejects_tampering(self):
        value = copy.deepcopy(self.bundle)
        value['records'][0]['body']['text'] += 'tampered'
        code = '''import sys, amis_contract as amis
value = amis.loads(sys.stdin.read())
try:
    amis.validate_bundle(value)
except amis.ContractError:
    sys.exit(0)
sys.exit("tampering accepted")
'''
        result = subprocess.run([sys.executable, '-O', '-B', '-c', code], cwd=ROOT,
            input=json.dumps(value), text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_strict_json(self):
        for value in ['{"id":1,"id":2}', '{"n":NaN}', '{"n":Infinity}']:
            with self.assertRaises(amis.ContractError):
                amis.loads(value)

    def test_schema_and_semantic_validation(self):
        self.assertEqual(amis.validate_bundle(self.bundle), 'valid')
        self.bundle['required_features'].append('org.example.future.v1')
        self.assertEqual(amis.validate_bundle(amis.seal(self.bundle)), 'archive_only')

    def test_document_hash_is_checked(self):
        cap = amis.loads((ROOT / 'examples/capabilities.json').read_text())
        amis.validate_document('capabilities', cap)
        cap['provider'] = 'org.example.altered'
        with self.assertRaises(amis.ContractError):
            amis.validate_document('capabilities', cap)

    def test_sealing_does_not_mutate_input(self):
        original = copy.deepcopy(self.bundle)
        self.assertEqual(amis.seal(self.bundle), original)
        self.assertEqual(self.bundle, original)
        record = self.bundle['records'][0]
        self.assertEqual(amis.record_reference(record)['digest'], record['integrity']['digest'])


if __name__ == '__main__':
    unittest.main()
