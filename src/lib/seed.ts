export const SEED_SUBJECTS = [
  { id:"sub_m1", name:"Engineering Mathematics I", code:"M-1", semester:1, department:"Engineering", academicYear:"FE", description:"Matrices, differential & integral calculus, vector algebra.", icon:"sigma" },
  { id:"sub_physics", name:"Engineering Physics", code:"EPH", semester:1, department:"Engineering", academicYear:"FE", description:"Mechanics, optics, semiconductors and modern physics.", icon:"atom" },
  { id:"sub_chem", name:"Engineering Chemistry", code:"ECH", semester:1, department:"Engineering", academicYear:"FE", description:"Water chemistry, polymers, electrochemistry, fuels.", icon:"flask" },
  { id:"sub_fpl", name:"Fundamentals of Programming Languages", code:"FPL", semester:1, department:"Computer Engineering", academicYear:"FE", description:"C programming: basics, control flow, functions, arrays, pointers, files.", icon:"code" },
  { id:"sub_bee", name:"Basic Electrical Engineering", code:"BEE", semester:1, department:"Electrical Engineering", academicYear:"FE", description:"DC/AC circuits, transformers, machines, wiring.", icon:"zap" },
  { id:"sub_bxe", name:"Basic Electronics Engineering", code:"BXE", semester:2, department:"E&TC Engineering", academicYear:"FE", description:"Diodes, transistors, op-amps, digital electronics.", icon:"cpu" },
  { id:"sub_mech", name:"Engineering Mechanics", code:"EM", semester:2, department:"Mechanical Engineering", academicYear:"FE", description:"Statics, friction, kinematics, kinetics.", icon:"cog" },
  { id:"sub_comm", name:"Engineering Communication", code:"EC", semester:2, department:"Humanities", academicYear:"FE", description:"Technical writing, presentations, group discussion.", icon:"message" },
  { id:"sub_workshop", name:"Workshop Practices", code:"WS", semester:1, department:"Mechanical Engineering", academicYear:"FE", description:"Carpentry, fitting, welding, sheet metal, safety.", icon:"wrench" },
  { id:"sub_m2", name:"Engineering Mathematics II", code:"M-2", semester:2, department:"Engineering", academicYear:"FE", description:"ODEs, Laplace transforms, Fourier series, statistics.", icon:"sigma" },
];

export const SEED_TOPICS = [
  { id:"top_m1_mat", subjectId:"sub_m1", name:"Matrices", description:"Rank, eigenvalues, Cayley-Hamilton." },
  { id:"top_m1_diff", subjectId:"sub_m1", name:"Differential Calculus", description:"Limits, continuity, partial differentiation." },
  { id:"top_m1_int", subjectId:"sub_m1", name:"Integral Calculus", description:"Definite integrals, beta-gamma, applications." },
  { id:"top_m1_vec", subjectId:"sub_m1", name:"Vector Algebra", description:"Dot/cross products, lines and planes." },
  { id:"top_fpl_1", subjectId:"sub_fpl", name:"C Basics & Control Flow", description:"Data types, operators, loops, branching." },
  { id:"top_fpl_2", subjectId:"sub_fpl", name:"Functions & Arrays", description:"Functions, recursion, arrays, strings." },
  { id:"top_fpl_3", subjectId:"sub_fpl", name:"Pointers & Files", description:"Pointers, structures, file handling." },
  { id:"top_chem_2", subjectId:"sub_chem", name:"Unit 2: Polymers", description:"Polymerization, plastics, rubbers." },
  { id:"top_bxe_1", subjectId:"sub_bxe", name:"Diodes & Transistors", description:"PN junction, BJT biasing, amplifiers." },
  { id:"top_bee_1", subjectId:"sub_bee", name:"AC Circuits", description:"RLC circuits, resonance, power factor." },
];

