"""Render verified scenario dialogue as illustrated videos with the approved cast portraits."""
import argparse,difflib,hashlib,importlib.util,json,re,subprocess,textwrap
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageOps
from scenario_scripts import parse

ROOT=Path(__file__).resolve().parents[2]
PROFILE=json.loads((ROOT/'config/character-voices.json').read_text())
spec=importlib.util.spec_from_file_location('recorder',Path(__file__).with_name('record-approved-local.py'))
recorder=importlib.util.module_from_spec(spec);spec.loader.exec_module(recorder)
sha=lambda b:hashlib.sha256(b).hexdigest()
def save(p,obj):p.write_text(json.dumps(obj,indent=2,ensure_ascii=False)+'\n',encoding='utf8',newline='\n')
def font(size,bold=False):return ImageFont.truetype('C:/Windows/Fonts/arial'+('bd' if bold else '')+'.ttf',size)
def wrapped(draw,text,xy,width,size=32,fill='#003865',bold=False):
 f=font(size,bold);words=text.split();lines=[];line=''
 for word in words:
  proposed=(line+' '+word).strip()
  if draw.textlength(proposed,font=f)>width and line:lines.append(line);line=word
  else:line=proposed
 if line:lines.append(line)
 x,y=xy
 for line in lines:draw.text((x,y),line,font=f,fill=fill);y+=size*1.3
 return y

