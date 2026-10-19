"""Reviewed original concept manuscripts and deterministic condition families.
Independent evaluations are implemented in tests/expanded-bank.test.ts, not imported here.
"""
from decimal import Decimal, ROUND_HALF_UP, ROUND_UP, ROUND_DOWN
from pathlib import Path
import math

ROOT = Path(__file__).resolve().parents[1]
SUBJECT = {'C':'컴퓨터 일반', 'S':'스프레드시트 일반'}
REVIEW = '자체 제작. 개념 원고·보기·해설 또는 유형별 계산 조건 내부 검토. 외부 자료 직접 대조 및 전문가 검수 미완료(개별 정답). 공식 출제기준의 관련 영역 대조는 docs/content-review.md 참고.'

def number(value):
    return str(int(value)) if float(value).is_integer() else format(value,'.8f').rstrip('0').rstrip('.')

def make_question(id, subject, topic, stem, correct, wrong, explanation, ordinal, **metadata):
    choices=[]
    for c in [correct,*wrong]:
        if c not in choices: choices.append(c)
    if len(choices)<4: raise ValueError(f'Insufficient distinct choices: {id}: {choices}')
    choices=choices[:4]
    # Rotate correct position without changing the stable ID or the manuscript.
    answer=ordinal%4+1
    choices.remove(correct);choices.insert(answer-1,correct)
    return dict(id=id,subject=SUBJECT[subject],topic=topic,question=stem,choices=choices,answer=answer,
                explanation=explanation,difficulty='중',year=None,session=None,type='original',
                sourceUrl='https://github.com/YunSangYeong/Computer-Literacy2/blob/main/docs/content-review.md',
                verificationStatus='reviewed',reviewNote=REVIEW,version='main',
                rights='자체 제작 · Computer-Literacy2 contributors · CC BY 4.0',**metadata)

def concepts(subject):
    source=ROOT/'scripts/manuscripts'/('computer.tsv' if subject=='C' else 'spreadsheet.tsv')
    result=[]
    for group,line in enumerate(source.read_text().splitlines(),1):
        topic,*items=line.split('\t')
        entries=[item.split('~') for item in items]
        if len(entries)!=4 or any(len(e)!=3 for e in entries):raise ValueError(f'Malformed {source}:{group}')
        terms=[e[0] for e in entries]
        for index,(term,definition,detail) in enumerate(entries):
            ordinal=(group-1)*4+index+1
            result.append(make_question(f'CL2-{subject}-CON-{ordinal:03}',subject,topic,
                f'[{topic}] 다음 설명에 해당하는 항목은?\n{definition}',term,[t for t in terms if t!=term],
                f'정답은 {term}이다. {definition} {detail}',ordinal,
                conceptGroup=f'{subject}-{group:02}'))
    return result

