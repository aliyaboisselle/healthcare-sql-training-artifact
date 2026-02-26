import { useState, useEffect, useCallback, useRef } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const DIFFICULTIES = ["Beginner","Intermediate","Difficult","Advanced","Expert"];
const DIFF_COLORS = ["#22c55e","#84cc16","#eab308","#f97316","#ef4444"];
const DIFF_XP = [20,40,65,90,120];
const DIFF_UNLOCK_LEVEL = [1,1,4,8,12];

const HC_DOMAINS = [
  "patient demographics & registration",
  "inpatient admissions & discharges (ADT)",
  "outpatient appointments & scheduling",
  "emergency department visits",
  "medication orders & pharmacy dispensing",
  "lab orders & results (CBC, metabolic panels, cultures)",
  "radiology orders & imaging results",
  "diagnoses & ICD-10 coding",
  "surgical procedures & OR scheduling",
  "insurance claims & billing (CPT codes, payers)",
  "provider credentialing & staff rosters",
  "nursing assessments & care plans",
  "vital signs & flowsheets",
  "referrals & care transitions",
  "infection control & reportable conditions",
];

const SQL_CONCEPTS = {
  Beginner: [
    "SELECT with WHERE and basic column filtering",
    "ORDER BY and LIMIT",
    "basic COUNT and SUM aggregates",
    "GROUP BY with HAVING",
    "simple INNER JOIN between two tables",
    "BETWEEN and IN filters",
    "column aliases with AS",
    "DISTINCT to remove duplicates",
    "basic date filtering with =, >, <",
    "NULL checks with IS NULL / IS NOT NULL",
    "AND / OR / NOT logical operators",
    "simple arithmetic in SELECT (calculated columns)",
    "LIKE and wildcard pattern matching",
    "aliasing tables in FROM clause",
    "single-level subquery in WHERE (SELECT within SELECT)",
  ],
  Intermediate: [
    "LEFT JOIN and understanding NULL results for non-matches",
    "chaining 3+ tables with multiple JOINs",
    "GROUP BY with multiple aggregate functions",
    "subquery in WHERE clause",
    "CASE WHEN conditional logic in SELECT",
    "date functions: DATE_TRUNC, AGE, EXTRACT",
    "string functions: CONCAT, SUBSTRING, ILIKE, TRIM",
    "COALESCE for NULL substitution",
    "UNION and UNION ALL",
    "COUNT DISTINCT",
    "self JOIN",
    "CAST and data type conversion",
    "NULL behavior in aggregates (how SUM vs COUNT handle NULLs)",
    "INNER JOIN vs LEFT JOIN — choosing the right one",
    "intro to window functions: basic SUM() OVER() without partitioning",
  ],
  Difficult: [
    "correlated subquery",
    "CTE (WITH clause) as subquery replacement",
    "ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)",
    "FULL OUTER JOIN",
    "EXISTS and NOT EXISTS",
    "multiple CTEs chained together",
    "NULLIF and COALESCE combined",
    "conditional aggregation with FILTER clause",
    "date/time interval arithmetic and overlapping date ranges",
    "RANK() and DENSE_RANK()",
    "multi-table UPDATE with JOIN",
    "DELETE with subquery or JOIN",
    "nested CASE WHEN expressions",
    "REGEXP_REPLACE and SPLIT_PART string manipulation",
    "fiscal year and custom period date logic",
  ],
  Advanced: [
    "recursive CTE for hierarchical data",
    "LAG() and LEAD() window functions",
    "SUM() OVER() running totals",
    "FIRST_VALUE() and LAST_VALUE()",
    "multiple window functions with different frames in one query",
    "EXCEPT and INTERSECT set operations",
    "lateral join (CROSS JOIN LATERAL)",
    "pivoting data with conditional CASE WHEN aggregation",
    "percentile_cont and percentile_disc",
    "complex multi-level correlated subqueries",
    "UNNEST and working with arrays",
    "JSON/JSONB querying with -> and ->> operators",
    "duplicate detection and deduplication strategies",
    "index-aware query writing (covering indexes, avoiding seq scans)",
    "multi-step data transformation logic across CTEs",
  ],
  Expert: [
    "advanced window framing with ROWS BETWEEN / RANGE BETWEEN",
    "gap-and-island problem solving",
    "slowly changing dimension (SCD Type 2) pattern",
    "ROLLUP and CUBE grouping sets",
    "upsert with INSERT ... ON CONFLICT DO UPDATE",
    "query execution plan analysis with EXPLAIN ANALYZE",
    "materialized views and refresh strategies",
    "partitioned tables and partition pruning",
    "stored procedures and user-defined functions (PL/pgSQL)",
    "full-text search with tsvector and tsquery",
    "advanced JSONB operations (jsonb_agg, jsonb_build_object, @> containment)",
    "row-level security (RLS) policy design",
    "schema design decisions: normalization vs star schema for analytics",
    "multi-step ETL pipeline logic in a single query",
    "trigger logic and event-driven query patterns",
  ],
};

let _domainIdx = Math.floor(Math.random() * HC_DOMAINS.length);
let _conceptIdxMap = {};
function pickDomain() { _domainIdx = (_domainIdx + 1) % HC_DOMAINS.length; return HC_DOMAINS[_domainIdx]; }
function pickConcept(diff) {
  const list = SQL_CONCEPTS[diff];
  if (!_conceptIdxMap[diff]) _conceptIdxMap[diff] = Math.floor(Math.random() * list.length);
  _conceptIdxMap[diff] = (_conceptIdxMap[diff] + 1) % list.length;
  return list[_conceptIdxMap[diff]];
}

const LEVELS = [
  {level:1,title:"Intern",xp:0},
  {level:2,title:"Data Aide",xp:100},
  {level:3,title:"Junior Analyst",xp:250},
  {level:4,title:"Analyst I",xp:450},
  {level:5,title:"Analyst II",xp:700},
  {level:6,title:"Senior Analyst",xp:1050},
  {level:7,title:"Data Specialist",xp:1500},
  {level:8,title:"BID Trainee",xp:2100},
  {level:9,title:"BID I",xp:2900},
  {level:10,title:"BID II",xp:3900},
  {level:11,title:"BID III",xp:5100},
  {level:12,title:"Senior BID I",xp:6500},
  {level:13,title:"Senior BID II",xp:8200},
  {level:14,title:"Lead Analyst",xp:10200},
  {level:15,title:"Data Architect",xp:12500},
  {level:16,title:"Analytics Manager",xp:15200},
  {level:17,title:"Principal BID",xp:18500},
  {level:18,title:"Director of Analytics",xp:22500},
  {level:19,title:"VP of Data",xp:27500},
  {level:20,title:"Chief Data Officer",xp:35000},
];

