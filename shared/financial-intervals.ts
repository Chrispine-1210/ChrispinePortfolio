import {moneyRatio,moneySubtract} from "./money.js";

// Financial timestamps are UTC instants at JavaScript millisecond precision.
// Source intervals are closed. Adjacent reporting periods must use end+1ms
// as the next start. Cumulative rounding conserves every allocated minor unit.
export function moneyForInterval(amount:string|number,sourceStart:Date,sourceEnd:Date,start:Date,end:Date){
  const origin=sourceStart.getTime(),duration=sourceEnd.getTime()-origin+1;
  if(!Number.isSafeInteger(duration)||duration<=0)throw Error("Invalid financial source interval");
  const left=Math.max(0,Math.min(duration,start.getTime()-origin));
  const right=Math.max(0,Math.min(duration,end.getTime()-origin+1));
  if(right<=left)return 0;
  return moneySubtract(moneyRatio(amount,right,duration),moneyRatio(amount,left,duration));
}

export function coveredMilliseconds(intervals:Array<{start:Date;end:Date}>,start:Date,end:Date){
  const clipped=intervals.map(row=>({start:Math.max(row.start.getTime(),start.getTime()),end:Math.min(row.end.getTime(),end.getTime())}))
    .filter(row=>row.end>=row.start).sort((a,b)=>a.start-b.start);
  let total=0,left:number|undefined,right=0;
  for(const row of clipped){
    if(left===undefined){left=row.start;right=row.end;continue;}
    if(row.start>right+1){total+=right-left+1;left=row.start;right=row.end;}
    else right=Math.max(right,row.end);
  }
  return left===undefined?0:total+right-left+1;
}
