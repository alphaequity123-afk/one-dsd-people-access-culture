const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const { promisify } = require('node:util');
const exec = promisify(require('node:child_process').execFile);
(async()=>{
  const dir = path.resolve('evidence/consultant-analysis-20261005/upload-fixtures');
  await fs.mkdir(dir,{recursive:true});
  const svg = '<svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg"><rect width="1280" height="720" fill="#12324a"/><g fill="white" font-family="Arial" font-size="42"><text x="65" y="145">FICTIONAL SERVICE ACCESS EXERCISE</text><text x="65" y="260">Remote requests completed: 48 of 60</text><text x="65" y="340">In-person requests completed: 12 of 30</text><text x="65" y="445">These figures do not explain the causes.</text><text x="65" y="535">Ask service users what would help.</text></g></svg>';
  await sharp(Buffer.from(svg)).png().toFile(path.join(dir,'fictional-access.png'));
  const speech = path.join(dir,'fictional-recording.wav');
  const ffmpeg = require('ffmpeg-static');
  await exec(ffmpeg,['-y','-nostdin','-hide_banner','-loglevel','error','-loop','1','-i',path.join(dir,'fictional-access.png'),'-i',speech,'-t','12','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','-shortest',path.join(dir,'fictional-access.mp4')],{timeout:30000,windowsHide:true});
  console.log('Created fictional PNG and short MP4 with synthetic narration.');
})().catch(()=>{console.error('Fixture generation failed.');process.exitCode=1;});