const BADGES = [
  // Getting Started
  {id:"first_steps",emoji:"🩺",name:"First Steps",desc:"Submit your first answer",group:"Getting Started"},
  {id:"warming_up",emoji:"📝",name:"Getting Warmed Up",desc:"Submit 5 answers",group:"Getting Started"},
  {id:"first_drill",emoji:"🔑",name:"Finding Your Footing",desc:"Complete your first drill",group:"Getting Started"},
  {id:"first_exam",emoji:"📋",name:"Certified",desc:"Pass your first proficiency exam",group:"Getting Started"},
  // Score Milestones
  {id:"score_70",emoji:"✅",name:"Passing Grade",desc:"Score 70+ on any question",group:"Score Milestones"},
  {id:"score_85",emoji:"🌟",name:"High Achiever",desc:"Score 85+ on any question",group:"Score Milestones"},
  {id:"score_100",emoji:"💯",name:"Perfectionist",desc:"Score 100 on any question",group:"Score Milestones"},
  {id:"big_brain",emoji:"🧠",name:"Big Brain",desc:"Score 90+ five times",group:"Score Milestones"},
  {id:"consistent",emoji:"🏆",name:"Consistent Excellence",desc:"Score 85+ on 10 questions in a row",group:"Score Milestones"},
  {id:"sharp_mind",emoji:"⚡",name:"Sharp Mind",desc:"Score 90+ on an Advanced or Expert question",group:"Score Milestones"},
  // Volume
  {id:"drills_10",emoji:"🔬",name:"Lab Rat",desc:"Complete 10 drills",group:"Volume & Grind"},
  {id:"drills_25",emoji:"🧪",name:"Research Mode",desc:"Complete 25 drills",group:"Volume & Grind"},
  {id:"q_25",emoji:"📚",name:"Bookworm",desc:"Answer 25 questions total",group:"Volume & Grind"},
  {id:"q_50",emoji:"🔭",name:"Deep Dive",desc:"Answer 50 questions total",group:"Volume & Grind"},
  {id:"q_100",emoji:"🏃",name:"Marathon Runner",desc:"Answer 100 questions total",group:"Volume & Grind"},
  {id:"well_rounded",emoji:"🌐",name:"Well Rounded",desc:"Answer 10+ questions in each section",group:"Volume & Grind"},
  // Difficulty
  {id:"beg_cleared",emoji:"🟢",name:"Beginner Cleared",desc:"Score 80+ on 5 Beginner questions",group:"Difficulty Milestones"},
  {id:"int_cleared",emoji:"🟡",name:"Intermediate Cleared",desc:"Score 80+ on 5 Intermediate questions",group:"Difficulty Milestones"},
  {id:"dif_cleared",emoji:"🟠",name:"Difficulty Cleared",desc:"Score 80+ on 5 Difficult questions",group:"Difficulty Milestones"},
  {id:"adv_cleared",emoji:"🔴",name:"Advanced Cleared",desc:"Score 80+ on 5 Advanced questions",group:"Difficulty Milestones"},
  {id:"exp_cleared",emoji:"⚫",name:"Expert Cleared",desc:"Score 80+ on 5 Expert questions",group:"Difficulty Milestones"},
  // Weakness
  {id:"comeback",emoji:"🩹",name:"Comeback Kid",desc:"Improve a tracked weakness category",group:"Weakness & Growth"},
  {id:"pharmacist",emoji:"💊",name:"Pharmacist",desc:"Score 90+ on a weakness drill",group:"Weakness & Growth"},
  {id:"fixer",emoji:"🛠️",name:"Fixer",desc:"Complete 10 troubleshooting questions",group:"Weakness & Growth"},
  {id:"growth",emoji:"🧬",name:"Growth Mindset",desc:"Remove 3 weakness categories through practice",group:"Weakness & Growth"},
  // Level
  {id:"level_5",emoji:"🚑",name:"On Call",desc:"Reach Level 5 (Analyst II)",group:"Level Milestones"},
  {id:"level_9",emoji:"⚕️",name:"Specialist",desc:"Reach Level 9 (BID I)",group:"Level Milestones"},
  {id:"level_13",emoji:"🏥",name:"Attending",desc:"Reach Level 13 (Senior BID II)",group:"Level Milestones"},
  {id:"level_16",emoji:"🔭",name:"Department Head",desc:"Reach Level 16 (Analytics Manager)",group:"Level Milestones"},
  {id:"level_20",emoji:"👨‍⚕️",name:"Chief of Staff",desc:"Reach Level 20 (Chief Data Officer)",group:"Level Milestones"},
];

const WEAKNESS_CATEGORIES = ["SELECT basics","WHERE filtering","ORDER BY","GROUP BY","HAVING","INNER JOIN","LEFT JOIN","RIGHT JOIN","FULL OUTER JOIN","Self JOIN","Subqueries","CTEs","Window Functions","Aggregations","CASE WHEN","Date/Time functions","String functions","UNION/INTERSECT/EXCEPT","NULL handling","Indexes & performance","EXISTS/IN/ANY/ALL"];

const CHEAT_SHEET = {
  "Aggregations":{color:"#58a6ff",functions:[
    {name:"COUNT(*)",syntax:"SELECT COUNT(*) FROM patients;",desc:"Counts all rows"},
    {name:"SUM(col)",syntax:"SELECT SUM(charge_amount) FROM claims;",desc:"Sums numeric values"},
    {name:"AVG(col)",syntax:"SELECT AVG(length_of_stay) FROM encounters;",desc:"Average of numeric values"},
    {name:"MIN/MAX",syntax:"SELECT MIN(admit_date), MAX(discharge_date) FROM encounters;",desc:"Min and max values"},
  ]},
  "Window Functions":{color:"#a78bfa",functions:[
    {name:"ROW_NUMBER()",syntax:"SELECT patient_id, ROW_NUMBER() OVER (PARTITION BY unit ORDER BY admit_date) FROM encounters;",desc:"Sequential row numbers per partition"},
    {name:"RANK()",syntax:"SELECT patient_id, RANK() OVER (ORDER BY los DESC) FROM encounters;",desc:"Rank with gaps"},
    {name:"LAG()/LEAD()",syntax:"SELECT admit_date, LAG(admit_date) OVER (PARTITION BY patient_id ORDER BY admit_date) FROM encounters;",desc:"Previous/next row value"},
    {name:"SUM() OVER()",syntax:"SELECT claim_id, SUM(charge_amount) OVER (PARTITION BY patient_id) FROM claims;",desc:"Running grouped sum without collapsing rows"},
  ]},
  "JOINs":{color:"#34d399",functions:[
    {name:"INNER JOIN",syntax:"SELECT p.name, e.admit_date FROM patients p INNER JOIN encounters e ON p.patient_id = e.patient_id;",desc:"Only matching rows"},
    {name:"LEFT JOIN",syntax:"SELECT p.name, e.admit_date FROM patients p LEFT JOIN encounters e ON p.patient_id = e.patient_id;",desc:"All left rows, NULLs for non-matches"},
    {name:"FULL OUTER JOIN",syntax:"SELECT * FROM patients p FULL OUTER JOIN encounters e ON p.patient_id = e.patient_id;",desc:"All rows from both tables"},
    {name:"Self JOIN",syntax:"SELECT a.patient_id, b.patient_id FROM patients a JOIN patients b ON a.physician_id = b.physician_id WHERE a.patient_id <> b.patient_id;",desc:"Join table to itself"},
  ]},
  "Date/Time":{color:"#fbbf24",functions:[
    {name:"DATE_TRUNC()",syntax:"SELECT DATE_TRUNC('month', admit_date) FROM encounters;",desc:"Truncate to precision"},
    {name:"AGE()",syntax:"SELECT AGE(discharge_date, admit_date) FROM encounters;",desc:"Interval between dates"},
    {name:"EXTRACT()",syntax:"SELECT EXTRACT(YEAR FROM dob) FROM patients;",desc:"Extract date field"},
    {name:"INTERVAL",syntax:"SELECT * FROM encounters WHERE admit_date >= CURRENT_DATE - INTERVAL '30 days';",desc:"Add/subtract time"},
  ]},
  "NULL Handling":{color:"#f87171",functions:[
    {name:"IS NULL",syntax:"SELECT * FROM patients WHERE discharge_date IS NULL;",desc:"Filter NULLs"},
    {name:"COALESCE()",syntax:"SELECT COALESCE(secondary_dx, primary_dx, 'Unknown') FROM encounters;",desc:"First non-NULL value"},
    {name:"NULLIF()",syntax:"SELECT NULLIF(charge_amount, 0) FROM claims;",desc:"Return NULL if equal"},
  ]},
  "CTEs & Subqueries":{color:"#22d3ee",functions:[
    {name:"CTE (WITH)",syntax:"WITH recent AS (\n  SELECT * FROM encounters WHERE admit_date >= CURRENT_DATE - INTERVAL '7 days'\n)\nSELECT p.name FROM patients p JOIN recent r ON p.patient_id = r.patient_id;",desc:"Named temporary result set"},
    {name:"Subquery",syntax:"SELECT * FROM patients WHERE patient_id IN (SELECT patient_id FROM encounters WHERE los > 10);",desc:"Query inside query"},
  ]},
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getLevelInfo(xp) {
  let cur = LEVELS[0], nxt = LEVELS[1];
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xp) { cur = LEVELS[i]; nxt = LEVELS[i+1] || null; }
  }
  return { cur, nxt };
}

function calcXP(score, diffIdx, bonus = 0) {
  return Math.round((score / 100) * DIFF_XP[diffIdx]) + bonus;
}

async function callClaude(prompt, sys = "") {
  const body = { model:"claude-sonnet-4-20250514", max_tokens:1000, messages:[{role:"user",content:prompt}] };
  if (sys) body.system = sys;
  const r = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const d = await r.json();
  return d.content.map(b=>b.text||"").join("\n");
}

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────
function Spinner() { return <span style={{display:"inline-block",animation:"spin 1s linear infinite"}}>⟳</span>; }

function CodeEditor({value,onChange,placeholder,minH=120}) {
  return <textarea value={value} onChange={e=>onChange&&onChange(e.target.value)} placeholder={placeholder}
    style={{width:"100%",minHeight:minH,background:"#0d1117",color:"#e6edf3",border:"1px solid #30363d",borderRadius:8,padding:12,fontFamily:"'Courier New',monospace",fontSize:13,resize:"vertical",outline:"none",boxSizing:"border-box"}} />;
}

