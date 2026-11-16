from pathlib import Path
s=Path('output/check-live-fifth-release.cjs').read_text(encoding='utf8')
s=s.replace("'ec17403'","'0872007'").replace("'0872007','lib/content/professional-language-revisions.json').revisions;","'7c3b8a0','lib/content/professional-language-revisions.json').revisions;")
s=s.replace("for(const c of at('0872007','lib/content/course-language-revisions.json').courses)","for(const c of at('7c3b8a0','lib/content/course-language-revisions.json').courses)")
start=s.index('for(const record of JSON.parse(');end=s.index('\n\nconst clean=',start)
s=s[:start]+"for(const c of at('7c3b8a0','lib/content/course-partial-language-revisions.json').courses){tasks.push({target:'partial-course.'+c.courseId,url:root+'/courses/'+c.courseId,expect:c.changes.filter(x=>x.path[1]!=='governance').map(x=>x.after)});}"+s[end:]
s=s.replace('live-fifth-release-check.json','live-sixth-release-check.json').replace("commit:'0872007'","commit:'7c3b8a0'")
Path('output/check-live-sixth-release.cjs').write_text(s,encoding='utf8')
