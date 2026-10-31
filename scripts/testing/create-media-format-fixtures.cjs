const path = require('node:path');
const sharp = require('sharp');
const exec = require('node:util').promisify(require('node:child_process').execFile);
const ffmpeg = require('ffmpeg-static');
(async () => {
  const dir = path.resolve('evidence/consultant-analysis-20261005/upload-fixtures');
  const file = name => path.join(dir, name);
  await sharp(file('fictional-access.png')).jpeg().toFile(file('fictional-access.jpg'));
  await sharp(file('fictional-access.png')).webp().toFile(file('fictional-access.webp'));
  for (const [name, args] of [
    ['fictional-recording.mp3', ['-i', file('fictional-recording.wav'), '-c:a', 'libmp3lame']],
    ['fictional-recording.m4a', ['-i', file('fictional-recording.wav'), '-c:a', 'aac']],
    ['fictional-access.webm', ['-i', file('fictional-access.mp4'), '-c:v', 'libvpx-vp9', '-b:v', '300k', '-c:a', 'libopus']],
  ]) {
    await exec(ffmpeg, ['-y', '-nostdin', '-hide_banner', '-loglevel', 'error', '-threads', '1', ...args, file(name)], { timeout: 45000, windowsHide: true });
  }
  console.log('Created five fictional media format variants.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