function XPToast({toasts}) {
  return <div style={{position:"fixed",top:70,right:16,zIndex:9999,display:"flex",flexDirection:"column",gap:8,pointerEvents:"none"}}>
    {toasts.map(t=>(
      <div key={t.id} style={{background:"#1f6feb",color:"#fff",borderRadius:8,padding:"8px 16px",fontWeight:700,fontSize:14,boxShadow:"0 4px 12px #0008",animation:"fadeUp 0.4s ease"}}>
        +{t.xp} XP {t.levelUp ? `🎉 Level Up! ${t.levelUp}` : ""}
      </div>
    ))}
  </div>;
}

function BadgeToast({badges}) {
  return <div style={{position:"fixed",top:70,left:16,zIndex:9999,display:"flex",flexDirection:"column",gap:8,pointerEvents:"none"}}>
    {badges.map(b=>(
      <div key={b.id} style={{background:"#1a1a2e",border:"1px solid #f97316",color:"#f97316",borderRadius:8,padding:"8px 16px",fontWeight:700,fontSize:13,boxShadow:"0 4px 12px #0008"}}>
        {b.emoji} Badge Unlocked: {b.name}!
      </div>
    ))}
  </div>;
}

function DifficultySelector({selected,onSelect,unlockedLevel}) {
  return <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
    {DIFFICULTIES.map((d,i)=>{
      const locked = unlockedLevel < DIFF_UNLOCK_LEVEL[i];
      return <button key={d} onClick={()=>!locked&&onSelect(i)}
        title={locked?`Unlocks at Level ${DIFF_UNLOCK_LEVEL[i]}`:d}
        style={{padding:"8px 16px",borderRadius:20,border:"2px solid",borderColor:selected===i?DIFF_COLORS[i]:"#30363d",background:locked?"#1a1a1a":selected===i?DIFF_COLORS[i]+"22":"transparent",color:locked?"#444":selected===i?DIFF_COLORS[i]:"#8b949e",cursor:locked?"not-allowed":"pointer",fontWeight:600,fontSize:13,position:"relative"}}>
        {locked?"🔒 ":""}{d}
      </button>;
    })}
  </div>;
}

function ScoreCard({breakdown}) {
  if (!breakdown) return null;
  const categories = [
    {label:"Correctness",key:"correctness",max:50,color:"#22c55e"},
    {label:"Syntax & Structure",key:"syntax",max:20,color:"#58a6ff"},
    {label:"Efficiency",key:"efficiency",max:20,color:"#a78bfa"},
    {label:"Clarity",key:"clarity",max:10,color:"#fbbf24"},
  ];
  const total = categories.reduce((s,c)=>s+(breakdown[c.key]||0),0);
  return <div style={{background:"#0d1117",border:"1px solid #30363d",borderRadius:8,padding:16,marginBottom:12}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <span style={{color:"#e6edf3",fontWeight:700}}>Score Breakdown</span>
      <span style={{fontSize:28,fontWeight:800,color:total>=85?"#22c55e":total>=70?"#eab308":"#ef4444"}}>{total}<span style={{fontSize:14,color:"#8b949e"}}>/100</span></span>
    </div>
    {categories.map(c=>{
      const val = breakdown[c.key]||0, pct=(val/c.max)*100;
      return <div key={c.key} style={{marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
          <span style={{color:"#8b949e",fontSize:12}}>{c.label}</span>
          <span style={{color:c.color,fontSize:12,fontWeight:700}}>{val}/{c.max}</span>
        </div>
        <div style={{background:"#161b22",borderRadius:4,height:6}}>
          <div style={{height:6,borderRadius:4,background:c.color,width:`${pct}%`,transition:"width 0.5s"}} />
        </div>
      </div>;
    })}
  </div>;
}

function SessionGapTracker({gaps}) {
  const entries = Object.entries(gaps).sort((a,b)=>b[1]-a[1]);
  if (!entries.length) return null;
  return <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:8,padding:12,marginBottom:20}}>
    <div style={{color:"#8b949e",fontSize:11,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>📊 Session Gap Tracker</div>
    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
      {entries.map(([g,c])=><span key={g} style={{background:"#f9731611",border:"1px solid #f97316",color:"#f97316",borderRadius:20,padding:"3px 10px",fontSize:12}}>{g} <strong>×{c}</strong></span>)}
    </div>
  </div>;
}

// ─── FEEDBACK BOX ─────────────────────────────────────────────────────────────
function FeedbackBox({feedback,addSessionGap,onDrillComplete}) {
  const [drillConcept,setDrillConcept]=useState(null);
  const [drillQ,setDrillQ]=useState("");
  const [drillA,setDrillA]=useState("");
  const [drillFB,setDrillFB]=useState("");
  const [loadingDrill,setLoadingDrill]=useState(false);
  const [loadingDrillF,setLoadingDrillF]=useState(false);
  const [teachConcept,setTeachConcept]=useState(null);
  const [teachContent,setTeachContent]=useState("");
  const [loadingTeach,setLoadingTeach]=useState(false);

  if (!feedback) return null;
  const gaps = feedback.gaps||[], recs = feedback.recommendations||[];

  async function runDrill(concept) {
    setDrillConcept(concept); setDrillQ(""); setDrillA(""); setDrillFB(""); setLoadingDrill(true);
    addSessionGap&&addSessionGap(concept);
    const prompt=`Generate a short focused PostgreSQL drill for healthcare setting testing: "${concept}". Brief scenario, 1-2 schemas, clear question. No answer.`;
    setDrillQ(await callClaude(prompt)); setLoadingDrill(false);
  }

  async function submitDrill() {
    setLoadingDrillF(true); setDrillFB("");
    const prompt=`Drill on "${drillConcept}":\n${drillQ}\n\nStudent answer:\n${drillA}\n\nRespond JSON only:\n{"score":0-100,"breakdown":{"correctness":0-50,"syntax":0-20,"efficiency":0-20,"clarity":0-10},"feedback":"full feedback + correct query","gaps":[]}`;
    const raw=await callClaude(prompt);
    try {
      const d=JSON.parse(raw.replace(/```json|```/g,"").trim());
      setDrillFB(d);
      onDrillComplete&&onDrillComplete(d.score||0, drillConcept);
    } catch { setDrillFB({score:0,feedback:raw,gaps:[],breakdown:{}}); }
    setLoadingDrillF(false);
  }

  async function runTeach(concept) {
    setTeachConcept(concept); setTeachContent(""); setLoadingTeach(true);
    const prompt=`Explain "${concept}" in PostgreSQL plainly for healthcare data analyst. 1) What it is & when to use it. 2) Syntax. 3) Healthcare example. 4) Common mistake. Be concise.`;
    setTeachContent(await callClaude(prompt)); setLoadingTeach(false);
  }

  return <div style={{marginTop:16}}>
    <ScoreCard breakdown={feedback.breakdown} />
    <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:8,padding:16,marginBottom:12}}>
      <div style={{color:"#58a6ff",fontWeight:700,marginBottom:8}}>📝 Feedback & Correct Answer</div>
      <pre style={{color:"#e6edf3",whiteSpace:"pre-wrap",fontFamily:"inherit",fontSize:13,margin:0}}>{feedback.text}</pre>
    </div>
    {recs.length>0&&<div style={{background:"#f9731611",border:"1px solid #f97316",borderRadius:8,padding:12,marginBottom:12}}>
      <div style={{color:"#f97316",fontWeight:700,marginBottom:4}}>⚠️ Recommended Focus Areas</div>
      <div style={{color:"#e6edf3",fontSize:13}}>Prioritize: <strong>{recs.join(", ")}</strong></div>
    </div>}
    {gaps.length>0&&<div style={{marginBottom:12}}>
      <div style={{color:"#8b949e",fontSize:13,fontWeight:600,marginBottom:8}}>🔍 Concepts to Work On:</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {gaps.map(g=><div key={g} style={{display:"flex",gap:4}}>
          <button onClick={()=>runDrill(g)} style={{padding:"6px 12px",background:"#1f6feb22",border:"1px solid #1f6feb",color:"#58a6ff",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:700}}>🏋️ Drill: {g}</button>
          <button onClick={()=>runTeach(g)} style={{padding:"6px 12px",background:"#23863622",border:"1px solid #238636",color:"#22c55e",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:700}}>📖 Teach Me</button>
        </div>)}
      </div>
    </div>}
    {(loadingTeach||teachContent)&&<div style={{background:"#0d2818",border:"1px solid #238636",borderRadius:8,padding:16,marginBottom:12}}>
      <div style={{color:"#22c55e",fontWeight:700,marginBottom:8}}>📖 Teach Me: {teachConcept}</div>
      {loadingTeach?<div style={{color:"#8b949e"}}><Spinner/> Loading...</div>:<pre style={{color:"#e6edf3",whiteSpace:"pre-wrap",fontFamily:"inherit",fontSize:13,margin:0}}>{teachContent}</pre>}
    </div>}
    {drillConcept&&<div style={{background:"#0d1f3c",border:"1px solid #1f6feb",borderRadius:8,padding:16}}>
      <div style={{color:"#58a6ff",fontWeight:700,marginBottom:8}}>🏋️ Drill: {drillConcept}</div>
      {loadingDrill?<div style={{color:"#8b949e"}}><Spinner/> Generating...</div>:<>
        <pre style={{color:"#e6edf3",whiteSpace:"pre-wrap",fontFamily:"inherit",fontSize:13,margin:"0 0 12px"}}>{drillQ}</pre>
        <CodeEditor value={drillA} onChange={setDrillA} placeholder="Your answer..." minH={80}/>
        <button onClick={submitDrill} disabled={loadingDrillF||!drillA.trim()} style={{marginTop:8,padding:"8px 18px",background:"#238636",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontWeight:700,fontSize:13}}>
          {loadingDrillF?<><Spinner/> Checking...</>:"Submit Drill"}
        </button>
        {drillFB&&<>
          <ScoreCard breakdown={drillFB.breakdown}/>
          <pre style={{marginTop:8,color:"#e6edf3",whiteSpace:"pre-wrap",fontFamily:"inherit",fontSize:13,background:"#0d1117",borderRadius:6,padding:10}}>{drillFB.feedback}</pre>
        </>}
      </>}
    </div>}
  </div>;
}

// ─── GENERATE FEEDBACK ────────────────────────────────────────────────────────
async function generateFeedback(type, difficulty, question, userAnswer) {
  const prompt=`Healthcare PostgreSQL ${type} question at ${difficulty} level:\n\nQUESTION:\n${question}\n\nSTUDENT ANSWER:\n${userAnswer}\n\nRespond JSON only (no markdown):\n{\n  "breakdown":{"correctness":0-50,"syntax":0-20,"efficiency":0-20,"clarity":0-10},\n  "text":"Full feedback: what they did right/wrong, correct query, tips",\n  "gaps":["0-4 specific concepts/functions missed"],\n  "recommendations":["if 2+ gaps, top 1-2 foundational ones; else []"]\n}`;
  const raw=await callClaude(prompt);
  try { return JSON.parse(raw.replace(/```json|```/g,"").trim()); }
  catch { return {breakdown:{correctness:0,syntax:0,efficiency:0,clarity:0},text:raw,gaps:[],recommendations:[]}; }
}

// ─── QUERY WRITING ─────────────────────────────────────────────────────────────
function QueryWriting({stats,onScore,sessionGaps,addSessionGap}) {
  const [diff,setDiff]=useState(0);
  const [question,setQuestion]=useState("");
  const [answer,setAnswer]=useState("");
  const [feedback,setFeedback]=useState(null);
  const [loadingQ,setLoadingQ]=useState(false);
  const [loadingF,setLoadingF]=useState(false);
  const lvlInfo=getLevelInfo(stats.xp);

  async function generate() {
    setLoadingQ(true); setQuestion(""); setAnswer(""); setFeedback(null);
    const domain=pickDomain(), concept=pickConcept(DIFFICULTIES[diff]);
    const prompt=`Write a ${DIFFICULTIES[diff]} PostgreSQL question for healthcare domain: "${domain}", testing: "${concept}".\n\nInclude: scenario, 2-3 table schemas (CREATE TABLE) with 4-5 sample rows each.\n\nEnd with a Question: that specifies (a) exact columns to return, (b) filter conditions with specific values, (c) any required sorting or grouping. No answer.`;
    setQuestion(await callClaude(prompt)); setLoadingQ(false);
  }

  async function submit() {
    if (!question||!answer.trim()) return;
    setLoadingF(true); setFeedback(null);
    const fb=await generateFeedback("query writing",DIFFICULTIES[diff],question,answer);
    setFeedback(fb);
    const total=(fb.breakdown?.correctness||0)+(fb.breakdown?.syntax||0)+(fb.breakdown?.efficiency||0)+(fb.breakdown?.clarity||0);
    onScore(total,diff,"writing",fb.gaps||[]);
    setLoadingF(false);
  }

  return <div>
    <h2 style={{color:"#58a6ff",marginTop:0}}>✍️ Query Writing</h2>
    <SessionGapTracker gaps={sessionGaps}/>
    <DifficultySelector selected={diff} onSelect={setDiff} unlockedLevel={lvlInfo.cur.level}/>
    <button onClick={generate} disabled={loadingQ} style={{padding:"10px 24px",background:"#1f6feb",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:14}}>
      {loadingQ?<><Spinner/> Generating...</>:"Generate Question"}
    </button>
    {question&&<div style={{marginTop:20}}>
      <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:8,padding:16,marginBottom:16}}>
        <pre style={{color:"#e6edf3",whiteSpace:"pre-wrap",fontFamily:"inherit",fontSize:13,margin:0}}>{question}</pre>
      </div>
      <div style={{color:"#8b949e",marginBottom:6,fontWeight:600}}>Your SQL Answer:</div>
      <CodeEditor value={answer} onChange={setAnswer} placeholder="Write your PostgreSQL query here..."/>
      <button onClick={submit} disabled={loadingF||!answer.trim()} style={{marginTop:12,padding:"10px 24px",background:"#238636",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:14}}>
        {loadingF?<><Spinner/> Checking...</>:"Submit Answer"}
      </button>
      <FeedbackBox feedback={feedback} addSessionGap={addSessionGap} onDrillComplete={(s,c)=>onScore(s,diff,"drill",[],c)}/>
    </div>}
  </div>;
}

