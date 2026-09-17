/**
 * Canonical spellings for technology names.
 *
 * The key is a normalised form of what people type (lowercase, punctuation and
 * spaces removed); the value is how the industry writes it. We only ever
 * *offer* these corrections — the user decides.
 */
const CANONICAL: Record<string, string> = {
  // Languages
  javascript: "JavaScript",
  js: "JavaScript",
  typescript: "TypeScript",
  ts: "TypeScript",
  python: "Python",
  java: "Java",
  kotlin: "Kotlin",
  swift: "Swift",
  objectivec: "Objective-C",
  csharp: "C#",
  c: "C",
  cpp: "C++",
  golang: "Go",
  go: "Go",
  rust: "Rust",
  ruby: "Ruby",
  php: "PHP",
  scala: "Scala",
  dart: "Dart",
  elixir: "Elixir",
  perl: "Perl",
  r: "R",
  matlab: "MATLAB",
  sql: "SQL",
  plsql: "PL/SQL",
  bash: "Bash",
  shell: "Shell",
  powershell: "PowerShell",
  html: "HTML",
  html5: "HTML5",
  css: "CSS",
  css3: "CSS3",
  scss: "SCSS",
  sass: "Sass",
  less: "Less",
  graphql: "GraphQL",
  json: "JSON",
  yaml: "YAML",
  xml: "XML",

  // Frontend
  react: "React",
  reactjs: "React",
  reactnative: "React Native",
  nextjs: "Next.js",
  next: "Next.js",
  vue: "Vue",
  vuejs: "Vue",
  nuxt: "Nuxt",
  nuxtjs: "Nuxt",
  angular: "Angular",
  angularjs: "AngularJS",
  svelte: "Svelte",
  sveltekit: "SvelteKit",
  jquery: "jQuery",
  redux: "Redux",
  reduxtoolkit: "Redux Toolkit",
  mobx: "MobX",
  zustand: "Zustand",
  tailwind: "Tailwind CSS",
  tailwindcss: "Tailwind CSS",
  bootstrap: "Bootstrap",
  materialui: "Material UI",
  mui: "MUI",
  chakraui: "Chakra UI",
  shadcnui: "shadcn/ui",
  webpack: "Webpack",
  vite: "Vite",
  babel: "Babel",
  eslint: "ESLint",
  storybook: "Storybook",
  expo: "Expo",
  flutter: "Flutter",
  ionic: "Ionic",
  reanimated: "Reanimated",
  reactnavigation: "React Navigation",
  reactquery: "React Query",
  tanstackquery: "TanStack Query",
  threejs: "Three.js",
  d3: "D3.js",
  d3js: "D3.js",

  // Backend / runtime
  nodejs: "Node.js",
  node: "Node.js",
  deno: "Deno",
  bun: "Bun",
  express: "Express",
  expressjs: "Express",
  nestjs: "NestJS",
  fastify: "Fastify",
  django: "Django",
  flask: "Flask",
  fastapi: "FastAPI",
  rails: "Ruby on Rails",
  rubyonrails: "Ruby on Rails",
  laravel: "Laravel",
  symfony: "Symfony",
  spring: "Spring",
  springboot: "Spring Boot",
  dotnet: ".NET",
  aspnet: "ASP.NET",
  aspnetcore: "ASP.NET Core",
  grpc: "gRPC",
  rest: "REST",
  restapi: "REST APIs",
  restfulapi: "REST APIs",
  websocket: "WebSocket",
  websockets: "WebSockets",
  socketio: "Socket.IO",

  // Data
  postgresql: "PostgreSQL",
  postgres: "PostgreSQL",
  mysql: "MySQL",
  mariadb: "MariaDB",
  sqlite: "SQLite",
  mongodb: "MongoDB",
  mongo: "MongoDB",
  redis: "Redis",
  elasticsearch: "Elasticsearch",
  dynamodb: "DynamoDB",
  cassandra: "Cassandra",
  neo4j: "Neo4j",
  firebase: "Firebase",
  firestore: "Firestore",
  supabase: "Supabase",
  prisma: "Prisma",
  sequelize: "Sequelize",
  typeorm: "TypeORM",
  mongoose: "Mongoose",
  kafka: "Apache Kafka",
  rabbitmq: "RabbitMQ",
  spark: "Apache Spark",
  hadoop: "Hadoop",
  airflow: "Apache Airflow",
  snowflake: "Snowflake",
  databricks: "Databricks",
  bigquery: "BigQuery",
  tableau: "Tableau",
  powerbi: "Power BI",
  pandas: "pandas",
  numpy: "NumPy",
  scikitlearn: "scikit-learn",
  sklearn: "scikit-learn",
  tensorflow: "TensorFlow",
  pytorch: "PyTorch",
  keras: "Keras",
  opencv: "OpenCV",

  // Cloud / infra
  aws: "AWS",
  amazonwebservices: "AWS",
  gcp: "Google Cloud",
  googlecloud: "Google Cloud",
  azure: "Azure",
  microsoftazure: "Microsoft Azure",
  docker: "Docker",
  kubernetes: "Kubernetes",
  k8s: "Kubernetes",
  terraform: "Terraform",
  ansible: "Ansible",
  jenkins: "Jenkins",
  githubactions: "GitHub Actions",
  gitlabci: "GitLab CI",
  circleci: "CircleCI",
  nginx: "NGINX",
  apache: "Apache",
  linux: "Linux",
  ubuntu: "Ubuntu",
  vercel: "Vercel",
  netlify: "Netlify",
  heroku: "Heroku",
  cloudflare: "Cloudflare",
  lambda: "AWS Lambda",
  ec2: "EC2",
  s3: "S3",

  // Tooling / platforms
  git: "Git",
  github: "GitHub",
  gitlab: "GitLab",
  bitbucket: "Bitbucket",
  jira: "Jira",
  confluence: "Confluence",
  figma: "Figma",
  sketch: "Sketch",
  adobexd: "Adobe XD",
  photoshop: "Photoshop",
  illustrator: "Illustrator",
  aftereffects: "After Effects",
  premierepro: "Premiere Pro",
  indesign: "InDesign",
  invision: "InVision",
  notion: "Notion",
  slack: "Slack",
  linkedin: "LinkedIn",
  postman: "Postman",
  swagger: "Swagger",
  jest: "Jest",
  vitest: "Vitest",
  cypress: "Cypress",
  playwright: "Playwright",
  selenium: "Selenium",
  detox: "Detox",
  junit: "JUnit",
  pytest: "pytest",
  mocha: "Mocha",
  chai: "Chai",
  testinglibrary: "Testing Library",
  sentry: "Sentry",
  datadog: "Datadog",
  grafana: "Grafana",
  prometheus: "Prometheus",
  stripe: "Stripe",
  twilio: "Twilio",
  auth0: "Auth0",
  oauth: "OAuth",
  jwt: "JWT",
  saml: "SAML",
  webrtc: "WebRTC",
  seo: "SEO",
  cicd: "CI/CD",
  agile: "Agile",
  scrum: "Scrum",
  kanban: "Kanban",
  tdd: "TDD",
  ux: "UX",
  ui: "UI",
  uiux: "UI/UX",
  api: "API",
  apis: "APIs",
  sdk: "SDK",
  saas: "SaaS",
  mvc: "MVC",
  orm: "ORM",
  npm: "npm",
  yarn: "Yarn",
  pnpm: "pnpm",
  webassembly: "WebAssembly",
  wasm: "WebAssembly",
  pwa: "PWA",
  ssr: "SSR",
  ssg: "SSG",
  microservices: "Microservices",
  devops: "DevOps",
  mlops: "MLOps",
  llm: "LLM",
  nlp: "NLP",
  etl: "ETL",
};

