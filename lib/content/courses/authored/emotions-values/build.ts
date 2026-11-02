import podcasts from './podcasts.json';
import type { CoursePack, Lesson, Source } from '../../source-types';

export type PracticeLesson = {
  title: string; objective: string; teaching: string; example: string; practice: string;
  reflection: string; question: string; answers: [string,string,string]; feedback: [string,string,string];
  check: [string,string,string,string,string];
};
export type PracticeCourse = {
  id: string; number: number; title: string; subtitle: string; image: string; alt: string;
  lessons: PracticeLesson[]; sources: Source[]; aid: {heading:string;items:string[]}[];
};
const html = (text:string) => text.trim().split(/\n\s*\n/).map(p=>`<p>${p.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</p>`).join('');
export function build(spec: PracticeCourse): CoursePack {
  const podcast=(podcasts as Record<string,{src:string;transcript:string;seconds:number}>)[spec.id];
  return {
    course: {
      id:spec.id,indexNumber:1600+spec.number,seriesLabel:'Emotions, Values, and Everyday Practice · '+([1,3].includes(spec.number)?'Foundation':'Intermediate'),
      title:spec.title,subtitle:spec.subtitle,
      scope:'For directors, managers, supervisors, and staff across One DHS and One DSD. Explore at your own pace. Use the situations in the course or a work example you are comfortable considering privately. You choose what to reflect on and share. This learning does not replace required agency training or formal advice.',
      treatment:'Seven lessons with worked examples, decisions with feedback, knowledge checks, reflection, a final practice challenge, and a reusable guide.',
      duration:'About 75–90 minutes, including practice',author:'One DHS / One DSD — People, Access and Culture',
      introAudio:podcast?.src,introTranscript:podcast?.transcript,
      coverImage:spec.image,coverAlt:spec.alt,kind:'course',contentType:'practice',
      learning:{objectives:spec.lessons.map(l=>l.objective),evidence:['Explain your reasoning in the lesson decisions.','Use the final practice challenge to prepare and check a response.','Revisit one change after trying it in your work.'],appliedNextStep:'Choose a situation you recognize, explore a response, and leave with a guide you can use at work.'},
      governance:{contentOwner:'Equity and Inclusion Operations Consultant',reviewers:[],evidenceDate:'2026-10-22',lastReviewed:'Research and authoring review, October 22, 2026; independent subject-matter review not recorded',nextReview:'April 2027 or sooner if relevant guidance changes',updateTriggers:['Changed research or agency guidance','Feedback about accessibility, accuracy, or stereotyping'],relatedDoor:'Use the appropriate agency office for policy, employment, accommodation, safety, or civil-rights matters.',toolkitQuestion:'Whose experience, choices, and access could this decision affect?',status:'current'},
      lessons:spec.lessons.map((l,i):Lesson=>{
        // Rotate the correct choice while keeping feedback attached to its answer.
        const order=[0,1,2].map(j=>(j+i)%3);
        return {id:`${spec.id}-${i+1}`,number:i+1,title:l.title,summary:l.objective,minutes:i===6?18:10,
          learning:{objective:l.objective,takeaways:[l.objective,l.check[4]],evidence:l.practice,appliedNextStep:l.practice},
          scenario:{context:l.example,prompt:l.question,options:order.map(j=>({label:l.answers[j],response:l.feedback[j],recommended:j===0}))},
          transfer:{prompt:l.reflection,options:['Use the situation in this lesson.','Choose a private work example without identifying anyone.','Return to this reflection later.']},
          blocks:[
            {type:'text',heading:l.title,body:html(l.teaching)},
            {type:'text',heading:'Consider this situation',body:html(l.example)},
            {type:'text',heading:i===6?'Bring it together':'Try it in your own words',body:html(l.practice)},
            {type:'accordion',heading:'Check your reasoning',items:[{title:'What could help here?',body:html(l.feedback[0]+' '+l.check[4])},{title:'A question to revisit',body:html(l.reflection)}]},
            {type:'knowledgeCheck',id:`${spec.id}-${i+1}-check`,question:l.check[0],options:order.map(j=>({text:l.check[j+1],correct:j===0})),feedbackCorrect:l.check[4],feedbackIncorrect:l.check[4]},
          ]};
      }),
    },
    jobAid:{title:`${spec.title}: practice guide`,subtitle:spec.subtitle,use:{purpose:'Keep these questions nearby when you want to prepare a conversation or think through a next step.',remember:['Ask rather than assume.','Keep participation and personal reflection voluntary.','Check both the interaction and the conditions that shape it.'],doNext:'Choose one change within your responsibility, agree on a review point, and use what you learn to adjust it.'},sections:spec.aid},
    sources:spec.sources,
  };
}
export const research = {
  ability:{title:'Mayer, Caruso, and Salovey (2016) — The Ability Model of Emotional Intelligence',href:'https://scholars.unh.edu/psych_facpub/320/',note:'Research framework for reasoning with emotional information. The original practice exercises here are not an intelligence test or a validated assessment.'},
  regulation:{title:'Gross (1998) — Antecedent- and response-focused emotion regulation',href:'https://pubmed.ncbi.nlm.nih.gov/9457784/',note:'Experimental research distinguishing reappraisal and suppression. Laboratory findings do not establish one universally best response in every workplace situation.'},
  measurement:{title:'O’Connor and colleagues (2019) — The Measurement of Emotional Intelligence',href:'https://doi.org/10.3389/fpsyg.2019.01116',note:'Review of ability, trait, and mixed approaches and their measurement limits. Course completion is not an emotional-intelligence score.'},
  values:{title:'Sagiv and Schwartz (2022) — Personal Values Across Cultures',href:'https://doi.org/10.1146/annurev-psych-020821-125100',note:'Research review of value priorities, compatibility, conflict, and behavior. Group patterns do not determine an individual’s preferences.'},
  humility:{title:'AHRQ — Consider Culture',href:'https://www.ahrq.gov/health-literacy/improve/precautions/tool10.html',note:'Healthcare guidance on asking about individual preferences and cultural humility; the public-service cases here are original learning examples.'},
  clas:{title:'HHS Office of Minority Health — National CLAS Standards',href:'https://thinkculturalhealth.hhs.gov/clas',note:'A framework for culturally and linguistically appropriate services. Check applicable agency requirements with the responsible office.'},
  workshop:{title:'Cultural Intelligence Workshop Cohort 1 — adaptation credit',href:'/learn/emotions-and-values#sources',note:'The cultural-values reflection course adapts concepts and reflection topics from a DHS workshop presented by Verona Mitchell (slides dated October 19, 2021). The original workshop is retired from the learning catalog. No proprietary profile, assessment items, or certification is reproduced.'},
};