// ─── TROUBLESHOOTING ──────────────────────────────────────────────────────────
function Troubleshooting({stats,onScore,sessionGaps,addSessionGap}) {
  const [diff,setDiff]=useState(0);
  const [question,setQuestion]=useState("");
  const [answer,setAnswer]=useState("");
  const [feedback,setFeedback]=useState(null);
  const [loadingQ,setLoadingQ]=useState(false);
  const [loadingF,setLoadingF]=useState(false);
  const lvlInfo=getLevelInfo(stats.xp);

  async function generate() {
    setLoadingQ(true); setQuestion(""); setAnswer(""); setFeedback(null);
    const domain=pickDomain(), concept=pickConcept(DIFFICULTIES[diff]);
    const prompt=`Write a ${DIFFICULTIES[diff]} PostgreSQL troubleshooting question for healthcare domain: "${domain}", testing: "${concept}".\n\nInclude: scenario, 2-3 table schemas (CREATE TABLE) with 4-5 sample rows, a broken query with 1-3 bugs.\n\nEnd with a Question: that specifies (a) what the query is supposed to return with exact columns, (b) the filter conditions, (c) ask the user to identify and fix all bugs. Do not reveal the bugs.`;
    setQuestion(await callClaude(prompt)); setLoadingQ(false);
  }

  async function submit() {
    if (!question||!answer.trim()) return;
    setLoadingF(true); setFeedback(null);
    const fb=await generateFeedback("troubleshooting",DIFFICULTIES[diff],question,answer);
    setFeedback(fb);
    const total=(fb.breakdown?.correctness||0)+(fb.breakdown?.syntax||0)+(fb.breakdown?.efficiency||0)+(fb.breakdown?.clarity||0);
    onScore(total,diff,"troubleshooting",fb.gaps||[]);
    setLoadingF(false);
  }

  return <div>
    <h2 style={{color:"#58a6ff",marginTop:0}}>🔧 Troubleshooting</h2>
    <SessionGapTracker gaps={sessionGaps}/>
    <DifficultySelector selected={diff} onSelect={setDiff} unlockedLevel={lvlInfo.cur.level}/>
    <button onClick={generate} disabled={loadingQ} style={{padding:"10px 24px",background:"#1f6feb",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:14}}>
      {loadingQ?<><Spinner/> Generating...</>:"Generate Question"}
    </button>
    {question&&<div style={{marginTop:20}}>
      <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:8,padding:16,marginBottom:16}}>
        <pre style={{color:"#e6edf3",whiteSpace:"pre-wrap",fontFamily:"inherit",fontSize:13,margin:0}}>{question}</pre>
      </div>
      <CodeEditor value={answer} onChange={setAnswer} placeholder="Your corrected query + explanation..."/>
      <button onClick={submit} disabled={loadingF||!answer.trim()} style={{marginTop:12,padding:"10px 24px",background:"#238636",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:14}}>
        {loadingF?<><Spinner/> Checking...</>:"Submit Answer"}
      </button>
      <FeedbackBox feedback={feedback} addSessionGap={addSessionGap} onDrillComplete={(s,c)=>onScore(s,diff,"drill",[],c)}/>
    </div>}
  </div>;
}

