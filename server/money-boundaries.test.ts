import {moneyForInterval,coveredMilliseconds} from "../shared/financial-intervals.js";
import { describe, expect, it } from "vitest";
import { moneyAdd, moneyAverage, moneyInput, moneyMinor, moneyRatio, moneySubtract, moneySum } from "../shared/money.js";
import { requireCompleteFinancialEvidence } from "./financial-completeness.js";

describe("monetary boundaries", () => {
  it("rejects fractional minor units, coercion and out-of-range input before persistence", () => {
    for (const invalid of [1.005, "1.005", "", " 1.00", "1e3", Number.NaN, Infinity, "1000000000000", -1, 0])
      expect(moneyInput().safeParse(invalid).success).toBe(false);
    expect(moneyInput().parse("0.01")).toBe(0.01);
    expect(moneyInput({zero:true}).parse(0)).toBe(0);
    expect(moneyInput({signed:true}).parse("-0.01")).toBe(-0.01);
  });
  it("preserves exact cents during collection, refund and aggregate calculations", () => {
    expect(moneyAdd(0.1,0.2)).toBe(0.3);
    expect(moneySubtract(0.3,0.1)).toBe(0.2);
    expect(moneySum(Array(10000).fill("0.01"))).toBe(100);
    expect(moneyMinor("999999999999.99")).toBe(99999999999999n);
    expect(()=>moneyAdd("999999999999.99","0.01")).toThrow("range");
  });
  it("rounds apportioned cents explicitly with symmetric ties", () => {
    expect(moneyRatio("0.01",1,2)).toBe(0.01);
    expect(moneyRatio("-0.01",1,2)).toBe(-0.01);
    expect(moneyRatio(10,1,3)).toBe(3.33);
  });
  it("refuses a financial total when any bounded query has omitted evidence", () => {
    expect(()=>requireCompleteFinancialEvidence([Array(11),10],[[],10])).toThrow("No partial financial total");
    expect(()=>requireCompleteFinancialEvidence([Array(10),10])).not.toThrow();
  });
});

describe("financial period conservation",()=>{
  it("preserves a minor unit across adjacent periods instead of rounding it twice",()=>{
    const start=new Date(0),end=new Date(1);
    expect(moneyForInterval('0.01',start,end,start,start)).toBe(0.01);
    expect(moneyForInterval('0.01',start,end,end,end)).toBe(0);
    expect(moneyForInterval('0.01',start,end,start,end)).toBe(0.01);
    expect(moneyForInterval('-0.01',start,end,start,start)).toBe(-0.01);
  });
  it("counts overlapping coverage once and preserves a one-millisecond gap",()=>{
    expect(coveredMilliseconds([{start:new Date(0),end:new Date(2)},{start:new Date(2),end:new Date(4)}],new Date(0),new Date(4))).toBe(5);
    expect(coveredMilliseconds([{start:new Date(0),end:new Date(1)},{start:new Date(3),end:new Date(4)}],new Date(0),new Date(4))).toBe(4);
  });
  it("averages valid large balances without overflowing an intermediate sum",()=>{
    expect(moneyAverage('999999999999.99','999999999999.99')).toBe(999999999999.99);
    expect(moneyAverage('0.00','0.01')).toBe(0.01);
    expect(moneyAverage('0.00','-0.01')).toBe(-0.01);
  });
});
