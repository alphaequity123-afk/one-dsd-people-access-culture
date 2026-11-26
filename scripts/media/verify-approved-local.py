"""Check recorded course packages, preserved scripts, voice evidence and player registration."""
import hashlib
import json
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[2]
profile = json.loads((root/'config/character-voices.json').read_text())
registry = json.loads((root/'lib/content/courses/completed-podcasts.json').read_text(encoding='utf8'))
reports = []
for group in ['cultural-navigation', 'culture-wellbeing']:
    for source in sorted((root/'docs/media-scripts'/group).glob('*.podcast.json')):
        script = json.loads(source.read_text(encoding='utf8'))
        original = json.loads(subprocess.check_output(['git', 'show', 'HEAD:'+source.relative_to(root).as_posix()], cwd=root))
        assert script['turns'] == original['turns'], 'Spoken script changed: '+script['id']
        assert script['sources'] == original['sources'], 'Sources changed: '+script['id']
        folder = root/'public/learning/course-podcasts'/script['id']
        episode = json.loads((folder/'episode.json').read_text(encoding='utf8'))
        evidence = json.loads((folder/'voice-verification.json').read_text(encoding='utf8'))
        transcript = json.loads((folder/'transcript.json').read_text(encoding='utf8'))
        audio = folder/'episode.mp3'
        assert hashlib.sha256(audio.read_bytes()).hexdigest() == evidence['audioSha256']
        assert episode['voiceProfile'] == profile['id'] == evidence['profile']
        assert episode['scriptSha256'] == hashlib.sha256(source.read_bytes()).hexdigest()
        assert episode['speakerLabels'] == {'host1':'Kelly', 'geffen':'John'}
        assert len(transcript['turns']) == len(script['turns'])
        assert set(s['character'] for s in evidence['sentences']) == {'C3','C4'}
        for sentence in evidence['sentences']:
            char = sentence['character']
            assert sentence['referenceSha256'] == profile['characters'][char]['sha256']
            assert sentence['agreement'] >= .94
            scores = sentence['speakerScores']
            assert scores[char] >= .6 and scores[char] > scores['C4' if char == 'C3' else 'C3']
            assert all(0 <= w['start'] <= w['end'] <= sentence['seconds']+.15 for w in sentence['words'])
        duration = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries',
            'format=duration', '-of', 'default=nw=1:nk=1', str(audio)]))
        assert abs(duration-episode['durationSeconds']) < .3
        entry = registry[script['id']]
        assert entry['src'] == episode['audioSrc']
        assert entry['transcript'] == (folder/'transcript.txt').read_text(encoding='utf8')
        assert entry['seconds'] == episode['durationSeconds']
        vtt = (folder/'captions.vtt').read_text(encoding='utf8')
        assert vtt.startswith('WEBVTT\n') and '-->' in vtt
        def seconds(t):
            h,m,s = t.split(':'); return int(h)*3600+int(m)*60+float(s)
        previous = 0
        for line in vtt.splitlines():
            if ' --> ' in line:
                start,end = map(seconds,line.split(' --> '))
                assert previous <= start < end <= duration+.1
                previous = end
        reports.append({'course':script['id'],'seconds':duration,'sentences':len(evidence['sentences']),
            'minSpeechAgreement':min(s['agreement'] for s in evidence['sentences'])})
assert len(reports) == 13
out=root/'output/approved-local-recording/package-verification.json'
out.write_text(json.dumps(reports,indent=2)+'\n',encoding='utf8')
print(f'Verified {len(reports)} complete packages; {sum(r["seconds"] for r in reports)/60:.1f} minutes; all registered.')