// ─── PROFICIENCY EXAM ─────────────────────────────────────────────────────────
function ProficiencyExam({weaknesses,setWeaknesses,onExamScore}) {
  const [phase,setPhase]=useState("intro");
  const [questions,setQuestions]=useState([]);
  const [answers,setAnswers]=useState([]);
  const [current,setCurrent]=useState(0);
  const [feedbacks,setFeedbacks]=useState([]);
  const [results,setResults]=useState(null);
  const [gradingProgress,setGradingProgress]=useState(0);

  async function startExam() {
    setPhase("loading");
    const examDomains=[...HC_DOMAINS].sort(()=>Math.random()-0.5).slice(0,10);
    const prompt=`Generate exactly 10 PostgreSQL healthcare proficiency exam questions. Mix: 6 writing, 4 troubleshooting. 2 each of: Beginner, Intermediate, Difficult, Advanced, Expert.\n\nCRITICAL VARIETY RULES:\n- Each question must use a DIFFERENT healthcare domain from this list (one per question): ${examDomains.map((d,i)=>`Q${i+1}: "${d}"`).join(", ")}\n- Each question must test a DIFFERENT primary SQL concept — do not repeat concepts\n- Beginner concepts: basic SELECT/WHERE/JOIN. Intermediate: aggregates, date functions, CASE WHEN. Difficult: CTEs, subqueries, window ROW_NUMBER. Advanced: LAG/LEAD, running totals, RANK. Expert: recursive CTEs, advanced window frames, optimization.\n- Table names and columns must reflect the specific domain — no generic "patients/encounters" unless that domain requires it\n\nReturn ONLY JSON array (no markdown):\n[{"number":1,"type":"writing","difficulty":"Beginner","scenario":"...","schemas":"...","question":"..."}]\nFor troubleshooting add "brokenQuery" field.`;
    try {
      const raw=await callClaude(prompt);
      const qs=JSON.parse(raw.replace(/```json|```/g,"").trim());
      setQuestions(qs); setAnswers(new Array(qs.length).fill("")); setCurrent(0); setPhase("exam");
    } catch { setPhase("exam"); setQuestions([{number:1,type:"writing",difficulty:"Beginner",scenario:"Error. Restart.",schemas:"",question:"Restart."}]); setAnswers([""]); }
  }

  function updateAnswer(val) { setAnswers(prev=>{const a=[...prev];a[current]=val;return a;}); }

  async function finishExam() {
    setPhase("grading"); setGradingProgress(0);
    const fbs=[];
    for (let i=0;i<questions.length;i++) {
      const q=questions[i],a=answers[i];
      const prompt=`Healthcare SQL exam (${q.difficulty}, ${q.type}):\nScenario: ${q.scenario}\nSchemas: ${q.schemas}\nQuestion: ${q.question}\n${q.brokenQuery?"Broken: "+q.brokenQuery:""}\nStudent: ${a||"(blank)"}\n\nJSON only:\n{"score":0-100,"breakdown":{"correctness":0-50,"syntax":0-20,"efficiency":0-20,"clarity":0-10},"correct":true/false,"summary":"one sentence","weaknessCategories":["0-3 from: ${WEAKNESS_CATEGORIES.join(", ")}"]}`;
      const raw=await callClaude(prompt);
      try { fbs.push(JSON.parse(raw.replace(/```json|```/g,"").trim())); }
      catch { fbs.push({score:0,breakdown:{},correct:false,summary:"Parse error.",weaknessCategories:[]}); }
      setGradingProgress(i+1);
    }
    setFeedbacks(fbs);
    const total=fbs.reduce((s,f)=>s+(f.score||0),0), pct=total/(questions.length*100);
    let level="Beginner";
    if (pct>=0.9) level="Expert"; else if (pct>=0.75) level="Advanced"; else if (pct>=0.6) level="Difficult"; else if (pct>=0.4) level="Intermediate";
    const newWeakMap={};
    fbs.forEach(f=>{if(!f.correct&&f.weaknessCategories)f.weaknessCategories.forEach(w=>{newWeakMap[w]=(newWeakMap[w]||0)+1;});});
    const tested=new Set(fbs.flatMap(f=>f.weaknessCategories||[]));
    const updated={...weaknesses};
    tested.forEach(cat=>{if(newWeakMap[cat])updated[cat]=(updated[cat]||0)+newWeakMap[cat];else delete updated[cat];});
    setWeaknesses(updated);
    const avgScore=Math.round(total/questions.length);
    onExamScore(avgScore, pct>=0.7);
    setResults({total,pct,level,newWeakMap,avgScore});
    setPhase("results");
  }

  if (phase==="intro") return <div>
    <h2 style={{color:"#58a6ff",marginTop:0}}>📋 Proficiency Exam</h2>
    <p style={{color:"#8b949e"}}>10 questions spanning all difficulties. Weaknesses saved after completion.</p>
    <button onClick={startExam} style={{padding:"12px 28px",background:"#1f6feb",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:15}}>Start Exam</button>
  </div>;

  if (phase==="loading") return <div style={{textAlign:"center",padding:60}}><div style={{fontSize:40}}>⟳</div><div style={{color:"#58a6ff",fontSize:18,marginTop:12}}>Generating exam...</div></div>;
  if (phase==="grading") return <div style={{textAlign:"center",padding:60}}>
    <div style={{fontSize:40}}>⟳</div>
    <div style={{color:"#58a6ff",fontSize:18,marginTop:12}}>Grading {gradingProgress}/{questions.length}...</div>
    <div style={{marginTop:16,background:"#161b22",borderRadius:8,height:12,width:300,margin:"16px auto 0"}}>
      <div style={{height:12,borderRadius:8,background:"#1f6feb",width:`${(gradingProgress/questions.length)*100}%`,transition:"width 0.3s"}}/>
    </div>
  </div>;

  if (phase==="results") return <div>
    <h2 style={{color:"#58a6ff",marginTop:0}}>📊 Exam Results</h2>
    <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:12,padding:24,marginBottom:24,textAlign:"center"}}>
      <div style={{fontSize:52,fontWeight:800,color:results.avgScore>=85?"#22c55e":results.avgScore>=70?"#eab308":"#ef4444"}}>{results.avgScore}<span style={{fontSize:20,color:"#8b949e"}}>/100</span></div>
      <div style={{color:"#e6edf3",fontSize:20,fontWeight:700,marginTop:8}}>Proficiency: {results.level}</div>
      <div style={{color:"#8b949e",marginTop:4}}>Avg score across {questions.length} questions</div>
    </div>
    {Object.keys(results.newWeakMap).length>0&&<div style={{marginBottom:20}}>
      <div style={{color:"#f97316",fontWeight:700,marginBottom:8}}>⚠️ Weaknesses Found</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {Object.keys(results.newWeakMap).map(w=><span key={w} style={{background:"#f9731622",border:"1px solid #f97316",color:"#f97316",borderRadius:20,padding:"4px 12px",fontSize:13}}>{w}</span>)}
      </div>
    </div>}
    {questions.map((q,i)=><div key={i} style={{background:"#161b22",border:`1px solid ${(feedbacks[i]?.score||0)>=70?"#238636":"#f97316"}`,borderRadius:8,padding:12,marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <span style={{color:"#e6edf3",fontWeight:600}}>Q{i+1}: {q.difficulty} — {q.type}</span>
        <span style={{color:(feedbacks[i]?.score||0)>=70?"#22c55e":"#f97316",fontWeight:700}}>{feedbacks[i]?.score||0}/100</span>
      </div>
      <div style={{color:"#8b949e",fontSize:13,marginTop:4}}>{feedbacks[i]?.summary}</div>
    </div>)}
    <button onClick={()=>setPhase("intro")} style={{marginTop:16,padding:"10px 24px",background:"#1f6feb",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700}}>Take Another Exam</button>
  </div>;

  const q=questions[current];
  return <div>
    <h2 style={{color:"#58a6ff",marginTop:0}}>📋 Proficiency Exam</h2>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
      <span style={{color:"#8b949e"}}>Question {current+1} of {questions.length}</span>
      <span style={{color:"#8b949e",fontSize:13}}>{answers.filter(a=>a?.trim()).length} answered</span>
    </div>
    <div style={{background:"#161b22",borderRadius:6,height:6,marginBottom:20}}>
      <div style={{height:6,borderRadius:6,background:"#1f6feb",width:`${((current+1)/questions.length)*100}%`}}/>
    </div>
    {q&&<div>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <span style={{background:"#1f6feb22",color:"#58a6ff",borderRadius:20,padding:"3px 12px",fontSize:12,fontWeight:700}}>{q.difficulty}</span>
        <span style={{background:"#23863622",color:"#22c55e",borderRadius:20,padding:"3px 12px",fontSize:12,fontWeight:700}}>{q.type}</span>
      </div>
      <div style={{background:"#0d1117",border:"1px solid #30363d",borderRadius:8,padding:16,marginBottom:16}}>
        <div style={{color:"#58a6ff",fontWeight:700,marginBottom:6}}>Scenario</div>
        <div style={{color:"#e6edf3",fontSize:13,marginBottom:12}}>{q.scenario}</div>
        {q.schemas&&<><div style={{color:"#58a6ff",fontWeight:700,marginBottom:6}}>Schemas</div><pre style={{color:"#e6edf3",fontSize:12,margin:"0 0 12px",whiteSpace:"pre-wrap"}}>{q.schemas}</pre></>}
        {q.brokenQuery&&<><div style={{color:"#f97316",fontWeight:700,marginBottom:6}}>Broken Query</div><pre style={{color:"#e6edf3",fontSize:12,margin:"0 0 12px",background:"#1c1c1c",padding:8,borderRadius:6}}>{q.brokenQuery}</pre></>}
        <div style={{color:"#58a6ff",fontWeight:700,marginBottom:6}}>Question</div>
        <div style={{color:"#e6edf3",fontSize:13}}>{q.question}</div>
      </div>
      <CodeEditor value={answers[current]} onChange={updateAnswer} placeholder="Write your SQL here..."/>
      <div style={{display:"flex",gap:12,marginTop:12}}>
        {current>0&&<button onClick={()=>setCurrent(c=>c-1)} style={{padding:"10px 20px",background:"transparent",color:"#8b949e",border:"1px solid #30363d",borderRadius:8,cursor:"pointer"}}>← Prev</button>}
        {current<questions.length-1
          ?<button onClick={()=>setCurrent(c=>c+1)} style={{padding:"10px 24px",background:"#1f6feb",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700}}>Next →</button>
          :<button onClick={finishExam} style={{padding:"10px 24px",background:"#238636",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700}}>Submit Exam</button>}
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:16}}>
        {questions.map((_,i)=><button key={i} onClick={()=>setCurrent(i)} style={{width:32,height:32,borderRadius:6,border:i===current?"2px solid #58a6ff":"1px solid #30363d",background:answers[i]?.trim()?"#1f6feb33":"transparent",color:i===current?"#58a6ff":"#8b949e",cursor:"pointer",fontSize:12,fontWeight:700}}>{i+1}</button>)}
      </div>
    </div>}
  </div>;
}