def c_case(kind,i):
    n=i+1
    # Each return: question, raw inputs, expected value, unit, display, derivation.
    if kind=='bin-dec':
        v=37+7*i;bits=format(v,'b');weights=' + '.join(str(2**p) for p,b in enumerate(bits[::-1]) if b=='1')
        return f'2진수 {bits}을 10진수로 변환한 값은?', [bits],v,'','number',f'1인 자릿값을 더한다: {weights} = {v}.'
    if kind=='dec-bin':
        v=81+9*i;return f'10진수 {v}를 2진수로 나타낸 것은? (앞자리의 불필요한 0은 쓰지 않는다.)',[v],v,'','binary',f'{v}를 2의 거듭제곱 자릿값으로 분해하면 {format(v,"b")}이다.'
    if kind=='oct-dec':
        v=57+11*i;t=format(v,'o');return f'8진수 {t}를 10진수로 변환한 값은?',[t],v,'','number',f'각 자리에 8의 거듭제곱을 적용하면 {" + ".join(f"{d}×8^{len(t)-1-j}" for j,d in enumerate(t))} = {v}이다.'
    if kind=='dec-oct':
        v=68+13*i;return f'10진수 {v}를 8진수로 나타낸 것은?',[v],v,'','octal',f'8로 나눈 나머지를 아래에서 위로 읽거나 8의 자릿값으로 분해하면 {format(v,"o")}이다.'
    if kind=='hex-dec':
        v=165+17*i;t=format(v,'X');return f'16진수 {t}를 10진수로 변환한 값은? (A=10,…,F=15)',[t],v,'','number',f'16진 각 자리의 숫자값에 16의 자릿값을 곱해 더하면 {v}이다. 예를 들어 맨 오른쪽 자리의 가중치는 1이다.'
    if kind=='dec-hex':
        v=193+19*i;return f'10진수 {v}를 16진수로 나타낸 것은? (영문자는 대문자로 표시)',[v],v,'','hex',f'16으로 나눈 나머지를 역순으로 표시하고 10~15를 A~F로 쓰면 {format(v,"X")}이다.'
    if kind=='bytes-bits':
        v=12+7*i;return f'1바이트=8비트일 때 {v}바이트는 몇 비트인가?',[v],v*8,'비트','number',f'{v}바이트 × 8비트/바이트 = {v*8}비트.'
    if kind=='kib-bytes':
        v=3+2*i;return f'1KiB=1,024바이트일 때 {v}KiB는 몇 바이트인가?',[v],v*1024,'바이트','number',f'{v} × 1,024 = {v*1024}바이트. 십진 kB와 구별한다.'
    if kind=='mib-kib':
        v=5+3*i;return f'1MiB=1,024KiB일 때 {v}MiB는 몇 KiB인가?',[v],v*1024,'KiB','number',f'{v}MiB × 1,024KiB/MiB = {v*1024}KiB.'
    if kind=='gib-mib':
        v=2+2*i;return f'1GiB=1,024MiB일 때 {v}GiB는 몇 MiB인가?',[v],v*1024,'MiB','number',f'{v}GiB × 1,024MiB/GiB = {v*1024}MiB.'
    if kind=='bit-states':
        b=3+i;return f'{b}비트의 모든 비트 조합으로 서로 다른 상태를 최대 몇 가지 표현할 수 있는가?',[b],2**b,'가지','number',f'각 비트에 2가지 가능성이 있으므로 2^{b} = {2**b}가지이다.'
    if kind=='unsigned-max':
        b=4+i;return f'부호 없는 {b}비트 이진 정수의 최댓값은?',[b],2**b-1,'','number',f'0부터 2^{b}-1까지 표현하므로 최댓값은 {2**b-1}이다.'
    if kind=='address-count':
        b=10+i;return f'서로 독립적인 주소선 {b}개로 구분할 수 있는 주소는 최대 몇 개인가?',[b],2**b,'개','number',f'주소의 각 비트가 0 또는 1이므로 주소 수는 2^{b} = {2**b}개이다.'
    if kind=='memory-bytes':
        b=8+i;w=2 if i%2 else 4;r=2**b*w
        return f'주소가 {b}비트이고 주소 하나당 {w}바이트를 저장한다면 총 용량은 몇 바이트인가?',[b,w],r,'바이트','number',f'주소 수 2^{b} × 주소당 {w}바이트 = {r}바이트.'
    if kind=='bitmap-bytes':
        w=80+16*i;h=40+8*i;b=24;r=w*h*b//8
        return f'{w}×{h}화소, 화소당 {b}비트인 비압축 이미지의 순수 화소 데이터는 몇 바이트인가? (헤더·행 패딩은 제외)',[w,h,b],r,'바이트','number',f'가로×세로×색 깊이÷8 = {w}×{h}×{b}÷8 = {r}바이트.'
    if kind=='bitmap-kib':
        w=256;h=64*(i+1);b=8;r=w*h*b/8/1024
        return f'{w}×{h}화소, 화소당 {b}비트 이미지의 화소 데이터 크기는 몇 KiB인가? (비압축, 부가 정보 제외, 1KiB=1,024바이트)',[w,h,b],r,'KiB','number',f'{w}×{h}×{b}÷8÷1,024 = {number(r)}KiB.'
    if kind=='gray-levels':
        b=2+i;return f'화소마다 {b}비트의 명암 코드를 사용하는 회색조 영상에서 가능한 명암 코드 수는?',[b],2**b,'가지','number',f'{b}비트의 조합 수는 2^{b} = {2**b}가지이다. 각 코드를 서로 다른 단계로 사용한다고 가정한다.'
    if kind=='pcm-bytes':
        rate=8000+1000*i;bits=16;ch=2;sec=3+i;r=rate*bits*ch*sec//8
        return f'PCM 음성의 표본화 주파수 {rate}Hz, 표본당 {bits}비트, {ch}채널, 길이 {sec}초일 때 데이터는 몇 바이트인가? (압축·헤더 제외)',[rate,bits,ch,sec],r,'바이트','number',f'초당 표본 수×비트/표본×채널×초÷8 = {rate}×{bits}×{ch}×{sec}÷8 = {r}바이트.'
    if kind=='pcm-bitrate':
        rate=11000+1000*i;bits=16;ch=2;r=rate*bits*ch
        return f'표본화 주파수 {rate}Hz, 표본당 {bits}비트, {ch}채널인 비압축 PCM의 비트 전송률은? (부가 정보 제외)',[rate,bits,ch],r,'bps','number',f'{rate}표본/초 × {bits}비트/표본 × {ch}채널 = {r}bps.'
    if kind=='video-frames':
        fps=24+i;sec=10+i;r=fps*sec
        return f'초당 {fps}프레임으로 {sec}초 동안 재생하는 영상의 전체 프레임 수는? (고정 프레임률)',[fps,sec],r,'프레임','number',f'{fps}프레임/초 × {sec}초 = {r}프레임.'
    if kind=='video-bytes':
        w=64+8*i;h=48;b=24;fps=20;sec=2+i;r=w*h*b//8*fps*sec
        return f'한 프레임 {w}×{h}화소, 화소당 {b}비트, 초당 {fps}프레임인 {sec}초 영상의 순수 영상 크기는? (비압축, 음성·헤더·패딩 제외)',[w,h,b,fps,sec],r,'바이트','number',f'한 프레임 {w}×{h}×{b}÷8바이트에 {fps}×{sec}프레임을 곱하면 {r}바이트이다.'
    if kind=='transfer-seconds':
        size=25*(i+1);speed=20;r=size*8/speed
        return f'{size}MB 파일을 {speed}Mbps로 일정하게 전송할 때 필요한 시간은? (1MB=10⁶바이트, 1Mbps=10⁶비트/초, 오버헤드 제외)',[size,speed],r,'초','number',f'파일의 비트 수를 전송률로 나눈다: {size}×8÷{speed} = {number(r)}초.'
    if kind=='transfer-mb':
        speed=16+8*i;sec=10+i;r=speed*sec/8
        return f'{speed}Mbps로 {sec}초간 전송한 데이터는 몇 MB인가? (십진 단위, 오버헤드 제외)',[speed,sec],r,'MB','number',f'{speed}×10⁶비트/초 × {sec}초 ÷8÷10⁶ = {number(r)}MB.'
    if kind=='storage-file-count':
        disk=3+i;size=64;r=disk*1024//size
        return f'사용 가능한 {disk}MiB 공간에 각각 {size}KiB인 파일을 최대 몇 개 저장할 수 있는가? (할당 단위·관리 정보 제외, 1MiB=1,024KiB)',[disk,size],r,'개','number',f'공간을 같은 단위로 바꾸면 {disk*1024}KiB이다. {disk*1024}÷{size} = {r}개이다.'
    if kind=='compression-saved':
        a=100+20*i;b=40+5*i;r=a-b
        return f'{a}MB 파일을 {b}MB로 압축했다. 줄어든 용량은 몇 MB인가?',[a,b],r,'MB','number',f'원본 용량에서 압축 후 용량을 뺀다: {a}-{b} = {r}MB.'
    if kind=='compression-percent':
        a=200;b=20+10*i;r=b/a*100
        return f'원본 {a}MB를 {b}MB로 압축했다. 압축 후 크기는 원본의 몇 %인가? (절감률이 아닌 남은 크기 비율)',[a,b],r,'%','number',f'압축 후÷원본×100 = {b}÷{a}×100 = {number(r)}%이다.'
    if kind=='kibit-transfer':
        size=12+4*i;speed=8;r=size*8/speed
        return f'{size}KiB 자료를 {speed}Kibit/s로 전송하는 데 걸리는 시간은? (1KiB=1,024바이트, 1Kibit=1,024비트, 오버헤드 제외)',[size,speed],r,'초','number',f'자료 {size}×1,024×8비트를 {speed}×1,024비트/초로 나누면 {number(r)}초이다.'
    if kind=='ipv4-hosts':
        prefix=21+i;r=2**(32-prefix)-2
        return f'IPv4 /{prefix} 서브넷에서 네트워크·브로드캐스트 주소를 제외한 전통적인 호스트 주소 수는? (특수 /31·/32 방식 제외)',[prefix],r,'개','number',f'호스트 비트 수는 32-{prefix}={32-prefix}이다. 2^{32-prefix}-2 = {r}개이다.'
    if kind=='subnet-count':
        bits=1+i;r=2**bits
        return f'IPv4 /16 네트워크의 호스트 비트 중 {bits}비트를 서브넷 비트로 추가 사용한다. 서브넷은 몇 개로 나뉘는가? (서브넷 0도 사용)',[bits],r,'개','number',f'추가 서브넷 비트의 조합 수 2^{bits} = {r}개이다. 각 서브넷의 호스트 수와 구별한다.'
    if kind=='cluster-count':
        size=13+7*i;cluster=4;r=math.ceil(size/cluster)
        return f'{size}KiB 파일을 클러스터당 {cluster}KiB인 볼륨에 저장한다. 필요한 클러스터 수는? (파일은 최소 정수 개 클러스터를 점유)',[size,cluster],r,'개','number',f'{size}÷{cluster} = {size/cluster}를 올림하여 {r}개이다. 일부만 사용해도 클러스터 하나를 점유한다.'
    if kind=='allocated-kib':
        size=17+9*i;cluster=8;r=math.ceil(size/cluster)*cluster
        return f'클러스터당 {cluster}KiB인 볼륨에서 {size}KiB 파일이 점유하는 할당 용량은? (메타데이터 제외)',[size,cluster],r,'KiB','number',f'필요 클러스터 수는 ceil({size}÷{cluster})={math.ceil(size/cluster)}이다. 여기에 {cluster}KiB를 곱하면 {r}KiB이다.'
    raise ValueError(kind)