export const SEED_RESOURCES = [
  { id:"res_m1_pyq25", title:"Engineering Mathematics I — 2025 End-Sem PYQ", description:"End semester university paper covering matrices, differential calculus and vector algebra with full marks distribution.", resourceType:"PYQ", subjectId:"sub_m1", topic:"Matrices", semester:1, academicYear:"FE", year:2025, examType:"University", tags:["matrices","calculus","pyq","important"], sourceType:"EXTERNAL_URL", sourceClassification:"COMMUNITY", url:"", author:"Student archive", contributorName:"Demo seed", status:"PUBLISHED", visibility:"PUBLIC", isFeatured:true },
  { id:"res_m1_pyq24", title:"Engineering Mathematics I — 2024 End-Sem PYQ", description:"Previous year paper with solutions outline for integral calculus and differential equations section.", resourceType:"PYQ", subjectId:"sub_m1", topic:"Integral Calculus", semester:1, academicYear:"FE", year:2024, examType:"End Semester", tags:["calculus","pyq","revision"], sourceType:"EXTERNAL_URL", sourceClassification:"COMMUNITY", url:"", author:"Student archive", contributorName:"Demo seed", status:"PUBLISHED", visibility:"PUBLIC" },
  { id:"res_m1_notes", title:"M-1 Matrices & Eigenvalues — Complete Notes", description:"Clean handwritten-style notes: rank, normal form, eigenvalues, Cayley-Hamilton with solved examples.", resourceType:"NOTE", subjectId:"sub_m1", topic:"Matrices", semester:1, academicYear:"FE", year:2026, tags:["matrices","notes","important"], sourceType:"EXTERNAL_URL", sourceClassification:"STUDENT", url:"", author:"Study group", contributorName:"Demo seed", status:"PUBLISHED", visibility:"PUBLIC", isFeatured:true },
  { id:"res_chem_notes", title:"Engineering Chemistry — Unit 2 Polymer Notes", description:"Polymerization types, engineering plastics, conducting polymers with diagrams and comparisons.", resourceType:"NOTE", subjectId:"sub_chem", topic:"Unit 2: Polymers", semester:1, academicYear:"FE", year:2026, tags:["polymers","chemistry","notes"], sourceType:"EXTERNAL_URL", sourceClassification:"STUDENT", url:"", author:"Chem circle", contributorName:"Demo seed", status:"PUBLISHED", visibility:"PUBLIC" },
  { id:"res_fpl_exp1", title:"FPL — Experiment 1: C Environment & First Programs", description:"Lab write-up: flowcharts, algorithm, program and output for basic C programs with viva questions.", resourceType:"PRACTICAL", subjectId:"sub_fpl", topic:"C Basics & Control Flow", semester:1, academicYear:"FE", year:2026, tags:["fpl","practical","c-programming"], sourceType:"EXTERNAL_URL", sourceClassification:"STUDENT", url:"", author:"Lab batch A", contributorName:"Demo seed", status:"PUBLISHED", visibility:"PUBLIC" },
  { id:"res_fpl_manual", title:"FPL Lab Manual (Student-compiled)", description:"Compiled manual for all FPL experiments with aim, theory, code and expected output. Student-contributed — verify with faculty lab manual.", resourceType:"LAB_MANUAL", subjectId:"sub_fpl", topic:"C Basics & Control Flow", semester:1, academicYear:"FE", year:2026, tags:["fpl","lab-manual","c-programming"], sourceType:"EXTERNAL_URL", sourceClassification:"STUDENT", url:"", author:"Study group", contributorName:"Demo seed", status:"PUBLISHED", visibility:"PUBLIC", isFeatured:true },
  { id:"res_bxe_viva", title:"Basic Electronics — Viva Questions Bank", description:"80+ viva questions on diodes, BJT, op-amps and digital circuits with short answers.", resourceType:"VIVA", subjectId:"sub_bxe", topic:"Diodes & Transistors", semester:2, academicYear:"FE", year:2026, tags:["electronics","viva","important"], sourceType:"EXTERNAL_URL", sourceClassification:"STUDENT", url:"", author:"E&TC seniors", contributorName:"Demo seed", status:"PUBLISHED", visibility:"PUBLIC" },
  { id:"res_comm_pres", title:"Engineering Communication — Technical Presentation Guide", description:"Slide structure, body language and Q&A handling guide with sample outlines.", resourceType:"PRESENTATION", subjectId:"sub_comm", topic:"", semester:2, academicYear:"FE", year:2025, tags:["communication","presentation"], sourceType:"EXTERNAL_URL", sourceClassification:"FACULTY", url:"", author:"Humanities dept.", contributorName:"Demo seed", status:"PUBLISHED", visibility:"PUBLIC" },
  { id:"res_ws_manual", title:"Workshop — Practical Manual Overview", description:"Safety rules, carpentry/fitting/welding jobs with measurement tables.", resourceType:"LAB_MANUAL", subjectId:"sub_workshop", topic:"", semester:1, academicYear:"FE", year:2026, tags:["workshop","practical"], sourceType:"EXTERNAL_URL", sourceClassification:"STUDENT", url:"", author:"Workshop staff notes", contributorName:"Demo seed", status:"PUBLISHED", visibility:"PUBLIC" },
  { id:"res_bee_qb", title:"BEE AC Circuits — Question Bank", description:"Numericals on RLC, resonance and power factor with difficulty tags.", resourceType:"QUESTION_BANK", subjectId:"sub_bee", topic:"AC Circuits", semester:1, academicYear:"FE", year:2026, tags:["bee","question-bank","numericals"], sourceType:"EXTERNAL_URL", sourceClassification:"COMMUNITY", url:"", author:"EE seniors", contributorName:"Demo seed", status:"PUBLISHED", visibility:"PUBLIC" },
  { id:"res_m2_syllabus", title:"Engineering Mathematics II — Syllabus Copy", description:"Unit-wise syllabus: ODEs, Laplace, Fourier, statistics. Verify against official university syllabus.", resourceType:"SYLLABUS", subjectId:"sub_m2", topic:"", semester:2, academicYear:"FE", year:2026, tags:["syllabus","m2"], sourceType:"EXTERNAL_URL", sourceClassification:"EXTERNAL", url:"", author:"University site mirror", contributorName:"Demo seed", status:"PUBLISHED", visibility:"PUBLIC" },
  { id:"res_fpl_videos", title:"C Pointers — Curated Video Playlist", description:"External playlist covering pointers, structures and file handling in C.", resourceType:"VIDEO", subjectId:"sub_fpl", topic:"Pointers & Files", semester:1, academicYear:"FE", year:2026, tags:["c-programming","video","pointers"], sourceType:"EXTERNAL_URL", sourceClassification:"EXTERNAL", url:"https://www.youtube.com/results?search_query=c+pointers+tutorial", author:"Various educators", contributorName:"Demo seed", status:"PUBLISHED", visibility:"PUBLIC" },
  { id:"res_mech_assign", title:"Engineering Mechanics — Friction Assignment Set", description:"Practice problems on friction with free-body diagrams.", resourceType:"ASSIGNMENT", subjectId:"sub_mech", topic:"", semester:2, academicYear:"FE", year:2026, tags:["mechanics","assignment","friction"], sourceType:"EXTERNAL_URL", sourceClassification:"STUDENT", url:"", author:"Mech batch", contributorName:"Demo seed", status:"PENDING_REVIEW", visibility:"PUBLIC" },
  { id:"res_ep_ref", title:"Engineering Physics — Semiconductor Reference", description:"Reference compilation: band theory, Hall effect, solar cell with formulas.", resourceType:"REFERENCE", subjectId:"sub_physics", topic:"", semester:1, academicYear:"FE", year:2025, tags:["physics","reference","semiconductor"], sourceType:"EXTERNAL_URL", sourceClassification:"COMMUNITY", url:"", author:"Physics club", contributorName:"Demo seed", status:"PUBLISHED", visibility:"PUBLIC" },
];