/** Strips everything but letters and digits so `node js` matches `nodejs`. */
function keyFor(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9+#]/g, "");
}

/** Returns the industry-standard spelling, or the input unchanged. */
export function normalizeTechnology(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  const canonical = CANONICAL[keyFor(trimmed)];
  return canonical ?? trimmed;
}

export interface TechnologyFinding {
  original: string;
  suggestion: string;
  index: number;
}

/**
 * Scans free text for technology names written with the wrong casing or
 * spacing. Multi-word names are checked first so "react native" beats "react".
 */
const MULTI_WORD_ENTRIES = Object.entries(CANONICAL)
  .filter(([, canonical]) => /[\s.\-/]/.test(canonical))
  .sort((a, b) => b[1].length - a[1].length);

const SINGLE_WORD_ENTRIES = Object.entries(CANONICAL).filter(
  ([, canonical]) => !/[\s.\-/]/.test(canonical),
);

/** Names too ambiguous to flag inside prose. */
const AMBIGUOUS = new Set(["c", "r", "go", "less", "rust", "next", "node", "ts", "js", "ui", "ux", "api"]);

export function findTechnologyIssues(text: string): TechnologyFinding[] {
  if (!text.trim()) return [];
  const findings: TechnologyFinding[] = [];
  const claimed: Array<[number, number]> = [];

  const overlaps = (start: number, end: number) =>
    claimed.some(([from, to]) => start < to && end > from);

  const check = (phrase: string, canonical: string) => {
    // Build a pattern that tolerates the spacing/punctuation people actually use.
    const parts = canonical.split(/[\s.\-/]+/).filter(Boolean);
    const source = parts
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("[\\s.\\-/]*");
    const pattern = new RegExp(`(?<![A-Za-z0-9])(${source})(?![A-Za-z0-9])`, "gi");

    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const original = match[1];
      const start = match.index;
      const end = start + original.length;
      if (original === canonical) {
        claimed.push([start, end]);
        continue;
      }
      if (overlaps(start, end)) continue;
      claimed.push([start, end]);
      findings.push({ original, suggestion: canonical, index: start });
    }
    void phrase;
  };

  for (const [, canonical] of MULTI_WORD_ENTRIES) check(canonical, canonical);
  for (const [key, canonical] of SINGLE_WORD_ENTRIES) {
    if (AMBIGUOUS.has(key)) continue;
    check(canonical, canonical);
  }

  return findings.sort((a, b) => a.index - b.index);
}

/** Applies one technology correction to a string. */
export function applyTechnologyFix(text: string, finding: TechnologyFinding): string {
  return (
    text.slice(0, finding.index) +
    finding.suggestion +
    text.slice(finding.index + finding.original.length)
  );
}

export const TECHNOLOGY_CANONICAL = CANONICAL;