C_KINDS=['bin-dec','dec-bin','oct-dec','dec-oct','hex-dec','dec-hex','bytes-bits','kib-bytes','mib-kib','gib-mib','bit-states','unsigned-max','address-count','memory-bytes','bitmap-bytes','bitmap-kib','gray-levels','pcm-bytes','pcm-bitrate','video-frames','video-bytes','transfer-seconds','transfer-mb','storage-file-count','compression-saved','compression-percent','kibit-transfer','ipv4-hosts','subnet-count','cluster-count','allocated-kib']

S_KINDS=['sum','average','max','min','count','counta','countblank','countif','sumif','if','abs','int','trunc','round','roundup','rounddown','mod','power','left','right','mid','len','find','search','upper','lower','trim','choose','index','match','vlookup','hlookup','row','column','rows']

def s_case(kind,i):
    n=i+1
    if kind in ['sum','average','max','min']:
        a=[n*3,n*6,n*9];f={'sum':sum,'average':lambda v:sum(v)/len(v),'max':max,'min':min}[kind];r=f(a)
        detail={'sum':f'{a[0]}+{a[1]}+{a[2]}={r}', 'average':f'({a[0]}+{a[1]}+{a[2]})÷3={number(r)}', 'max':f'세 숫자 중 가장 큰 값은 {r}', 'min':f'세 숫자 중 가장 작은 값은 {r}'}[kind]
        return f'A1:A3에 순서대로 {a[0]}, {a[1]}, {a[2]}가 있을 때 ={kind.upper()}(A1:A3)의 결과는?',a,r,'','number',detail+'이다.'
    if kind in ['count','counta','countblank']:
        a=[n,n+1]+(['자료'+str(n)]*(i%3+1))+[None]*(i%4+1)
        r=len([v for v in a if isinstance(v,int)]) if kind=='count' else len([v for v in a if v is not None]) if kind=='counta' else a.count(None)
        desc=', '.join('실제 빈 셀' if v is None else f'텍스트 "{v}"' if isinstance(v,str) else f'숫자 {v}' for v in a)
        return f'A1:A{len(a)}에 순서대로 {desc}이 있다. ={kind.upper()}(A1:A{len(a)})의 결과는? (수식은 없음)',a,r,'','number',f'{kind.upper()}의 대상은 '+{'count':'숫자 셀','counta':'비어 있지 않은 셀','countblank':'빈 셀'}[kind]+f'이므로 조건에 맞는 셀을 세면 {r}개이다.'
    if kind=='countif':
        a=[n*5,n*5+10,n*5+20,n*5+30];threshold=n*5+15;r=sum(x>=threshold for x in a)
        return f'A1:A4가 {a}일 때 =COUNTIF(A1:A4,">={threshold}")의 결과는?',a+[threshold],r,'','number',f'{threshold} 이상인 값은 {a[2]}, {a[3]} 두 개이므로 결과는 2다. 합계가 아닌 개수다.'
    if kind=='sumif':
        a=[n*2,n*3,n*4];r=a[0]+a[2]
        return f'A1:A3은 "가", "나", "가", B1:B3은 {a}이다. =SUMIF(A1:A3,"가",B1:B3)의 결과는?',a,r,'','number',f'"가"인 첫째·셋째 행의 B열을 더한다: {a[0]}+{a[2]}={r}.'
    if kind=='if':
        score=30+7*i;r='통과' if score>=60 else '보충'
        return f'=IF({score}>=60,"통과","보충")의 결과는?',[score],r,'','quoted',f'{score}>=60의 결과는 {"참" if score>=60 else "거짓"}이므로 해당 분기의 텍스트 "{r}"을 반환한다.'
    if kind=='abs':
        v=-13-7*i;return f'=ABS({v})의 결과는?',[v],abs(v),'','number',f'절댓값은 0에서 떨어진 거리이므로 ABS({v})={abs(v)}이다.'
    if kind in ['int','trunc']:
        v=-(n+0.75);r=math.floor(v) if kind=='int' else math.trunc(v)
        return f'={kind.upper()}({v})의 결과는? (TRUNC의 자릿수는 생략)',[v],r,'','number',f'{kind.upper()}은 '+('음의 무한대 방향으로 내리므로 ' if kind=='int' else '소수 부분을 0 방향으로 잘라 내므로 ')+f'{r}이 된다. 음수에서 INT와 TRUNC는 다르다.'
    if kind in ['round','roundup','rounddown']:
        raw=12345+1111*i;d=Decimal(raw)/1000;rounding={'round':ROUND_HALF_UP,'roundup':ROUND_UP,'rounddown':ROUND_DOWN}[kind];r=float(d.quantize(Decimal('.01'),rounding=rounding))
        return f'={kind.upper()}({d},2)의 결과는?',[raw,1000,2],r,'','number',f'소수 둘째 자리까지 '+{'round':'반올림','roundup':'0에서 멀어지는 방향으로 올림','rounddown':'0 방향으로 내림'}[kind]+f'하면 {number(r)}이다. 자릿수 2는 소수 둘째 자리를 뜻한다.'
    if kind=='mod':
        a=17+11*i;b=3+i%4;r=a%b
        return f'=MOD({a},{b})의 결과는?',[a,b],r,'','number',f'{a}={b}×{a//b}+{r}이므로 나머지는 {r}이다.'
    if kind=='power':
        a=2+i;b=2+i%2;r=a**b
        return f'=POWER({a},{b})의 결과는?',[a,b],r,'','number',f'밑 {a}를 {b}번 곱한다. {a}^{b}={r}이다.'
    if kind in ['left','right','mid']:
        t=f'CL{n:02}EXCEL';length=2+i%4;start=2+i%3
        if kind=='left': r=t[:length];formula=f'LEFT("{t}",{length})';inputs=[t,length];detail=f'왼쪽의 첫 {length}문자'
        elif kind=='right': r=t[-length:];formula=f'RIGHT("{t}",{length})';inputs=[t,length];detail=f'오른쪽의 끝 {length}문자'
        else:r=t[start-1:start-1+length];formula=f'MID("{t}",{start},{length})';inputs=[t,start,length];detail=f'왼쪽에서 {start}번째부터 {length}문자'
        return f'={formula}의 결과는? (보기의 따옴표는 텍스트 경계)',inputs,r,'','quoted',f'{detail}를 추출하면 "{r}"이다. 위치 번호는 1부터 센다.'
    if kind=='len':
        t='A'*n+' '+'B'*2;r=len(t)
        return f'=LEN("{t}")의 결과는? (A와 B 사이 공백은 1개)',[t],r,'','number',f'A {n}개, 공백 1개, B 2개를 모두 세면 {n}+1+2={r}문자이다.'
    if kind in ['find','search']:
        t='A'*n+'xYz';needle='x' if kind=='find' else 'y';r=t.find('x')+1 if kind=='find' else t.lower().find('y')+1
        return f'={kind.upper()}("{needle}","{t}")의 결과는? (시작 위치 생략)',[needle,t],r,'','number',f'{kind.upper()}은 '+('대소문자를 구분한다' if kind=='find' else '대소문자를 구분하지 않는다')+f'. 첫 위치를 1로 세면 찾은 문자는 {r}번째이다.'
    if kind in ['upper','lower']:
        t=f'Data{n:02}Row';r=t.upper() if kind=='upper' else t.lower()
        return f'={kind.upper()}("{t}")의 결과는?',[t],r,'','quoted',f'영문자를 '+('대문자' if kind=='upper' else '소문자')+f'로 바꾸고 숫자는 유지하면 "{r}"이다.'
    if kind=='trim':
        t=f'  DATA{n:02}   ROW  ';r=f'DATA{n:02} ROW'
        return f'=TRIM("{t}")의 결과는? (모든 공백은 일반 ASCII 공백, 보기의 따옴표는 텍스트 경계)',[t],r,'','quoted',f'양끝 공백을 제거하고 중간의 연속 공백을 하나로 줄이면 "{r}"이다. 숫자는 그대로 유지한다.'
    if kind=='choose':
        a=[n*10,n*20,n*30];k=1+i%3;r=a[k-1]
        return f'=CHOOSE({k},{a[0]},{a[1]},{a[2]})의 결과는?',[k,*a],r,'','number',f'인덱스 {k}에 해당하는 {k}번째 선택값은 {r}이다. 인덱스는 1부터 센다.'
    if kind=='index':
        a=[n,n+10,n+20,n+30,n+40,n+50];row=1+i%3;col=1+i%2;r=a[(row-1)*2+col-1]
        return f'A1:B3은 행별로 ({a[0]},{a[1]}), ({a[2]},{a[3]}), ({a[4]},{a[5]})이다. =INDEX(A1:B3,{row},{col})의 결과는?',[*a,row,col],r,'','number',f'범위 내부의 {row}행 {col}열에 해당하는 값 {r}을 반환한다.'
    if kind=='match':
        a=[n*2,n*4,n*6,n*8];k=i%4;r=k+1
        return f'A1:A4는 {a}이다. =MATCH({a[k]},A1:A4,0)의 결과는?',[*a,a[k]],r,'','number',f'정확히 일치하는 {a[k]}는 범위의 {r}번째 값이다. MATCH는 값 자체가 아닌 상대 위치를 반환한다.'
    if kind in ['vlookup','hlookup']:
        keys=[n*10,n*20,n*30];vals=[n+100,n+200,n+300];k=i%3;r=vals[k];a=keys+vals+[keys[k]]
        if kind=='vlookup':stem=f'A1:B3의 행은 ({keys[0]},{vals[0]}), ({keys[1]},{vals[1]}), ({keys[2]},{vals[2]})이다. =VLOOKUP({keys[k]},A1:B3,2,FALSE)의 결과는?'
        else:stem=f'A1:C1은 {keys}, A2:C2는 {vals}이다. =HLOOKUP({keys[k]},A1:C2,2,FALSE)의 결과는?'
        return stem,a,r,'','number',f'첫 {"열" if kind=="vlookup" else "행"}의 {keys[k]}를 정확히 찾아 대응하는 두 번째 {"열" if kind=="vlookup" else "행"}의 값 {r}을 반환한다.'
    if kind=='row':
        row=7+3*i;return f'=ROW(D{row})의 결과는?',[row],row,'','number',f'D{row}의 행 번호는 {row}이다. 열 문자 D의 번호와 구별한다.'
    if kind=='column':
        col=3+i;letter=chr(64+col);return f'=COLUMN({letter}9)의 결과는?',[col],col,'','number',f'A열을 1로 세면 {letter}열의 번호는 {col}이다. 행 번호 9와 구별한다.'
    if kind=='rows':
        start=3+i;end=start+5+i;r=end-start+1
        return f'=ROWS(B{start}:D{end})의 결과는?',[start,end],r,'','number',f'처음과 마지막 행을 모두 포함하므로 {end}-{start}+1={r}행이다. 열 수는 이 계산에 영향을 주지 않는다.'
    raise ValueError(kind)


