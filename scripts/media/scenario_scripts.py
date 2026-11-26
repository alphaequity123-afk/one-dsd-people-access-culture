"""Turn approved scenario scripts into described, character-voiced scenes."""
import hashlib
import re
from pathlib import Path

EXTRA_CAST = {'MOTHER':'C3','STAFF MEMBER':'C3','SECURITY OFFICER':'C4','DIRECTOR':'C4'}

def parse(path, profile):
    raw=path.read_text(encoding='utf8')
    cast={role.upper():char for role,char in re.findall(r'- \*\*([^:]+):\*\* (C[1-8])',raw)}
    cast.update({role:char for role,char in EXTRA_CAST.items() if re.search(r'^'+role+r'(?: \([^\n]*?\))?:',raw,re.M)})
    title=raw.splitlines()[0].split(': ',1)[1]
    turns=[]; scenes=[]; scene=0
    def add(role,text,kind='dialogue'):
        text=text.strip()
        if text:
            turns.append({'speaker':role,'character':cast[role],'text':text,'scene':scene,'kind':kind})
    for line in raw.splitlines():
        m=re.match(r'\*\*Scene (\d+)\. (.*?)\*\*$',line)
        if m:
            scene=int(m[1]); scenes.append({'number':scene,'description':m[2]})
            add('NARRATOR',f'Scene {scene}. '+m[2],'description'); continue
        if not scene: continue
        if line.startswith('(') and line.endswith(')'):
            add('NARRATOR',line[1:-1],'description'); continue
        m=re.match(r'([A-Z][A-Z ]+)(?: \([^\n]*?\))?: (.*)',line)
        if m:
            role,text=m.groups()
            if role not in cast: raise ValueError('Unassigned voice: '+role)
            # Retain spoken dialogue, separately narrate meaningful physical actions.
            directions=re.findall(r'\(([^)]*)\)',text)
            for direction in directions:
                if direction in ('gently','to the mother, gently','to the assessor','to the case manager','to the new colleague','to the supervisor','on the phone') or direction.startswith('to '): continue
                add('NARRATOR',role.capitalize()+': '+direction+'.','description')
            add(role,re.sub(r'\([^)]*\)\s*','',text).strip())
        elif line.strip():
            raise ValueError('Unparsed scenario line: '+line)
    assert scenes and turns
    return {'id':path.name.removesuffix('.video.md'),'title':title,'voiceProfile':profile['id'],
            'voiceAssignments':cast,'scenes':scenes,'turns':turns,'sources':[],
            'sourceScript':path.as_posix(),'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest()}
