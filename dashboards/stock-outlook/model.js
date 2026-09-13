/* Relative operating-profit valuation: transparent assumptions, not a fitted causal model. */
(function(root){
'use strict';
const facts={asOf:'2026-09-11',krRate:3,usRate:3.625,usdkrw:1345.9,usMedian2026:3.8,op:[2.850888,60.5426,89.5]};
const presets={
 stress:{kr:3.5,us:4.125,fx:1400,robot:0,robotImpact:0,growth:[-20,-25,-20],multiple:[-15,-20,-15],other:[-8,-5,-5]},
 base:{kr:3,us:3.8,fx:1345.9,robot:0,robotImpact:0,growth:[5,20,15],multiple:[0,-10,-5],other:[0,0,0]},
 upside:{kr:2.75,us:3.375,fx:1300,robot:50,robotImpact:10,growth:[20,40,35],multiple:[5,5,5],other:[3,3,3]}
};
// Fixed, disclosed sensitivity assumptions; all price changes are relative to the observed price.
const sensitivity={kr:[3,2,2],us:[2,4,4],fx:[.3,.5,.4]};
function calculate(last,index,a){
 const growth=a.growth[index]/100, other=a.other[index]/100;
 const fx=sensitivity.fx[index]*(a.fx/facts.usdkrw-1);
 const op=facts.op[index]*(1+growth)*(1+fx)*(1+other);
 const rate=Math.exp((-sensitivity.kr[index]*(a.kr-facts.krRate)-sensitivity.us[index]*(a.us-facts.usRate))/100);
 const earnings=last*(1+growth),currency=earnings*(1+fx),external=currency*(1+other),rerated=external*(1+a.multiple[index]/100),discounted=rerated*rate;
 const robot=index===0?last*(a.robot/100)*(a.robotImpact/100):0;
 const target=discounted+robot;
 if(!Number.isFinite(target)||target<=0)throw new RangeError("Nonpositive scenario price");
 return {target,op,rate,fx,contributions:[earnings-last,currency-earnings,external-currency,rerated-external,discounted-rerated,robot],change:target/last-1};
}
function path(last,target,fraction){return last*Math.exp(Math.log(target/last)*fraction);}
const api={facts,presets,sensitivity,calculate,path};root.FUNDAMENTAL=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