def format_choice(value,display,unit):
    if display=='quoted':return '"'+str(value)+'"'
    if display=='binary':return format(int(value),'b')
    if display=='octal':return format(int(value),'o')
    if display=='hex':return format(int(value),'X')
    return number(value)+(' '+unit if unit else '')


def variants(subject,kinds,evaluator):
    result=[]
    for f,kind in enumerate(kinds,1):
        for i in range(10):
            stem,inputs,expected,unit,display,derivation=evaluator(kind,i)
            if isinstance(expected,str):
                candidates=[expected.lower(),expected.upper(),expected[::-1],expected+'X','X'+expected,expected+' ',expected.replace(' ','')]
                if kind=='trim':candidates=[str(inputs[0]),str(inputs[0]).strip(),expected.replace(' ',''),expected+'X']
                if kind=='if':candidates=['통과','보충','TRUE','FALSE','60']
            else:
                # Include factor/offset mistakes, with no alternate encoding of the same answer.
                candidates=[expected*2,expected/2,expected*8,expected/8,expected+1,expected+2,expected-1]
                if display in ['binary','octal','hex']:candidates=[expected+1,expected-1,expected+2,expected+8]
                if kind in ['int','trunc']:candidates=[math.trunc(inputs[0]),math.floor(inputs[0]),math.ceil(inputs[0])+1,math.floor(inputs[0])-1]
            correct=format_choice(expected,display,unit)
            wrong=[]
            for candidate in candidates:
                if isinstance(candidate,(int,float)) and (not math.isfinite(candidate) or (unit in ['개','가지','바이트','비트','프레임'] and (candidate<0 or not float(candidate).is_integer()))):continue
                choice=format_choice(candidate,display,unit)
                if choice!=correct and choice not in wrong:wrong.append(choice)
            if len(wrong)<3:
                for j in range(1,10):
                    candidate=str(expected)+f'_{j}' if isinstance(expected,str) else expected+j
                    choice=format_choice(candidate,display,unit)
                    if choice!=correct and choice not in wrong:wrong.append(choice)
            family=f'cl2-{subject.lower()}-{kind}'
            result.append(make_question(f'CL2-{subject}-F{f:02}-{i+1:02}',subject,
                ('자료 표현·용량·통신 계산' if subject=='C' else '함수·참조 계산')+' · '+kind,
                stem,correct,wrong,derivation+' 이 문항은 동일 유형의 조건 변형이며 실제 기출이 아니다.',f*10+i,
                family=family,exercise=dict(kind=subject+':'+kind,inputs=inputs,expected=expected,unit=unit,display=display)))
    return result


def expanded_questions():
    return concepts('C')+concepts('S')+variants('C',C_KINDS,c_case)+variants('S',S_KINDS,s_case)
