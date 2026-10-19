import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { BASE_BANK, createExam, emptyStore, restoreStore, type Question } from "../src/model";

type Exercise = NonNullable<Question["exercise"]>;
// Parse the visible question, not the generator's recorded expected answer.
function captures(q:Question, pattern:RegExp):string[]{
  const match=q.question.match(pattern);
  if (!match) throw new Error(`Cannot parse ${q.id}: ${q.question}`);
  return match.slice(1);
}
function numeric(q:Question,pattern:RegExp):number[]{return captures(q,pattern).map(Number)}
function lists(q:Question):number[][]{
  return [...q.question.matchAll(/\[([\d, ]+)\]/g)].map(m=>m[1].split(",").map(Number));
}
function parseInputs(q:Question,kind:string):(string|number|null)[]{
  const n=(r:RegExp)=>numeric(q,r);
  switch(kind){
    case "C:bin-dec":return captures(q,/2진수 ([01]+)을/);
    case "C:oct-dec":return captures(q,/8진수 ([0-7]+)를/);
    case "C:hex-dec":return captures(q,/16진수 ([0-9A-F]+)를/);
    case "C:dec-bin":case "C:dec-oct":case "C:dec-hex":return n(/10진수 (\d+)를/);
    case "C:bytes-bits":return n(/때 (\d+)바이트는/);
    case "C:kib-bytes":return n(/때 (\d+)KiB는/);
    case "C:mib-kib":return n(/때 (\d+)MiB는/);
    case "C:gib-mib":return n(/때 (\d+)GiB는/);
    case "C:bit-states":return n(/^(\d+)비트의/);
    case "C:unsigned-max":return n(/부호 없는 (\d+)비트/);
    case "C:address-count":return n(/주소선 (\d+)개/);
    case "C:memory-bytes":return n(/주소가 (\d+)비트이고 주소 하나당 (\d+)바이트/);
    case "C:bitmap-bytes":case "C:bitmap-kib":return n(/^(\d+)×(\d+)화소, 화소당 (\d+)비트/);
    case "C:gray-levels":return n(/화소마다 (\d+)비트/);
    case "C:pcm-bytes":return n(/주파수 (\d+)Hz, 표본당 (\d+)비트, (\d+)채널, 길이 (\d+)초/);
    case "C:pcm-bitrate":return n(/주파수 (\d+)Hz, 표본당 (\d+)비트, (\d+)채널/);
    case "C:video-frames":return n(/초당 (\d+)프레임으로 (\d+)초/);
    case "C:video-bytes":return n(/프레임 (\d+)×(\d+)화소, 화소당 (\d+)비트, 초당 (\d+)프레임인 (\d+)초/);
    case "C:transfer-seconds":return n(/^(\d+)MB 파일을 (\d+)Mbps/);
    case "C:transfer-mb":return n(/^(\d+)Mbps로 (\d+)초/);
    case "C:storage-file-count":return n(/가능한 (\d+)MiB 공간에 각각 (\d+)KiB/);
    case "C:compression-saved":case "C:compression-percent":return n(/(?:원본 )?(\d+)MB(?: 파일을|를) (\d+)MB/);
    case "C:kibit-transfer":return n(/^(\d+)KiB 자료를 (\d+)Kibit/);
    case "C:ipv4-hosts":return n(/IPv4 \/(\d+) 서브넷/);
    case "C:subnet-count":return n(/비트 중 (\d+)비트를/);
    case "C:cluster-count":return n(/^(\d+)KiB 파일을 클러스터당 (\d+)KiB/);
    case "C:allocated-kib": {const [cluster,size]=n(/클러스터당 (\d+)KiB인 볼륨에서 (\d+)KiB 파일/);return [size,cluster]}
    case "S:sum":case "S:average":case "S:max":case "S:min":return n(/순서대로 (\d+), (\d+), (\d+)가/);
    case "S:count":case "S:counta":case "S:countblank":return [...q.question.matchAll(/숫자 (\d+)|텍스트 "([^"]+)"|(실제 빈 셀)/g)].map(m=>m[1]?Number(m[1]):m[2]??null);
    case "S:countif":return [...lists(q)[0],...n(/COUNTIF\(A1:A4,">=(\d+)"\)/)];
    case "S:sumif":return lists(q)[0];
    case "S:if":return n(/IF\((\d+)>=60,"통과","보충"\)/);
    case "S:abs":case "S:int":case "S:trunc":return n(/=\w+\((-?[\d.]+)\)/);
    case "S:round":case "S:roundup":case "S:rounddown": {const [integer,frac,places]=captures(q,/=\w+\((\d+)\.(\d{1,3}),(2)\)/);return [Number(integer)*1000+Number(frac.padEnd(3,"0")),1000,Number(places)]}
    case "S:mod":case "S:power":return n(/=\w+\((\d+),(\d+)\)/);
    case "S:left":case "S:right":{const [t,k]=captures(q,/=\w+\("([^"]+)",(\d+)\)/);return [t,Number(k)]}
    case "S:mid":{const [t,s,k]=captures(q,/=MID\("([^"]+)",(\d+),(\d+)\)/);return [t,Number(s),Number(k)]}
    case "S:len":case "S:upper":case "S:lower":case "S:trim":return captures(q,/=\w+\("([^"]+)"\)/);
    case "S:find":case "S:search":return captures(q,/=\w+\("([^"]+)","([^"]+)"\)/);
    case "S:choose":return n(/CHOOSE\((\d+),(\d+),(\d+),(\d+)\)/);
    case "S:index":{
      const pairs=[...q.question.matchAll(/\((\d+),(\d+)\)/g)].flatMap(m=>[+m[1],+m[2]]);
      return [...pairs,...n(/INDEX\(A1:B3,(\d+),(\d+)\)/)]
    }
    case "S:match":return [...lists(q)[0],...n(/MATCH\((\d+),A1:A4,0\)/)];
    case "S:vlookup":{
      const pairs=[...q.question.matchAll(/\((\d+),(\d+)\)/g)];
      return [...pairs.map(m=>+m[1]),...pairs.map(m=>+m[2]),...n(/VLOOKUP\((\d+),A1:B3,2,FALSE\)/)]
    }
    case "S:hlookup":return [...lists(q).flat(),...n(/HLOOKUP\((\d+),A1:C2,2,FALSE\)/)];
    case "S:row":return n(/ROW\(D(\d+)\)/);
    case "S:column":return [captures(q,/COLUMN\(([A-Z])9\)/)[0].charCodeAt(0)-64];
    case "S:rows":return n(/ROWS\(B(\d+):D(\d+)\)/);
    default:throw new Error(`Missing visible-input parser ${kind}`);
  }
}
const sum=(v:number[])=>v.reduce((a,b)=>a+b,0);
function evaluate(kind:string,args:(string|number|null)[]):number|string{
  const v=args as number[];
  const t=args as string[];
  switch(kind){
    case "C:bin-dec":return parseInt(t[0],2);
    case "C:oct-dec":return parseInt(t[0],8);
    case "C:hex-dec":return parseInt(t[0],16);
    case "C:dec-bin":case "C:dec-oct":case "C:dec-hex":return v[0];
    case "C:bytes-bits":return v[0]*8;
    case "C:kib-bytes":case "C:mib-kib":case "C:gib-mib":return v[0]*1024;
    case "C:bit-states":case "C:address-count":case "C:gray-levels":case "C:subnet-count":return 2**v[0];
    case "C:unsigned-max":return 2**v[0]-1;
    case "C:memory-bytes":return 2**v[0]*v[1];
    case "C:bitmap-bytes":return v[0]*v[1]*(v[2]/8);
    case "C:bitmap-kib":return v[0]*v[1]*(v[2]/8)/1024;
    case "C:pcm-bytes":return v[0]*v[3]*v[2]*(v[1]/8);
    case "C:pcm-bitrate":return v[0]*v[1]*v[2];
    case "C:video-frames":return v[0]*v[1];
    case "C:video-bytes":return (v[0]*v[1]*v[2]*v[3]*v[4])/8;
    case "C:transfer-seconds":return (v[0]*1000000*8)/(v[1]*1000000);
    case "C:transfer-mb":return (v[0]*1000000*v[1])/8000000;
    case "C:storage-file-count":return Math.floor(v[0]*1024/v[1]);
    case "C:compression-saved":return v[0]-v[1];
    case "C:compression-percent":return (100*v[1])/v[0];
    case "C:kibit-transfer":return (v[0]*1024*8)/(v[1]*1024);
    case "C:ipv4-hosts":return 2**(32-v[0])-2;
    case "C:cluster-count":return Math.floor((v[0]+v[1]-1)/v[1]);
    case "C:allocated-kib":return Math.floor((v[0]+v[1]-1)/v[1])*v[1];
    case "S:sum":return sum(v);
    case "S:average":return sum(v)/v.length;
    case "S:max":return [...v].sort((a,b)=>b-a)[0];
    case "S:min":return [...v].sort((a,b)=>a-b)[0];
    case "S:count":return args.filter(x=>typeof x==="number").length;
    case "S:counta":return args.filter(x=>x!==null).length;
    case "S:countblank":return args.filter(x=>x===null).length;
    case "S:countif":return v.slice(0,4).filter(x=>x>=v[4]).length;
    case "S:sumif":return sum(v.filter((_,i)=>["가","나","가"][i]==="가"));
    case "S:if":return v[0]>=60?"통과":"보충";
    case "S:abs":return v[0]<0?-v[0]:v[0];
    case "S:int":return Math.floor(v[0]);
    case "S:trunc":return v[0]<0?Math.ceil(v[0]):Math.floor(v[0]);
    // Generated inputs are positive thousandths rounded to hundredths.
    // Integer arithmetic is independent of the compiler's Python Decimal quantize.
    case "S:round":return Math.floor((v[0]+5)/10)/100;
    case "S:roundup":return Math.floor((v[0]+9)/10)/100;
    case "S:rounddown":return Math.floor(v[0]/10)/100;
    case "S:mod":return v[0]-v[1]*Math.floor(v[0]/v[1]);
    case "S:power":return Array.from({length:v[1]},()=>v[0]).reduce((a,b)=>a*b,1);
    case "S:left":return t[0].substring(0,v[1]);
    case "S:right":return t[0].substring(t[0].length-v[1]);
    case "S:mid":return t[0].substring(v[1]-1,v[1]-1+v[2]);
    case "S:len":return Array.from(t[0]).length;
    case "S:find":return t[1].indexOf(t[0])+1;
    case "S:search":return t[1].toLowerCase().indexOf(t[0].toLowerCase())+1;
    case "S:upper":return t[0].toUpperCase();
    case "S:lower":return t[0].toLowerCase();
    case "S:trim":return t[0].replace(/^ +| +$/g,"").replace(/ +/g," ");
    case "S:choose":return v.slice(1)[v[0]-1];
    case "S:index":return [v.slice(0,2),v.slice(2,4),v.slice(4,6)][v[6]-1][v[7]-1];
    case "S:match":return v.slice(0,4).findIndex(x=>x===v[4])+1;
    case "S:vlookup":case "S:hlookup":return v.slice(0,3).map((key,i)=>({key,value:v[i+3]})).find(x=>x.key===v[6])!.value;
    case "S:row":case "S:column":return v[0];
    case "S:rows":return Array.from({length:v[1]-v[0]+1}).length;
    default:throw new Error(`Unknown evaluation ${kind}`);
  }
}
function decode(choice:string,e:Exercise):string|number{
  if(e.display==="quoted")return JSON.parse(choice);
  const base=e.display==="binary"?2:e.display==="octal"?8:e.display==="hex"?16:null;
  if(base!==null) {
    if(!({2:/^[01]+$/,8:/^[0-7]+$/,16:/^[0-9A-F]+$/}[base]!.test(choice)))throw new Error(`Invalid encoded choice ${choice}`);
    return parseInt(choice,base);
  }
  const suffix=e.unit?` ${e.unit}`:"";
  if(suffix&&!choice.endsWith(suffix))throw new Error(`Incorrect unit ${choice}`);
  const raw=suffix?choice.slice(0,-suffix.length):choice;
  if(!/^-?\d+(?:\.\d+)?$/.test(raw))throw new Error(`Not numeric: ${choice}`);
  return Number(raw);
}
function equal(a:number|string,b:number|string){return typeof a==="number"&&typeof b==="number"?Math.abs(a-b)<1e-8:a===b}

describe("기록 호환성과 1,000문항 구성",()=>{
  it("기존 60개 ID·본문·정답·해설·메타데이터가 모두 동일하다",()=>{
    const digest=createHash("sha256").update(JSON.stringify(BASE_BANK.slice(0,60))).digest("hex");
    expect(digest).toBe("afcce64d36fb5fa49157b5ecc865418bface2ac3d97c19ba7b5973386ccd5a06");
    const old=emptyStore();old.bookmarks=["CL2-C-001"];old.wrongIds=["CL2-S-030"];
    expect(restoreStore(JSON.stringify(old))).toEqual(old);
    expect(BASE_BANK.some(q=>q.id===old.bookmarks[0])).toBe(true);
  });
  it("개별 작성 340개, 66개 조건 유형×10, 과목별 500개",()=>{
    expect(BASE_BANK).toHaveLength(1000);
    for(const subject of ["컴퓨터 일반","스프레드시트 일반"])expect(BASE_BANK.filter(q=>q.subject===subject)).toHaveLength(500);
    const variants=BASE_BANK.filter(q=>q.family);
    expect(variants).toHaveLength(660);
    expect(BASE_BANK.filter(q=>!q.family)).toHaveLength(340);
    const families=new Set(variants.map(q=>q.family));expect(families.size).toBe(66);
    for(const family of families){
      const qs=variants.filter(q=>q.family===family);
      expect(qs).toHaveLength(10);
      expect(new Set(qs.map(q=>JSON.stringify(q.exercise!.inputs))).size).toBe(10);
    }
  });
  it("확장된 시험에서도 조건 유형을 중복 추출하지 않는다",()=>{
    for(let n=0;n<30;n++){
      const exam=createExam(BASE_BANK,"main");
      const families=exam.questions.filter(q=>q.family).map(q=>q.family);
      expect(new Set(families).size).toBe(families.length);
      expect(exam.questions).toHaveLength(40);
    }
  });
});
describe("660개 조건 변형의 본문·정답·단위 독립 검증",()=>{
  for(const q of BASE_BANK.filter(q=>q.exercise))it(q.id+" "+q.exercise!.kind,()=>{
    const e=q.exercise!;
    const units: Record<string,string> = {
      "bytes-bits":"비트", "kib-bytes":"바이트", "mib-kib":"KiB", "gib-mib":"MiB",
      "bit-states":"가지", "unsigned-max":"", "address-count":"개", "memory-bytes":"바이트",
      "bitmap-bytes":"바이트", "bitmap-kib":"KiB", "gray-levels":"가지", "pcm-bytes":"바이트",
      "pcm-bitrate":"bps", "video-frames":"프레임", "video-bytes":"바이트", "transfer-seconds":"초",
      "transfer-mb":"MB", "storage-file-count":"개", "compression-saved":"MB", "compression-percent":"%",
      "kibit-transfer":"초", "ipv4-hosts":"개", "subnet-count":"개", "cluster-count":"개", "allocated-kib":"KiB"
    };
    const [subject,kind]=e.kind.split(":");
    expect(e.unit).toBe(subject==="C"?(units[kind]??""):"");
    const quoted=["if","left","right","mid","upper","lower","trim"];
    const display=subject==="S"&&quoted.includes(kind)?"quoted":kind==="dec-bin"?"binary":kind==="dec-oct"?"octal":kind==="dec-hex"?"hex":"number";
    expect(e.display).toBe(display);
    const parsed=parseInputs(q,e.kind);
    expect(parsed).toEqual(e.inputs);
    const expected=evaluate(e.kind,parsed);
    expect(equal(e.expected,expected)).toBe(true);
    const choices=q.choices.map(c=>decode(c,e));
    expect(equal(choices[q.answer-1],expected)).toBe(true);
    expect(choices.filter(c=>equal(c,expected))).toHaveLength(1);
    expect(new Set(choices).size).toBe(4);
    expect(q.family).toBe('cl2-'+e.kind.toLowerCase().replace(':','-'));
    expect(q.explanation).toContain("기출이 아니다");
  });
});
