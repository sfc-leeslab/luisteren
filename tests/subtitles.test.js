const test=require('node:test');
const assert=require('node:assert/strict');
const {parseCaptions}=require('../public/subtitles');
test('parses SRT and removes timestamps and repeating cues',()=>{
 const s=`1\n00:00:01,000 --> 00:00:03,000\nDag allemaal!\n\n2\n00:00:03,000 --> 00:00:05,000\nDag allemaal!\nWelkom op school.\n\n3\n00:00:05,000 --> 00:00:08,000\nWe leren vandaag over nieuws.`;
 assert.equal(parseCaptions(s,'subtitles.srt'),'Dag allemaal! Welkom op school. We leren vandaag over nieuws.');
});
test('parses VTT with cue labels and markup',()=>{
 const v=`WEBVTT\n\nintro\n00:00:01.000 --> 00:00:04.000 align:start\n<v Spreker>Welkom <b>iedereen</b>!</v>\n\n00:00:05.000 --> 00:00:09.000\nWe gaan beginnen.`;
 assert.equal(parseCaptions(v,'example.vtt'),'Welkom iedereen! We gaan beginnen.');
});
test('plain transcript remains supported',()=>assert.equal(parseCaptions('Een gewone tekst.','transcript.txt'),'Een gewone tekst.'));
test('caption length bounded',()=>assert.ok(parseCaptions('z'.repeat(20000),'x.txt').length<=14000));
