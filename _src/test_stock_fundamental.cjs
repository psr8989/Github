const assert=require('node:assert/strict');const M=require('../dashboards/stock-outlook/model.js');
const neutral={kr:3,us:3.625,fx:1345.9,robot:0,robotImpact:0,growth:[0,0,0],multiple:[0,0,0],other:[0,0,0]};
for(let i=0;i<3;i++){
 const p=100000,base=M.calculate(p,i,neutral);assert.equal(base.target,p);
 const growth=structuredClone(neutral);growth.growth[i]=20;assert.equal(M.calculate(p,i,growth).target,120000);
 const rate=structuredClone(neutral);rate.us+=.25;assert.ok(M.calculate(p,i,rate).target<p);
 const fx=structuredClone(neutral);fx.fx*=1.1;assert.ok(M.calculate(p,i,fx).target>p);
 for(const a of Object.values(M.presets)){
  const r=M.calculate(p,i,a);assert.ok(r.target>0);assert.ok(Math.abs(p+r.contributions.reduce((x,y)=>x+y,0)-r.target)<1e-8);
  assert.equal(M.path(p,r.target,0),p);assert.ok(Math.abs(M.path(p,r.target,1)-r.target)<1e-7);
 }
}
const robot=structuredClone(neutral);robot.robot=50;robot.robotImpact=10;assert.equal(M.calculate(100000,0,robot).target,105000);assert.equal(M.calculate(100000,1,robot).target,100000);
const negative=structuredClone(robot);negative.robotImpact=-10;assert.equal(M.calculate(100000,0,negative).target,95000);
console.log('PASS: neutral identity, earnings sensitivity, rate/FX directions, robot scope, contribution reconciliation and path endpoints');
