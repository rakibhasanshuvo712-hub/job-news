import { db, count } from './db.js';
import { hashPassword } from './auth.js';

export function seedIfEmpty() {
  if (count('categories') > 0) return;

  db.exec('BEGIN');
  try {
    // ---- Categories ----
    const cats = [
      ['Government', 'government', 'landmark'],
      ['Banking', 'banking', 'building-columns'],
      ['IT & Software', 'it-software', 'laptop-code'],
      ['Private Company', 'private-company', 'briefcase'],
      ['NGO & Development', 'ngo-development', 'handshake'],
      ['Teaching', 'teaching', 'graduation-cap'],
      ['Health', 'health', 'heart-pulse'],
      ['Insurance', 'insurance', 'shield-halved'],
    ];
    const insCat = db.prepare('INSERT INTO categories (name, slug, icon) VALUES (?, ?, ?)');
    const catIds = {};
    for (const [name, slug, icon] of cats) {
      const res = insCat.run(name, slug, icon);
      catIds[slug] = Number(res.lastInsertRowid);
    }

    // ---- Jobs ----
    const days = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
    const jobs = [
      ['Assistant Director (General Side)', 'Bangladesh Bank', 'banking', 'Dhaka', 'Full-time', 'BDT 22,000 – 53,060 (Grade 3)', 120, days(18),
        'Bangladesh Bank, the central bank of Bangladesh, invites applications from Bangladeshi citizens for the position of Assistant Director (General Side). Selected candidates will be posted in various departments of Bangladesh Bank head office and branches across the country.',
        'Master\u2019s degree or 4-year bachelor\u2019s degree (minimum 16 years of schooling) in any discipline with at least two first divisions/classes. Age 21\u201330 years as of the deadline. No third division/class allowed.',
        'Apply online through Bangladesh Bank e-recruitment portal (erecruitment.bb.org.bd) before the deadline. Application fee BDT 200 via mobile banking or card.'],
      ['Sub-Assistant Engineer (Civil)', 'Bangladesh Power Development Board', 'government', 'Chattogram', 'Full-time', 'BDT 16,000 – 38,640 (Grade 10)', 85, days(12),
        'BPDB under the Ministry of Power, Energy and Mineral Resources recruits Sub-Assistant Engineers (Civil) for its distribution and generation divisions nationwide.',
        'Diploma-in-Engineering in Civil Technology from a government polytechnic institute. Age 18\u201332 years. Quota rules as per government circular apply.',
        'Submit application form (BPDB Form-A) with attested copies of certificates, transcripts and 2 photographs to the Secretary, BPDB, WAPDA Building, Motijheel, Dhaka-1000.'],
      ['Senior Software Engineer (Backend)', 'Grameenphone IT', 'it-software', 'Dhaka (Banani)', 'Full-time', 'BDT 90,000 – 130,000 + benefits', 4, days(9),
        'Join the platform engineering team building high-scale telecommunication systems serving 80M+ subscribers. You will design APIs, own services end-to-end and mentor junior engineers.',
        '5+ years with Node.js/Java/Go and PostgreSQL. Experience with Docker, Kubernetes and event-driven architecture (Kafka). Strong system design fundamentals. BSc in CSE or equivalent experience.',
        'Email your CV with subject "SSE-Backend" to careers@gpit.com.bd or apply through the GP IT career portal.'],
      ['Frontend Developer (React)', 'ShopUp', 'it-software', 'Dhaka (Mohakhali DOHS)', 'Full-time', 'BDT 70,000 – 110,000', 3, days(6),
        'ShopUp, Bangladesh\u2019s largest B2B commerce platform, is hiring frontend developers to build merchant-facing products used by 200,000+ retailers daily.',
        '3+ years of React experience, strong CSS skills, REST/GraphQL integration experience, familiarity with testing (Jest/RTL). Startup mindset.',
        'Apply at jobs.shopup.com with CV and GitHub profile link.'],
      ['Probationary Officer', 'Dutch-Bangla Bank PLC', 'banking', 'Anywhere in Bangladesh', 'Full-time', 'BDT 55,000 – 65,000 (during probation)', 200, days(21),
        'DBB recruits Probationary Officers through a written test and viva. Successful candidates undergo a one-year probation including classroom training and branch postings.',
        'Bachelor\u2019s/Master\u2019s degree in any discipline with minimum CGPA 3.00 or first class. Age not over 30 years. Computer literacy preferred.',
        'Apply online at career.dutchbanglabank.com. Application fee BDT 500. Written test likely in Dhaka, Chattogram and Rangpur centers.'],
      ['Assistant Teacher (Mathematics)', 'Ministry of Education (DPE)', 'teaching', 'Sylhet', 'Full-time', 'National pay scale Grade 11', 45, days(15),
        'Government primary schools under Sylhet division recruit Assistant Teachers for Mathematics. Posting anywhere within the division.',
        'Bachelor\u2019s degree with B.Ed. required. Age 18\u201335 years (up to 40 for government employees). Must pass NTRCA 14th cycle for relevant subject.',
        'Apply through DPE teletalk portal (dpe.teletalk.com.bd) with NTRCA certificate number.'],
      ['Medical Officer', 'Bangladesh Railway', 'government', 'Rajshahi', 'Full-time', 'BDT 22,000 – 53,060 (Grade 3)', 18, days(25),
        'Bangladesh Railway (East Zone) recruits Medical Officers for railway hospitals and health units to serve railway employees and their families.',
        'MBBS from a recognized university with BMDC registration. One year internship completed. Age up to 32 years.',
        'Fill BPSC Form-1 online and send hard copy with documents to Chairman, BPSC, Agrabad, Chattogram within the deadline.'],
      ['Life Insurance Sales Executive', 'MetLife Bangladesh', 'insurance', 'Dhaka / Nationwide', 'Full-time', 'Commission + allowance (avg BDT 40,000/mo)', 30, days(8),
        'MetLife, the #1 life insurer in Bangladesh, is expanding its agency force. Full training provided; top performers get fast-track promotion to Unit Manager.',
        'HSC or above, age 21\u201345, good communication skills in Bangla/English. Fresh graduates encouraged. Own transport is a plus.',
        'Walk-in interview at MetLife head office, Gulshan Avenue, Dhaka, Sun\u2013Thu 10am\u20134pm, or send CV to agencybd@metlife.com.bd.'],
      ['Program Officer \u2013 M&E', 'BRAC', 'ngo-development', 'Dhaka (BRAC Centre)', 'Full-time', 'BDT 58,000 – 72,000', 2, days(10),
        'BRAC\u2019s monitoring, evaluation and research department seeks a Program Officer to support evidence generation across education and youth employment programs.',
        'Master\u2019s in Statistics/Economics/Development Studies. 3+ years in M&E, proficiency in Excel/SPSS/Stata and strong report writing in English.',
        'Apply online at careers.brac.net. Only shortlisted candidates will be contacted.'],
      ['Executive (HR & Admin)', 'Walton Group', 'private-company', 'Dhaka (Corporate Office)', 'Full-time', 'BDT 35,000 – 45,000', 6, days(7),
        'Walton, the leading electronics manufacturer of Bangladesh, hires HR & Admin Executives for its corporate office to handle recruitment, compliance and employee services.',
        'BBA/MBA in HRM or Bachelor\u2019s in any discipline with 1\u20132 years HR experience. Age up to 32. Strong MS Office skills.',
        'Send CV to hrd@waltonbd.com with position name in subject line, or apply via waltonbd.com/careers.'],
      ['Staff Nurse', 'Dhaka Medical College Hospital', 'health', 'Dhaka', 'Full-time', 'BDT 16,000 – 38,640 (Grade 10)', 150, days(14),
        'DMCH, the largest tertiary hospital of Bangladesh, recruits Staff Nurses for ICU, surgery, medicine and emergency departments on government pay scale.',
        'Diploma in Nursing Science & Midwifery or BSc in Nursing from a recognized institute with BNMC registration. Age 18\u201332.',
        'Apply via dmc.gov.bd online form; bring original certificates at viva. Shift-based duty required.'],
      ['Junior Technician (Electrical)', 'BERC Enroute', 'private-company', 'Narayanganj', 'Full-time', 'BDT 20,000 – 28,000', 10, days(5),
        'Manufacturing plant near Jalkuri, Narayanganj requires junior electrical technicians for production line maintenance (day shift, 6 days/week).',
        'SSC + trade course (electrical) or diploma. 1+ year factory experience preferred but freshers with technical training may apply.',
        'Direct walk-in with CV and original certificates at the factory gate office, Enroute Industrial Park, Jalkuri, Narayanganj \u2014 any working day 9am\u20135pm.'],
      ['Lecturer (English)', 'City University', 'teaching', 'Dhaka (Uttara Campus)', 'Full-time', 'BDT 45,000 – 60,000', 2, days(11),
        'City University\u2019s Department of English invites applications for Lecturer positions at its Uttara campus for the Spring 2027 semester.',
        'Master\u2019s in English (Literature/Applied Linguistics/ELT) with CGPA 3.50+ or strong academic record. Prior university teaching preferred.',
        'Email CV, transcripts and a cover letter to hr@cityuniversity.edu.bd by the deadline.'],
      ['Data Entry Operator', 'Election Commission', 'government', 'Dhaka (Election Bhaban)', 'Contract (2 yrs)', 'BDT 18,500/month (consolidated)', 40, days(4),
        'The Election Commission Secretariat hires Data Entry Operators on a 2-year contract (renewable) for voter roll updation and results processing.',
        'HSC pass with computer course certificate. Typing speed: Bangla 25 wpm / English 30 wpm. Age 18\u201330.',
        'Apply through eco.teletalk.com.bd. Practical typing test will be held after preliminary screening.'],
      ['Relationship Manager \u2013 SME', 'The City Bank PLC', 'banking', 'Dhaka / Chattogram', 'Full-time', 'BDT 60,000 – 85,000 + performance bonus', 12, days(16),
        'City Bank SME division seeks relationship managers to grow the SME portfolio: credit assessment, portfolio monitoring and client acquisition.',
        'MBA/BBA in Finance/Marketing. 3+ years in bank SME/trade finance. Strong client-facing skills; motorbike license preferred.',
        'Apply at career.citybankplc.com. Shortlisted candidates get a case-study interview within 2 weeks of application.'],
    ];
    const insJob = db.prepare(`INSERT INTO jobs
      (title, company, categoryId, location, jobType, salary, vacancies, deadline, description, requirements, howToApply, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const featuredSet = new Set(['Assistant Director (General Side)', 'Senior Software Engineer (Backend)', 'Probationary Officer', 'Program Officer \u2013 M&E']);
    for (const j of jobs) {
      const [title, company, cat, location, jobType, salary, vacancies, deadline, desc, req, how] = j;
      insJob.run(title, company, catIds[cat], location, jobType, salary, vacancies, deadline, desc, req, how, featuredSet.has(title) ? 1 : 0);
    }

    // ---- News ----
    const news = [
      ['36th BCS Preliminary Test Scheduled for January \u2014 312,000 Candidates to Sit', 'Exam', 'JobNews Desk', days(-1),
        'The Public Service Commission has published the seating plan for the 36th BCS preliminary examination, with tests to be held simultaneously in Dhaka, Chattogram, Rajshahi and Khulna.',
        `The Bangladesh Public Service Commission (BPSC) has finalized arrangements for the 36th BCS preliminary examination, scheduled for the first week of January. A record 312,000 eligible candidates will sit for the 200-mark MCQ test across four divisions.

According to the official notification, admission slips will be downloadable from the BPSC teletalk portal ten days before the exam. Candidates must bring a printed slip along with their registration card; electronic devices, including smart watches, are strictly prohibited inside examination halls.

This year\u2019s preliminary test carries negative marking of 0.25 for each wrong answer \u2014 a rule reinstated after a decade. Analysts expect the cut-off to hover between 105 and 115 depending on paper difficulty.

Successful candidates will face the written examination approximately four months later, followed by a viva voce for those who clear the written stage. The commission has urged candidates to check the seating plan twice \u2014 hall and room allocation changed for nearly 40,000 candidates compared to the last cycle.`, 'exam', 'grad-1'],
      ['Bangladesh Bank Opens 120 Assistant Director Posts After Two-Year Gap', 'Government', 'JobNews Desk', days(-2),
        'The central bank\u2019s largest recruitment drive in two years opens today, with online applications running for three weeks.',
        `Bangladesh Bank has published a circular for 120 Assistant Director (General Side) positions, its biggest recruitment since 2024. The online application window opens today and runs for three weeks through the bank\u2019s e-recruitment portal.

Eligible candidates need a master\u2019s degree or a four-year bachelor\u2019s degree with at least two first divisions in their academic history. The age limit is 30 years, relaxable to 32 for freedom fighter quotas.

The selection process comprises a 200-mark preliminary MCQ covering Bangla, English, mathematics and general knowledge, followed by a written test and viva. Last cycle, 96,000 candidates competed for 80 posts \u2014 an acceptance rate below 0.1 percent.

Bank officials say successful appointees will start at Grade 3 of the national pay scale (BDT 22,000 basic) plus the central bank\u2019s allowances, typically pushing first-month gross pay above BDT 40,000.`, 'government', 'grad-2'],
      ['IT Sector Hiring Jumps 34% as 40+ Firms Announce Expansion Plans', 'Industry', 'JobNews Desk', days(-3),
        'Bangladesh\u2019s software and IT-enabled services sector is on track for its strongest hiring year, driven by export growth and new BPO entrants.',
        `Bangladesh\u2019s technology sector is heading into 2027 with its strongest hiring momentum on record. A survey of 40 software firms, BPO operators and fintech startups shows combined recruitment plans up 34 percent year-on-year, with backend engineering, DevOps and data analytics roles in highest demand.

Export figures support the trend: IT-enabled services earnings crossed $1.9 billion in the last fiscal year, and industry bodies expect the new government incentive scheme \u2014 10 percent cash support on export receipts \u2014 to push hiring further.

For job seekers, the practical takeaway is skills-first hiring. Companies report dropping degree requirements for engineering roles in favor of coding assessments and portfolio reviews. Mid-level salaries (3\u20135 years experience) now commonly range between BDT 70,000 and 120,000 in Dhaka, with remote roles for foreign clients paying up to double.

Recruiters advise candidates to keep a public GitHub profile and prepare for system-design interviews, which now appear in nearly all senior developer hiring loops.`, 'industry', 'grad-3'],
      ['NTRCA Opens 15th Cycle Registration for 68,000 Teaching Posts', 'Teaching', 'JobNews Desk', days(-4),
        'Registration for the 15th Non-Government Teachers\u2019 Registration & Certification Authority cycle opens this month for all subject categories.',
        `The Non-Government Teachers\u2019 Registration & Certification Authority (NTRCA) has opened registration for its 15th cycle, covering approximately 68,000 expected vacancies across schools, colleges and madrasas.

Candidates can register through the NTRCA teletalk portal with a BDT 350 fee. New this cycle: subject-specific syllabi have been published in advance, and the authority has pledged to complete the entire process \u2014 preliminary, written and viva \u2014 within twelve months.

Education ministry officials note that e-recruitment matching (where registered candidates are recommended to vacant institutions) will begin immediately after results. In the 14th cycle, 92 percent of successful candidates received institution recommendations within six months.

Applicants should verify their academic records carefully \u2014 mismatched certificate information remains the top reason for recommendation cancellations.`, 'teaching', 'grad-4'],
      ['Minimum Wage Board Sets New Garment Sector Wage Effective Next Month', 'Economy', 'JobNews Desk', days(-5),
        'The new wage structure raises entry-level garment worker pay by 12.5 percent, with factories required to pay arrears from next month.',
        `The Minimum Wage Board has announced the new wage structure for the readymade garment sector, effective from the first day of next month. Entry-level workers will receive a monthly basic of BDT 14,200, up 12.5 percent from the previous structure, with grade-based increments up to BDT 19,800 for grade-7 workers.

Factory owners\u2019 associations welcomed the phased timeline but urged utility subsidies to offset compliance costs, while worker representatives called the increase \u201ca step forward\u201d though below living-wage estimates.

For job seekers in the sector, the practical change: recruitment advertisements must now state wages explicitly, and factories with open posts \u2014 estimated at 60,000 nationwide \u2014 are expected to intensify hiring ahead of the spring export season.`, 'economy', 'grad-5'],
      ['How to Write a CV That Passes ATS Screening in Bangladesh\u2019s Job Market', 'Career Tips', 'JobNews Desk', days(-6),
        'Four out of five large employers now screen CVs with software before a human reads them. Here is how to structure yours to survive the filter.',
        `Applicant Tracking Systems (ATS) now sit in front of nearly every corporate recruiter in Bangladesh. Major banks, telecom operators, RMG groups and multinationals automatically parse and score incoming CVs \u2014 and poorly formatted files are rejected before a human ever sees them.

What actually matters, based on interviews with HR managers:

1. **Use a single-column layout.** Tables, text boxes and sidebars confuse parsers. Plain headings (\u201cWork Experience\u201d, \u201cEducation\u201d) beat creative section names.

2. **Mirror the circular\u2019s language.** If the job circular says \u201cledger management\u201d, your CV should contain that exact phrase \u2014 ATS matching is literal.

3. **Dates and titles in standard formats.** \u201cJan 2023 \u2013 Mar 2025\u201d parses cleanly; \u201c\u201923 to \u201925\u201d does not.

4. **PDF, not image.** Scanned CVs are unreadable to software. Export a text-based PDF from Word.

5. **One page per 5 years of experience.** Entry-level candidates should fit on a single page.

Finally, tailor for each application. Recruiters can tell a mass-blast CV instantly, and ATS scoring will bury a generic one anyway.`, 'career-tips', 'grad-6'],
    ];
    const insNews = db.prepare(`INSERT INTO news (title, category, author, publishedAt, excerpt, content, emoji, gradient)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    const emojiMap = { exam: 'graduation-cap', government: 'landmark', industry: 'chart-line', teaching: 'book-open', economy: 'coins', 'career-tips': 'lightbulb' };
    for (const n of news) {
      const [title, category, author, publishedAt, excerpt, content, emoji, gradient] = n;
      insNews.run(title, category, author, publishedAt, excerpt, content, emojiMap[emoji] || 'newspaper', gradient);
    }

    // ---- Admin ----
    const { salt, hash } = hashPassword('admin123');
    db.prepare('INSERT INTO admin_users (username, passwordHash, salt) VALUES (?, ?, ?)').run('admin', hash, salt);

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