export const SEED_TIMETABLE = [
  { id:"tt1", day:"Monday", startTime:"09:00", endTime:"10:00", subject:"Engineering Mathematics I", subjectId:"sub_m1", faculty:"Dr. A. Sharma", room:"A-101", type:"Lecture", semester:1 },
  { id:"tt2", day:"Monday", startTime:"10:00", endTime:"11:00", subject:"FPL", subjectId:"sub_fpl", faculty:"Prof. R. Iyer", room:"Lab-3", type:"Lab", semester:1 },
  { id:"tt3", day:"Tuesday", startTime:"09:00", endTime:"10:00", subject:"Engineering Chemistry", subjectId:"sub_chem", faculty:"Dr. N. Rao", room:"A-102", type:"Lecture", semester:1 },
  { id:"tt4", day:"Wednesday", startTime:"11:00", endTime:"12:00", subject:"Basic Electrical Engineering", subjectId:"sub_bee", faculty:"Prof. S. Khan", room:"B-201", type:"Lecture", semester:1 },
];

export const SEED_CALENDAR = [
  { id:"cal1", title:"Mid-Semester Examinations", date:"2026-10-12", endDate:"2026-10-18", type:"Exam", description:"Mid-semester exam week for FE.", isOfficial:false, sourceName:"", sourceUrl:"" },
  { id:"cal2", title:"Diwali Break", date:"2026-11-08", endDate:"2026-11-14", type:"Holiday", description:"Tentative holiday break.", isOfficial:false, sourceName:"", sourceUrl:"" },
];

export const SEED_EXAMS = [
  { id:"ex1", subject:"Engineering Mathematics I", subjectId:"sub_m1", date:"2026-10-12", time:"10:00 AM", location:"Block A", examType:"Mid Semester", semester:1, isOfficial:false, sourceName:"", sourceUrl:"" },
  { id:"ex2", subject:"FPL", subjectId:"sub_fpl", date:"2026-10-14", time:"10:00 AM", location:"Block A", examType:"Mid Semester", semester:1, isOfficial:false, sourceName:"", sourceUrl:"" },
];

export const SEED_NOTICES = [
  { id:"n1", title:"Library extended hours during exams", date:"2026-09-20", category:"Library", content:"Central library will remain open till 9 PM on weekdays during the mid-semester exam period.", source:"Library desk (unverified)", isOfficial:false, sourceUrl:"" },
  { id:"n2", title:"FPL lab file submission deadline", date:"2026-09-25", category:"Lab", content:"Submit completed lab files including Experiment 1–5 to your batch mentor. Confirm with faculty notice board.", source:"Student note (unverified)", isOfficial:false, sourceUrl:"" },
];