// ─── PRACTICE WEAKNESSES ──────────────────────────────────────────────────────
function PracticeWeaknesses({weaknesses,stats,onScore,sessionGaps,addSessionGap}) {
  const [question,setQuestion]=useState("");
  const [answer,setAnswer]=useState("");
  const [feedback,setFeedback]=useState(null);
  const [loadingQ,setLoadingQ]=useState(false);
  const [loadingF,setLoadingF]=useState(false);
  const [selected,setSelected]=useState(null);
  const weakList=Object.keys(weaknesses);

  if (!weakList.length) return <div>
    <h2 style={{color:"#58a6ff",marginTop:0}}>🎯 Practice Weaknesses</h2>
    <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:12,padding:32,textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:16}}>🔒</div>
      <div style={{color:"#8b949e",fontSize:16}}>Take a proficiency exam first to unlock this section.</div>
    </div>
  </div>;

  async function generate() {
    if (!selected) return;
    setLoadingQ(true); setQuestion(""); setAnswer(""); setFeedback(null);
    const prompt=`Targeted PostgreSQL practice question for healthcare specifically on: "${selected}". Scenario, 1-2 schemas, sample data, question requiring "${selected}". No answer.`;
    setQuestion(await callClaude(prompt)); setLoadingQ(false);
  }

  async function submit() {
    if (!question||!answer.trim()) return;
    setLoadingF(true); setFeedback(null);
    const fb=await generateFeedback("query writing","Intermediate",question,answer);
    setFeedback(fb);
    const total=(fb.breakdown?.correctness||0)+(fb.breakdown?.syntax||0)+(fb.breakdown?.efficiency||0)+(fb.breakdown?.clarity||0);
    onScore(total,1,"weakness",fb.gaps||[],selected);
    setLoadingF(false);
  }

  return <div>
    <h2 style={{color:"#58a6ff",marginTop:0}}>🎯 Practice Weaknesses</h2>
    <SessionGapTracker gaps={sessionGaps}/>
    <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>
      {weakList.map(w=><button key={w} onClick={()=>setSelected(w)}
        style={{padding:"8px 16px",borderRadius:20,border:"2px solid",borderColor:selected===w?"#f97316":"#30363d",background:selected===w?"#f9731622":"transparent",color:selected===w?"#f97316":"#8b949e",cursor:"pointer",fontWeight:600,fontSize:13}}>
        {w} ({weaknesses[w]}×)
      </button>)}
    </div>
    {selected&&<>
      <button onClick={generate} disabled={loadingQ} style={{padding:"10px 24px",background:"#1f6feb",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:14}}>
        {loadingQ?<><Spinner/> Generating...</>:`Generate "${selected}" Question`}
      </button>
      {question&&<div style={{marginTop:20}}>
        <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:8,padding:16,marginBottom:16}}>
          <pre style={{color:"#e6edf3",whiteSpace:"pre-wrap",fontFamily:"inherit",fontSize:13,margin:0}}>{question}</pre>
        </div>
        <CodeEditor value={answer} onChange={setAnswer} placeholder="Your SQL answer..."/>
        <button onClick={submit} disabled={loadingF||!answer.trim()} style={{marginTop:12,padding:"10px 24px",background:"#238636",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700}}>
          {loadingF?<><Spinner/> Checking...</>:"Submit Answer"}
        </button>
        <FeedbackBox feedback={feedback} addSessionGap={addSessionGap} onDrillComplete={(s,c)=>onScore(s,1,"drill",[],c)}/>
      </div>}
    </>}
  </div>;
}