def card(script,turn,portraits,path):
 im=Image.new('RGB',(1280,720),'#f7f8fa');d=ImageDraw.Draw(im)
 d.rectangle((0,0,1280,12),fill='#003865')
 scene=next(s for s in script['scenes'] if s['number']==turn['scene'])
 y=wrapped(d,script['title'],(54,42),695,40,bold=True)
 d.rectangle((54,y+14,140,y+19),fill='#538426')
 y=wrapped(d,f'Scene {turn["scene"]}',(54,y+48),670,25,fill='#35596b',bold=True)
 y=wrapped(d,scene['description'],(54,y+18),650,34)
 assert y<500,(script['id'],'Description overflows')
 role=turn['speaker'].title()
 d.rounded_rectangle((54,520,704,587),radius=8,fill='#003865')
 wrapped(d,role,(77,535),600,28,fill='white',bold=True)
 # Off-camera roles remain off-camera as specified by the scripts.
 if turn['speaker'] not in ('MOTHER','SECURITY OFFICER','STAFF MEMBER','DIRECTOR'):
  char=turn['character'];p=portraits/PROFILE['characters'][char]['portraitFile']
  assert sha(p.read_bytes())==PROFILE['characters'][char]['portraitSha256']
  portrait=Image.open(p).convert('RGB')
  portrait=ImageOps.contain(portrait,(460,600))
  im.paste(portrait,(780+(460-portrait.width)//2,20))
 else:
  d.rounded_rectangle((810,190,1200,430),radius=18,fill='#e4ebef')
  wrapped(d,role,(845,235),320,34,bold=True)
  wrapped(d,'Off camera',(845,340),320,25,fill='#35596b')
 d.rectangle((0,620,1280,720),fill='#003865')
 im.save(path)

def aligned_cues(turns,evidence):
 """Map source words to recognized word timestamps, preserving authored spelling."""
 receipts=iter(evidence);cues=[];disagreements=[]
 for turn in turns:
  elapsed=turn['start']
  for j,sentence in enumerate(re.split(r'(?<=[.!?])\s+',turn['text'].strip())):
   if j:elapsed+=.15
   rec=next(receipts);assert rec['text']==sentence
   source=sentence.split();heard=rec['words'];assert heard
   a=[recorder.words(w) for w in source];b=[recorder.words(w['text']) for w in heard]
   a=[' '.join(w) for w in a];b=[' '.join(w) for w in b]
   times=[None]*len(a)
   for kind,i1,i2,j1,j2 in difflib.SequenceMatcher(None,a,b,autojunk=False).get_opcodes():
    start=heard[min(j1,len(heard)-1)]['start'];end=heard[min(max(j2-1,j1),len(heard)-1)]['end']
    if kind=='equal':
     for ai,bi in zip(range(i1,i2),range(j1,j2)):times[ai]=(heard[bi]['start'],heard[bi]['end'])
    else:
     for ai in range(i1,i2):times[ai]=(start+(end-start)*(ai-i1)/max(i2-i1,1),start+(end-start)*(ai-i1+1)/max(i2-i1,1))
   for i in range(0,len(source),7):
    end=min(i+7,len(source));start=max(0,times[i][0]);finish=max(start+.08,times[end-1][1])
    finish=min(finish,rec['seconds']);start=min(start,finish-.01)
    cues.append({'start':elapsed+start,'end':elapsed+finish,'text':turn['speaker'].title()+': '+' '.join(source[i:end])})
   if recorder.words(sentence)!=recorder.words(rec['heard']):disagreements.append({'text':sentence,'heard':rec['heard'],'agreement':rec['agreement']})
   elapsed+=rec['seconds']
  assert abs(elapsed-turn['end'])<.02
 try:next(receipts);raise AssertionError('Unused evidence')
 except StopIteration:pass
 for i,cue in enumerate(cues[:-1]):cue['end']=min(cue['end'],cues[i+1]['start'])
 assert all(c['end']>c['start'] for c in cues)
 return cues,disagreements

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--portraits',type=Path,required=True);ap.add_argument('--course');args=ap.parse_args()
 files=list((ROOT/'output/scenario-recordings').glob('*/episode.json'))
 if args.course:files=[p for p in files if p.parent.name==args.course]
 assert files,'No completed recordings'
 for file in files:
  episode=json.loads(file.read_text(encoding='utf8'));ev=json.loads((file.parent/'voice-verification.json').read_text(encoding='utf8'))
  source=next((ROOT/'docs/media-scripts').glob('*/'+episode['id']+'.video.md'))
  script=parse(source,PROFILE)
  assert episode['turns']==[{**t,'speakerLabel':t['speaker'].title(),'start':old['start'],'end':old['end']} for t,old in zip(script['turns'],episode['turns'])]
  assert len(script['turns'])==len(episode['turns'])
  assert sha((file.parent/'episode.mp3').read_bytes())==ev['audioSha256']
  for r in ev['sentences']:
   char=r['character'];assert r['referenceSha256']==PROFILE['characters'][char]['sha256']
   assert r['agreement']>=.94 and r['speakerScores'][char]>=.6
   assert r['speakerScores'][char]>max(v for c,v in r['speakerScores'].items() if c!=char)
  folder=ROOT/'output/scenario-videos'/episode['id'];folder.mkdir(parents=True,exist_ok=True)
  cues,disagreements=aligned_cues(episode['turns'],ev['sentences'])
  (folder/'captions.vtt').write_text('WEBVTT\n\n'+'\n\n'.join(f'{i+1}\n{recorder.stamp(c["start"])} --> {recorder.stamp(c["end"])}\n{c["text"]}' for i,c in enumerate(cues))+'\n',encoding='utf8',newline='\n')
  # A subtitle track and a readable open-caption band carry the same source text.
  def ass_time(t):return recorder.stamp(t).replace('.',',')[:-1].replace(',', '.')
  ass='[Script Info]\nScriptType: v4.00+\nPlayResX: 1280\nPlayResY: 720\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Arial,27,&H00FFFFFF,&H00FFFFFF,&H00653800,&H00653800,0,0,0,0,100,100,0,0,1,0,0,2,40,40,26,1\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n'
  for c in cues:ass+=f'Dialogue: 0,{ass_time(c["start"])},{ass_time(c["end"])},Default,,0,0,0,,{c["text"]}\n'
  (folder/'captions.ass').write_text(ass,encoding='utf8',newline='\n')
  concat=[]
  for i,turn in enumerate(episode['turns']):
   p=folder/f'frame-{i:03}.png';card(script,turn,args.portraits,p)
   start=0 if i==0 else turn['start'];end=episode['turns'][i+1]['start'] if i+1<len(episode['turns']) else episode['durationSeconds']
   concat.extend([f"file '{p.name}'",f'duration {end-start:.6f}'])
  concat.append(f"file 'frame-{len(episode['turns'])-1:03}.png'")
  (folder/'frames.txt').write_text('\n'.join(concat)+'\n',encoding='utf8')
  subprocess.run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i','frames.txt','-i',str((file.parent/'episode.mp3').resolve()),'-vf','ass=captions.ass','-t',str(episode['durationSeconds']),'-r','12','-c:v','libx264','-preset','veryfast','-tune','stillimage','-crf','24','-pix_fmt','yuv420p','-threads','2','-c:a','aac','-b:a','96k','-movflags','+faststart','episode.mp4'],cwd=folder,check=True)
  (folder/'poster.png').write_bytes((folder/'frame-000.png').read_bytes())
  transcript=episode['title']+'\n\n'+'\n\n'.join(t['speaker'].title()+': '+t['text'] for t in episode['turns'])+'\n'
  (folder/'transcript.txt').write_text(transcript,encoding='utf8',newline='\n')
  assets={k:sha((folder/v).read_bytes())+Path(v).suffix for k,v in {'media':'episode.mp4','captions':'captions.vtt','transcript':'transcript.txt','poster':'poster.png'}.items()}
  assert (folder/'episode.mp4').stat().st_size<=32*1024*1024
  chapters=[{'title':'Scene '+str(s['number']),'start':next(t['start'] for t in episode['turns'] if t['scene']==s['number'])} for s in script['scenes']]
  manifest={'format':'course-media-v1','id':'scenario-'+script['id'],'title':script['title'],'kind':'video','summary':'An illustrated workplace scenario with the recurring cast. Includes spoken scene descriptions, captions and a full transcript.','pages':['/courses/'+script['id']],**assets,'durationSeconds':episode['durationSeconds'],'chapters':chapters}
  save(folder/'manifest.json',manifest)
  save(folder/'verification.json',{'course':script['id'],'sourceSha256':script['sourceSha256'],'voiceProfile':PROFILE['id'],'cast':script['voiceAssignments'],'assets':assets,'captionTiming':'Source words mapped to recognition word timestamps','speechDifferences':disagreements,'durationSeconds':episode['durationSeconds'],'portraitHashes':{c:v['portraitSha256'] for c,v in PROFILE['characters'].items()}})
  print('RENDERED',script['id'],episode['durationSeconds'],'seconds;',len(disagreements),'recognition differences to review',flush=True)
if __name__=='__main__':main()
