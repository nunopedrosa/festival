#!/usr/bin/env python3
"""Deployment regressions using temporary local Git remotes and web directories only."""
import os
from pathlib import Path
import shutil
import stat
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]

class DeployTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory(prefix='festival-deploy-test-')
        cls.base = Path(cls.tmp.name)
        cls.env = dict(os.environ, GIT_CONFIG_NOSYSTEM='1', GIT_CONFIG_GLOBAL='/dev/null', GIT_TERMINAL_PROMPT='0')
        cls.seed = cls.base / 'seed'
        shutil.copytree(ROOT, cls.seed, ignore=shutil.ignore_patterns('node_modules', 'dist', '.openai', '.git', '__pycache__'))
        cls.git(cls.seed, 'init', '-q', '-b', 'main')
        cls.identity(cls.seed)
        cls.git(cls.seed, 'add', '.')
        cls.git(cls.seed, 'commit', '-qm', 'Static fixture')
        cls.number = 0

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    @classmethod
    def git(cls, cwd, *args, check=True):
        if args and args[0] == 'clone':
            args = (args[0], '--no-local', *args[1:])
        result = subprocess.run(['git', '-C', str(cwd), *args], env=cls.env, text=True,
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if check and result.returncode:
            raise RuntimeError(result.stderr)
        return result

    @classmethod
    def identity(cls, directory):
        cls.git(directory, 'config', 'user.name', 'Deployment test')
        cls.git(directory, 'config', 'user.email', 'deployment-test@example.invalid')

    def setUp(self):
        type(self).number += 1
        self.case = self.base / str(self.number)
        self.case.mkdir()
        self.remote = self.case / 'remote.git'
        self.git(self.case, 'clone', '-q', '--bare', str(self.seed), str(self.remote))
        self.author = self.case / 'author'
        self.checkout = self.case / 'checkout'
        for directory in [self.author, self.checkout]:
            self.git(self.case, 'clone', '-q', str(self.remote), str(directory))
            self.identity(directory)
        self.web = self.case / 'public'
        self.web.mkdir()
        (self.web / 'index.html').write_text('old live page')
        (self.web / 'keep.txt').write_text('unrelated')
        self.script = self.checkout / 'scripts/deploy.sh'

    def publish(self, directory=None, success=True):
        result = subprocess.run(['bash', str(self.script), str(directory or self.web)], cwd=self.case,
                                env=self.env, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if success:
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        else:
            self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertEqual((self.web / 'index.html').read_text(), 'old live page')
        self.assertFalse((self.web / '.basecentral-deploy.lock').exists())
        self.assertFalse((self.checkout / '.git/basecentral-deploy.lock').exists())
        return result

    def push_author(self):
        self.git(self.author, 'add', '-A')
        self.git(self.author, 'commit', '-qm', 'Fixture upstream change')
        self.git(self.author, 'push', '-q')

    def test_first_publish_and_fast_forward_preserve_host_files(self):
        (self.author / 'styles.css').write_text('/* updated fixture stylesheet */\n')
        self.push_author()
        result = self.publish()
        manifest = (self.checkout / 'deploy-files.txt').read_text().splitlines()
        for filename in manifest:
            published = self.web / filename
            self.assertEqual(published.read_bytes(), (self.checkout / filename).read_bytes(), filename)
            self.assertEqual(stat.S_IMODE(published.stat().st_mode), 0o644, filename)
        self.assertEqual((self.web / 'keep.txt').read_text(), 'unrelated')
        self.assertIn('Cache-Control', (self.web / '.htaccess').read_text())
        self.assertFalse((self.web / 'scripts').exists())
        self.assertFalse((self.web / 'package.json').exists())
        self.assertFalse((self.web / '.git').exists())
        self.assertFalse(list(self.web.glob('.festival-deploy.*')))
        (self.web / '.htaccess').write_text('# existing host rules\n')
        self.publish()
        self.assertEqual((self.web / '.htaccess').read_text(), '# existing host rules\n')
        self.assertIn('Commit:', result.stdout)

    def test_dirty_tracked_file(self):
        with (self.checkout / 'styles.css').open('a') as file:
            file.write('\n/* local changes */\n')
        self.publish(success=False)

    def test_untracked_file(self):
        (self.checkout / 'local-notes.txt').write_text('keep local notes')
        self.publish(success=False)
        self.assertEqual((self.checkout / 'local-notes.txt').read_text(), 'keep local notes')

    def test_detached_head(self):
        self.git(self.checkout, 'checkout', '-q', '--detach')
        self.publish(success=False)

    def test_no_upstream(self):
        self.git(self.checkout, 'branch', '--unset-upstream')
        self.publish(success=False)

    def test_local_only_commit(self):
        (self.checkout / 'local-notes.txt').write_text('local commit')
        self.git(self.checkout, 'add', '.')
        self.git(self.checkout, 'commit', '-qm', 'Local only')
        self.publish(success=False)

    def test_divergent_history(self):
        (self.checkout / 'local-notes.txt').write_text('local commit')
        self.git(self.checkout, 'add', '.')
        self.git(self.checkout, 'commit', '-qm', 'Local only')
        (self.author / 'remote-note.txt').write_text('remote commit')
        self.push_author()
        self.publish(success=False)

    def test_destination_inside_checkout(self):
        destination = self.checkout / 'public'
        destination.mkdir()
        self.publish(destination, success=False)

    def test_checkout_inside_destination(self):
        self.publish(self.case, success=False)

    def test_symlink_destination_file(self):
        victim = self.case / 'victim'
        victim.write_text('untouched')
        (self.web / 'styles.css').symlink_to(victim)
        self.publish(success=False)
        self.assertEqual(victim.read_text(), 'untouched')

    def test_symlink_destination_directory(self):
        target = self.case / 'elsewhere'
        target.mkdir()
        (self.web / 'assets').symlink_to(target, target_is_directory=True)
        self.publish(success=False)
        self.assertFalse(list(target.iterdir()))

    def test_symlink_source_file(self):
        source = self.author / 'styles.css'
        source.unlink()
        source.symlink_to('README.md')
        self.push_author()
        self.publish(success=False)

    def test_missing_source_file(self):
        (self.author / 'assets/flags/pt.svg').unlink()
        self.push_author()
        self.publish(success=False)

    def test_manifest_cannot_publish_development_files(self):
        with (self.author / 'deploy-files.txt').open('a') as file:
            file.write('scripts/deploy.sh\n')
        self.push_author()
        self.publish(success=False)

    def test_manifest_rejects_parent_traversal(self):
        with (self.author / 'deploy-files.txt').open('a') as file:
            file.write('assets/../../outside.svg\n')
        self.push_author()
        self.publish(success=False)

    def test_existing_destination_lock_is_preserved(self):
        lock = self.web / '.basecentral-deploy.lock'
        lock.mkdir()
        result = subprocess.run(['bash', str(self.script), str(self.web)], env=self.env, text=True,
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        self.assertNotEqual(result.returncode, 0)
        self.assertTrue(lock.is_dir())
        self.assertEqual((self.web / 'index.html').read_text(), 'old live page')
        self.assertFalse((self.checkout / '.git/basecentral-deploy.lock').exists())

    def test_existing_htaccess_symlink_is_rejected(self):
        victim = self.case / 'host-rules'
        victim.write_text('original rules')
        (self.web / '.htaccess').symlink_to(victim)
        self.publish(success=False)
        self.assertEqual(victim.read_text(), 'original rules')

if __name__ == '__main__':
    unittest.main(verbosity=2)
