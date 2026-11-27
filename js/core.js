/* Shared basics: the canvas, world size and the fixed 60 fps step. */
const $=id=>document.getElementById(id);
const cv=$('c'),ctx=cv.getContext('2d');
const WH=580,GY=460,STEP=1000/60,ARENA=960;
