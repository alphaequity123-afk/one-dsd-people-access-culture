"""Verify encoded scenario packages before publication."""
import argparse,hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def seconds(t):
 h,m,s=t.split(':');return int(h)*3600+int(m)*60+float(s)
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--partial',action='store_true');args=ap.parse_args()
 files=list((ROOT/'output/scenario-videos').glob('*/manifest.json'))
 if not args.partial:assert len(files)==13
 total=0
 for file in files:
  folder=file.parent;m=json.loads(file.read_text(encoding='utf8'));v=json.loads((folder/'verification.json').read_text(encoding='utf8'))
  p=folder/'episode.mp4'
  info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]))
  video=next(s for s in info['streams'] if s['codec_type']=='video');audio=next(s for s in info['streams'] if s['codec_type']=='audio')
  assert (video['width'],video['height'],video['codec_name'],video['pix_fmt'])==(1280,720,'h264','yuv420p')
  assert audio['codec_name']=='aac'
  duration=float(info['format']['duration']);assert abs(duration-m['durationSeconds'])<.3
  decode=subprocess.run(['ffmpeg','-v','error','-i',str(p),'-f','null','-'],capture_output=True)
  assert decode.returncode==0 and not decode.stderr,decode.stderr
  for field,name in [('media','episode.mp4'),('captions','captions.vtt'),('transcript','transcript.txt'),('poster','poster.png')]:assert m[field]==sha(folder/name)+Path(name).suffix
  captions=(folder/'captions.vtt').read_text(encoding='utf8');assert captions.startswith('WEBVTT\n\n')
  previous=0;count=0
  for line in captions.splitlines():
   if ' --> ' in line:
    start,end=map(seconds,line.split(' --> '));assert previous<=start<end<=duration+.1;previous=end;count+=1
  assert count>10
  assert m['chapters'][0]['start']>=0 and all(a['start']<b['start'] for a,b in zip(m['chapters'],m['chapters'][1:]))
  v['videoVerified']={'resolution':'1280x720','video':'H.264','audio':'AAC','fullDecode':'passed','captions':'ordered, non-overlapping and within duration','hashes':'all assets match manifest'}
  (folder/'verification.json').write_text(json.dumps(v,indent=2)+'\n',encoding='utf8',newline='\n')
  total+=duration;print('VERIFIED',folder.name,round(duration,1),'seconds',flush=True)
 print('Total',len(files),'videos,',round(total/60,1),'minutes')
if __name__=='__main__':main()
