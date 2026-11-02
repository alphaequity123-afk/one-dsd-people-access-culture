/** Offers a plain-text file from the browser; nothing is sent anywhere. */
export function downloadText(name: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Pauses every other audio or video on the page so only one plays at a time. */
export function pauseOtherMedia(current: HTMLMediaElement): void {
  document.querySelectorAll<HTMLMediaElement>('audio,video').forEach(other => { if (other !== current) other.pause(); });
}
