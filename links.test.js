const test=require('node:test');const assert=require('node:assert/strict');const {validVideo}=require('../lib/lessons');
test('YouTube is accepted and normalized',()=>{assert.equal(validVideo('https://youtu.be/dQw4w9WgXcQ').id,'dQw4w9WgXcQ');assert.equal(validVideo('https://www.youtube.com/watch?v=dQw4w9WgXcQ').kind,'youtube')});
test('VRT links are external',()=>assert.equal(validVideo('https://www.vrt.be/vrtmax/a-z/').kind,'vrt'));
test('unsafe links rejected',()=>{for(const url of ['http://youtube.com/watch?v=dQw4w9WgXcQ','https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ','javascript:alert(1)','https://localhost/a'])assert.equal(validVideo(url),null) });