// ─── PROGRESS DASHBOARD ───────────────────────────────────────────────────────
function Dashboard({stats,earnedBadges}) {
  const lvl=getLevelInfo(stats.xp);
  const xpInLevel=stats.xp-lvl.cur.xp;
  const xpNeeded=lvl.nxt?(lvl.nxt.xp-lvl.cur.xp):1;
  const pct=Math.min(100,Math.round((xpInLevel/xpNeeded)*100));
  const groups=[...new Set(BADGES.map(b=>b.group))];

  return <div>
    <h2 style={{color:"#58a6ff",marginTop:0}}>📈 Progress Dashboard</h2>
    {/* Level card */}
    <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:12,padding:24,marginBottom:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div>
          <div style={{color:"#8b949e",fontSize:12,textTransform:"uppercase",letterSpacing:1}}>Level {lvl.cur.level}</div>
          <div style={{color:"#e6edf3",fontSize:22,fontWeight:800}}>{lvl.cur.title}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{color:"#58a6ff",fontSize:28,fontWeight:800}}>{stats.xp.toLocaleString()} XP</div>
          {lvl.nxt&&<div style={{color:"#8b949e",fontSize:12}}>{(lvl.nxt.xp-stats.xp).toLocaleString()} to {lvl.nxt.title}</div>}
        </div>
      </div>
      <div style={{background:"#0d1117",borderRadius:6,height:10}}>
        <div style={{height:10,borderRadius:6,background:"linear-gradient(90deg,#1f6feb,#58a6ff)",width:`${pct}%`,transition:"width 0.5s"}}/>
      </div>
      <div style={{color:"#8b949e",fontSize:12,marginTop:4}}>{pct}% to next level</div>
    </div>

    {/* Stats grid */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:20}}>
      {[
        {label:"Total Questions",val:stats.totalQ,icon:"📝"},
        {label:"Total Drills",val:stats.totalDrills,icon:"🏋️"},
        {label:"Avg Score",val:`${stats.avgScore||0}/100`,icon:"🎯"},
        {label:"Badges",val:`${earnedBadges.length}/${BADGES.length}`,icon:"🏅"},
        {label:"Top Score",val:`${stats.topScore||0}/100`,icon:"💯"},
        {label:"Troubleshooting",val:stats.troubleshootingQ||0,icon:"🔧"},
      ].map(s=><div key={s.label} style={{background:"#161b22",border:"1px solid #30363d",borderRadius:10,padding:"14px 12px",textAlign:"center"}}>
        <div style={{fontSize:24}}>{s.icon}</div>
        <div style={{color:"#e6edf3",fontSize:20,fontWeight:800,marginTop:4}}>{s.val}</div>
        <div style={{color:"#8b949e",fontSize:11,marginTop:2}}>{s.label}</div>
      </div>)}
    </div>

    {/* Scores by difficulty */}
    {Object.keys(stats.scoresByDiff||{}).length>0&&<div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:12,padding:20,marginBottom:20}}>
      <div style={{color:"#e6edf3",fontWeight:700,marginBottom:16}}>Avg Score by Difficulty</div>
      {DIFFICULTIES.map((d,i)=>{
        const data=stats.scoresByDiff?.[i];
        if (!data||!data.count) return null;
        const avg=Math.round(data.total/data.count);
        return <div key={d} style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{color:DIFF_COLORS[i],fontSize:13,fontWeight:600}}>{d}</span>
            <span style={{color:"#e6edf3",fontSize:13}}>{avg}/100 <span style={{color:"#8b949e"}}>({data.count} q)</span></span>
          </div>
          <div style={{background:"#0d1117",borderRadius:4,height:8}}>
            <div style={{height:8,borderRadius:4,background:DIFF_COLORS[i],width:`${avg}%`,transition:"width 0.5s"}}/>
          </div>
        </div>;
      })}
    </div>}

    {/* Badges */}
    <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:12,padding:20}}>
      <div style={{color:"#e6edf3",fontWeight:700,marginBottom:16}}>🏅 Badges ({earnedBadges.length}/{BADGES.length})</div>
      {groups.map(g=><div key={g} style={{marginBottom:20}}>
        <div style={{color:"#8b949e",fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{g}</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {BADGES.filter(b=>b.group===g).map(b=>{
            const earned=earnedBadges.includes(b.id);
            return <div key={b.id} title={b.desc} style={{background:earned?"#1a1a2e":"#0d1117",border:`1px solid ${earned?"#f97316":"#30363d"}`,borderRadius:10,padding:"10px 14px",textAlign:"center",minWidth:80,opacity:earned?1:0.4,transition:"all 0.3s"}}>
              <div style={{fontSize:24}}>{b.emoji}</div>
              <div style={{color:earned?"#f97316":"#8b949e",fontSize:11,fontWeight:700,marginTop:4}}>{b.name}</div>
            </div>;
          })}
        </div>
      </div>)}
    </div>
  </div>;
}

// ─── CHEAT SHEET ──────────────────────────────────────────────────────────────
function CheatSheet() {
  const [open,setOpen]=useState(null);
  return <div>
    <h2 style={{color:"#58a6ff",marginTop:0}}>📚 Concept Reference</h2>
    <p style={{color:"#8b949e"}}>Quick-access PostgreSQL reference with healthcare examples.</p>
    {Object.entries(CHEAT_SHEET).map(([cat,{color,functions}])=><div key={cat} style={{marginBottom:8}}>
      <button onClick={()=>setOpen(open===cat?null:cat)}
        style={{width:"100%",padding:"12px 16px",background:"#161b22",border:`1px solid ${open===cat?color:"#30363d"}`,borderRadius:open===cat?"8px 8px 0 0":8,color:open===cat?color:"#e6edf3",cursor:"pointer",textAlign:"left",fontWeight:700,fontSize:14,display:"flex",justifyContent:"space-between"}}>
        <span>{cat}</span><span style={{color:"#8b949e"}}>{open===cat?"▲":"▼"} {functions.length}</span>
      </button>
      {open===cat&&<div style={{border:`1px solid ${color}`,borderTop:"none",borderRadius:"0 0 8px 8px",overflow:"hidden"}}>
        {functions.map((fn,i)=><div key={fn.name} style={{padding:16,background:i%2===0?"#0d1117":"#161b22",borderTop:i>0?"1px solid #30363d":"none"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <code style={{background:color+"22",color,padding:"2px 8px",borderRadius:4,fontSize:13,fontWeight:700}}>{fn.name}</code>
            <span style={{color:"#8b949e",fontSize:13}}>{fn.desc}</span>
          </div>
          <pre style={{margin:0,background:"#0d1117",border:"1px solid #30363d",borderRadius:6,padding:"8px 12px",color:"#e6edf3",fontSize:12,whiteSpace:"pre-wrap"}}>{fn.syntax}</pre>
        </div>)}
      </div>}
    </div>)}
  </div>;
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const DEFAULT_STATS={xp:0,totalQ:0,totalDrills:0,avgScore:0,topScore:0,troubleshootingQ:0,scoresByDiff:{},scoreHistory:[],writingQ:0,weaknessQ:0,removedWeaknesses:0};

export default function App() {
  const [tab,setTab]=useState("writing");
  const [weaknesses,setWeaknesses]=useState({});
  const [sessionGaps,setSessionGaps]=useState({});
  const [stats,setStats]=useState(DEFAULT_STATS);
  const [earnedBadges,setEarnedBadges]=useState([]);
  const [xpToasts,setXpToasts]=useState([]);
  const [badgeToasts,setBadgeToasts]=useState([]);
  const [loaded,setLoaded]=useState(false);
  const consecutiveHighRef=useRef(0);

  useEffect(()=>{
    (async()=>{
      try {
        const [w,s,b]=await Promise.all([
          window.storage.get("sql_weaknesses").catch(()=>null),
          window.storage.get("sql_stats").catch(()=>null),
          window.storage.get("sql_badges").catch(()=>null),
        ]);
        if (w) setWeaknesses(JSON.parse(w.value));
        if (s) setStats(prev=>({...DEFAULT_STATS,...JSON.parse(s.value)}));
        if (b) setEarnedBadges(JSON.parse(b.value));
      } catch {}
      setLoaded(true);
    })();
  },[]);

  const saveAll=useCallback(async(newStats,newBadges,newWeaknesses)=>{
    try {
      await Promise.all([
        window.storage.set("sql_stats",JSON.stringify(newStats)),
        window.storage.set("sql_badges",JSON.stringify(newBadges)),
        window.storage.set("sql_weaknesses",JSON.stringify(newWeaknesses)),
      ]);
    } catch {}
  },[]);

  function showXP(xp,levelUpTitle) {
    const id=Date.now();
    setXpToasts(p=>[...p,{id,xp,levelUp:levelUpTitle}]);
    setTimeout(()=>setXpToasts(p=>p.filter(t=>t.id!==id)),3000);
  }

  function showBadge(badge) {
    const id=Date.now()+Math.random();
    setBadgeToasts(p=>[...p,{...badge,id}]);
    setTimeout(()=>setBadgeToasts(p=>p.filter(t=>t.id!==id)),4000);
  }

  function checkBadges(newStats,newBadges,score,diffIdx,type,gaps,drillConcept,weaknessesNow) {
    const add=(id)=>{ if (!newBadges.includes(id)){newBadges.push(id); const b=BADGES.find(x=>x.id===id); if(b) showBadge(b);} };
    const lvl=getLevelInfo(newStats.xp).cur.level;
    if (newStats.totalQ>=1) add("first_steps");
    if (newStats.totalQ>=5) add("warming_up");
    if (newStats.totalDrills>=1) add("first_drill");
    if (newStats.totalDrills>=10) add("drills_10");
    if (newStats.totalDrills>=25) add("drills_25");
    if (newStats.totalQ>=25) add("q_25");
    if (newStats.totalQ>=50) add("q_50");
    if (newStats.totalQ>=100) add("q_100");
    if (score>=70) add("score_70");
    if (score>=85) add("score_85");
    if (score>=100) add("score_100");
    if ((newStats.scoresByDiff?.[0]?.highCount||0)>=5) add("beg_cleared");
    if ((newStats.scoresByDiff?.[1]?.highCount||0)>=5) add("int_cleared");
    if ((newStats.scoresByDiff?.[2]?.highCount||0)>=5) add("dif_cleared");
    if ((newStats.scoresByDiff?.[3]?.highCount||0)>=5) add("adv_cleared");
    if ((newStats.scoresByDiff?.[4]?.highCount||0)>=5) add("exp_cleared");
    if (score>=90) { consecutiveHighRef.current=(consecutiveHighRef.current||0)+1; if(consecutiveHighRef.current>=5) add("big_brain"); } else { consecutiveHighRef.current=0; }
    if (score>=85) { newStats._consHigh85=(newStats._consHigh85||0)+1; if(newStats._consHigh85>=10) add("consistent"); } else newStats._consHigh85=0;
    if (score>=90&&(diffIdx===3||diffIdx===4)) add("sharp_mind");
    if (type==="troubleshooting"&&newStats.troubleshootingQ>=10) add("fixer");
    if (drillConcept&&score>=90) add("pharmacist");
    if ((newStats.removedWeaknesses||0)>=3) add("growth");
    if (newStats.writingQ>=10&&newStats.troubleshootingQ>=10&&(newStats.weaknessQ||0)>=10) add("well_rounded");
    if (lvl>=5) add("level_5");
    if (lvl>=9) add("level_9");
    if (lvl>=13) add("level_13");
    if (lvl>=16) add("level_16");
    if (lvl>=20) add("level_20");
  }

  function onScore(score,diffIdx,type,gaps=[],drillConcept=null) {
    setStats(prev=>{
      const oldLvl=getLevelInfo(prev.xp).cur;
      const bonus=score>=90?5:score>=80?2:0;
      const xpEarned=type==="drill"?Math.round(calcXP(score,diffIdx,bonus)*0.5):calcXP(score,diffIdx,bonus);
      const newXP=prev.xp+xpEarned;
      const newLvl=getLevelInfo(newXP).cur;
      const leveledUp=newLvl.level>oldLvl.level;
      showXP(xpEarned,leveledUp?newLvl.title:null);

      const newStats={
        ...prev, xp:newXP,
        totalQ: type==="drill"?prev.totalQ:(prev.totalQ||0)+1,
        totalDrills: type==="drill"?(prev.totalDrills||0)+1:prev.totalDrills,
        troubleshootingQ: type==="troubleshooting"?(prev.troubleshootingQ||0)+1:prev.troubleshootingQ,
        writingQ: type==="writing"?(prev.writingQ||0)+1:prev.writingQ,
        weaknessQ: type==="weakness"?(prev.weaknessQ||0)+1:prev.weaknessQ,
        topScore: Math.max(prev.topScore||0,score),
        scoreHistory:[...(prev.scoreHistory||[]).slice(-29),{score,type,diff:diffIdx,ts:Date.now()}],
      };
      // avg score
      const allScores=[...(prev.scoreHistory||[]).map(s=>s.score),score];
      newStats.avgScore=Math.round(allScores.reduce((a,b)=>a+b,0)/allScores.length);
      // by diff
      const sd={...(prev.scoresByDiff||{})};
      if (!sd[diffIdx]) sd[diffIdx]={total:0,count:0,highCount:0};
      sd[diffIdx]={total:sd[diffIdx].total+score,count:sd[diffIdx].count+1,highCount:sd[diffIdx].highCount+(score>=80?1:0)};
      newStats.scoresByDiff=sd;

      setEarnedBadges(prevB=>{
        const newB=[...prevB];
        checkBadges(newStats,newB,score,diffIdx,type,gaps,drillConcept,weaknesses);
        saveAll(newStats,newB,weaknesses);
        return newB;
      });
      return newStats;
    });
  }

  function onExamScore(avgScore,passed) {
    onScore(avgScore,2,"exam",[]);
    if (passed) setEarnedBadges(prev=>{
      const newB=[...prev];
      if (!newB.includes("first_exam")){newB.push("first_exam");const b=BADGES.find(x=>x.id==="first_exam");if(b)showBadge(b);}
      return newB;
    });
  }

  function updateWeaknesses(w) {
    const removed=Object.keys(weaknesses).filter(k=>!w[k]).length;
    setStats(prev=>{
      const ns={...prev,removedWeaknesses:(prev.removedWeaknesses||0)+removed};
      saveAll(ns,earnedBadges,w);
      if (removed>0) setEarnedBadges(prevB=>{
        const nb=[...prevB];
        if ((ns.removedWeaknesses||0)>=3&&!nb.includes("growth")){nb.push("growth");const b=BADGES.find(x=>x.id==="growth");if(b)showBadge(b);}
        if (removed>0&&!nb.includes("comeback")){nb.push("comeback");const b=BADGES.find(x=>x.id==="comeback");if(b)showBadge(b);}
        return nb;
      });
      return ns;
    });
    setWeaknesses(w);
  }

  function addSessionGap(concept) { setSessionGaps(p=>({...p,[concept]:(p[concept]||0)+1})); }

  const lvlInfo=getLevelInfo(stats.xp);
  const xpInLevel=stats.xp-lvlInfo.cur.xp;
  const xpNeeded=lvlInfo.nxt?(lvlInfo.nxt.xp-lvlInfo.cur.xp):1;
  const lvlPct=Math.min(100,Math.round((xpInLevel/xpNeeded)*100));

  const TABS=[
    {id:"writing",label:"✍️ Query Writing"},
    {id:"troubleshooting",label:"🔧 Troubleshooting"},
    {id:"exam",label:"📋 Exam"},
    {id:"weaknesses",label:`🎯 Weaknesses${Object.keys(weaknesses).length>0?` (${Object.keys(weaknesses).length})`:""}` },
    {id:"dashboard",label:"📈 Dashboard"},
    {id:"reference",label:"📚 Reference"},
  ];

  if (!loaded) return <div style={{background:"#0d1117",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#58a6ff"}}>Loading...</div>;

  return <div style={{background:"#0d1117",minHeight:"100vh",color:"#e6edf3",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
    <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box}`}</style>
    <XPToast toasts={xpToasts}/>
    <BadgeToast badges={badgeToasts}/>

    {/* Header */}
    <div style={{background:"#161b22",borderBottom:"1px solid #30363d",padding:"12px 20px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
      <span style={{fontSize:20}}>🏥</span>
      <span style={{fontWeight:800,fontSize:16}}>Healthcare SQL</span>
      <div style={{flex:1,maxWidth:280}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
          <span style={{color:"#58a6ff",fontSize:12,fontWeight:700}}>Lv.{lvlInfo.cur.level} {lvlInfo.cur.title}</span>
          <span style={{color:"#8b949e",fontSize:11}}>{stats.xp.toLocaleString()} XP</span>
        </div>
        <div style={{background:"#0d1117",borderRadius:4,height:6}}>
          <div style={{height:6,borderRadius:4,background:"linear-gradient(90deg,#1f6feb,#58a6ff)",width:`${lvlPct}%`,transition:"width 0.5s"}}/>
        </div>
      </div>
      <span style={{color:"#f97316",fontSize:13,fontWeight:700}}>🏅 {earnedBadges.length}/{BADGES.length}</span>
      {Object.keys(sessionGaps).length>0&&<span style={{background:"#f9731622",border:"1px solid #f97316",color:"#f97316",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700}}>{Object.keys(sessionGaps).length} gap{Object.keys(sessionGaps).length>1?"s":""} this session</span>}
    </div>

    {/* Tabs */}
    <div style={{display:"flex",borderBottom:"1px solid #30363d",background:"#161b22",paddingLeft:8,overflowX:"auto"}}>
      {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)}
        style={{padding:"12px 16px",background:"transparent",border:"none",borderBottom:tab===t.id?"2px solid #58a6ff":"2px solid transparent",color:tab===t.id?"#58a6ff":"#8b949e",cursor:"pointer",fontWeight:600,fontSize:13,whiteSpace:"nowrap"}}>
        {t.label}
      </button>)}
    </div>

    <div style={{maxWidth:880,margin:"0 auto",padding:28}}>
      {tab==="writing"&&<QueryWriting stats={stats} onScore={onScore} sessionGaps={sessionGaps} addSessionGap={addSessionGap}/>}
      {tab==="troubleshooting"&&<Troubleshooting stats={stats} onScore={onScore} sessionGaps={sessionGaps} addSessionGap={addSessionGap}/>}
      {tab==="exam"&&<ProficiencyExam weaknesses={weaknesses} setWeaknesses={updateWeaknesses} onExamScore={onExamScore}/>}
      {tab==="weaknesses"&&<PracticeWeaknesses weaknesses={weaknesses} stats={stats} onScore={onScore} sessionGaps={sessionGaps} addSessionGap={addSessionGap}/>}
      {tab==="dashboard"&&<Dashboard stats={stats} earnedBadges={earnedBadges}/>}
      {tab==="reference"&&<CheatSheet/>}
    </div>
  </div>;
}
