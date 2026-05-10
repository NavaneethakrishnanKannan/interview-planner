import type { Edge, Node } from "reactflow";

export type SelfCheck = {
  id: string;
  question: string;
  answer: string;
};

export type HldBlock = {
  title: string;
  bullets: string[];
};

export type LldApi = {
  method: string;
  path: string;
  purpose: string;
};

export type LldEntity = {
  name: string;
  fields: string[];
};

export type SystemDesignTopic = {
  id: string;
  label: string;
  blurb: string;
  nodes: Node[];
  edges: Edge[];
  /** What to agree on before drawing boxes (scope, scale, SLOs). */
  clarifications: string[];
  /** Ordered flow: how a real round often progresses. */
  interviewFlow: string[];
  /** Topics the interviewer may push on after your HLD. */
  commonDeepDives: string[];
  hld: {
    summary: string;
    blocks: HldBlock[];
  };
  lld: {
    summary: string;
    apis: LldApi[];
    entities: LldEntity[];
    /** Narrative steps for one critical path (happy path). */
    happyPath: string[];
  };
  selfChecks: SelfCheck[];
};

export const SYSTEM_DESIGN_TOPICS: SystemDesignTopic[] = [
  {
    id: "web-app",
    label: "Typical web app",
    blurb: "CDN, gateway, a core service, cache, and primary database — a common production baseline.",
    clarifications: [
      "Who are the users and what is the core user journey (read-heavy vs write-heavy)?",
      "Expected QPS, peak vs steady, and geographic spread (single region vs global)?",
      "Consistency needs: can reads be eventually consistent? Any strong transactional workflows?",
      "Auth model: sessions, JWT, third-party IdP? Compliance (PII, retention)?",
    ],
    interviewFlow: [
      "Clarify requirements and back-of-envelope scale (1–2 minutes).",
      "Draw HLD: client → edge → gateway → services → cache → DB; call out sync vs async boundaries.",
      "Walk one read path and one write path; mention failure modes (cache miss, DB down).",
      "Deep dive: pick caching, auth/session storage, or DB scaling based on interviewer.",
      "Summarize trade-offs and what you would load-test or monitor first.",
    ],
    commonDeepDives: [
      "CDN vs origin responsibilities; cache invalidation strategies.",
      "API gateway: rate limits, mTLS, WAF, canary routing.",
      "Redis: eviction, TTL, cache stampede, session fixation risks.",
      "DB: read replicas, connection pooling, migrations without downtime.",
    ],
    hld: {
      summary:
        "High-level design (HLD) is the 10k-foot map: major subsystems, trust boundaries, and direction of data flow. Here the browser reaches static content via a CDN and dynamic APIs via a gateway to stateless application servers, with a cache for hot reads and a relational database as the system of record.",
      blocks: [
        {
          title: "Traffic path",
          bullets: [
            "Clients resolve DNS to CDN PoPs for static assets; API calls hit your edge (LB/API gateway) then app tier.",
            "TLS terminates at edge or gateway; keep certificates and cipher policy consistent.",
          ],
        },
        {
          title: "Stateless application tier",
          bullets: [
            "Horizontally scaled instances behind the gateway; no local disk session state.",
            "Configuration and secrets from env/secret store; feature flags for safe rollout.",
          ],
        },
        {
          title: "Caching layer",
          bullets: [
            "Redis (or Memcached) for sessions, rate-limit counters, or hot entity reads.",
            "Define TTLs and invalidation; avoid caching personalized data without a keying strategy.",
          ],
        },
        {
          title: "Data store",
          bullets: [
            "PostgreSQL (or similar) for durable, relational data; backups and PITR for recovery.",
            "Scale reads with replicas; scale writes with sharding/partitioning only when metrics justify it.",
          ],
        },
      ],
    },
    lld: {
      summary:
        "Low-level design (LLD) names concrete interfaces, schemas, and step-by-step behavior for critical paths. You are not expected to memorize every field—show you can evolve a schema and justify consistency choices.",
      apis: [
        { method: "POST", path: "/v1/sessions", purpose: "Login; returns httpOnly session cookie or token contract." },
        { method: "GET", path: "/v1/me", purpose: "Current user profile; cache-control private." },
        { method: "GET", path: "/v1/resources/:id", purpose: "Fetch resource; ETag for conditional GET." },
        { method: "POST", path: "/v1/resources", purpose: "Create resource; idempotent key header optional." },
      ],
      entities: [
        {
          name: "User",
          fields: ["id (uuid)", "email (unique)", "password_hash / sso_subject", "created_at"],
        },
        {
          name: "Session",
          fields: ["session_id", "user_id (FK)", "expires_at", "user_agent_hash"],
        },
        {
          name: "Resource",
          fields: ["id", "owner_user_id", "body_json", "updated_at", "version (optimistic concurrency)"],
        },
      ],
      happyPath: [
        "Client sends POST /v1/sessions with credentials; gateway enforces TLS and rate limit.",
        "Auth service validates user, writes Session row, returns Set-Cookie (httpOnly, Secure, SameSite).",
        "Subsequent GET /v1/resources/:id includes cookie; gateway forwards; app resolves session → user.",
        "App checks Redis for denormalized resource cache; on miss loads from PostgreSQL, populates cache with TTL.",
        "Response returns JSON + Cache-Control: private; client renders.",
      ],
    },
    nodes: [
      { id: "client", position: { x: 0, y: 120 }, data: { label: "Client" } },
      { id: "cdn", position: { x: 220, y: 120 }, data: { label: "CDN" } },
      { id: "gateway", position: { x: 440, y: 120 }, data: { label: "API Gateway" } },
      { id: "service", position: { x: 680, y: 120 }, data: { label: "Auth / app service" } },
      { id: "redis", position: { x: 680, y: 280 }, data: { label: "Redis (cache)" } },
      { id: "db", position: { x: 920, y: 120 }, data: { label: "PostgreSQL" } },
    ],
    edges: [
      { id: "e1", source: "client", target: "cdn" },
      { id: "e2", source: "cdn", target: "gateway" },
      { id: "e3", source: "gateway", target: "service" },
      { id: "e4", source: "service", target: "db" },
      { id: "e5", source: "service", target: "redis" },
    ],
    selfChecks: [
      {
        id: "w1",
        question: "Why place a CDN in front of your origin?",
        answer:
          "Caches static assets closer to users, cuts latency and origin load, and often handles TLS and DDoS mitigation at the edge.",
      },
      {
        id: "w2",
        question: "What is Redis doing here, and when might you skip it at first?",
        answer:
          "Redis usually holds hot reads, sessions, or rate-limit counters. Early on you might rely on the DB only, then add Redis when read patterns or session scale demand it.",
      },
      {
        id: "w3",
        question: "What does the API gateway own vs the service behind it?",
        answer:
          "The gateway typically handles routing, authn tokens, throttling, and cross-cutting concerns; business logic stays in services.",
      },
    ],
  },
  {
    id: "whatsapp",
    label: "Chat (WhatsApp-style)",
    blurb: "High-volume messaging: gateways, chat path, queueing, presence, storage, and push.",
    clarifications: [
      "1:1 vs groups vs channels; max group size and message size (text vs media)?",
      "Delivery guarantees: at-least-once acceptable with idempotent clients? Need strict ordering per chat?",
      "Online presence accuracy vs battery (how fresh must “last seen” be)?",
      "Regulatory: E2E encryption in scope for this exercise or trust the server?",
      "Scale hint: messages/day, concurrent connections, media percentage of traffic?",
    ],
    interviewFlow: [
      "Narrow scope: assume server-routed messaging (E2E optional), strong per-chat ordering, mobile + web clients.",
      "HLD: clients maintain WS/long-poll to edge; chat service persists and fans out; queue absorbs spikes; media off hot path.",
      "Explain offline delivery: durable log, ack from client, push notification when backgrounded.",
      "LLD sketch: message ID scheme, inbox/outbox tables or log, read receipts.",
      "Deep dive: ordering (sequence per chat), hot partitions (celebrity groups), and media upload pre-signed URLs.",
    ],
    commonDeepDives: [
      "Per-chat sequence vs vector clocks; handling duplicate delivery.",
      "Fan-out write path vs fan-out read path for large groups.",
      "Presence: heartbeat cost, graceful degradation on flaky networks.",
      "Media: chunked upload, virus scan pipeline, CDN for download, retention policy.",
      "Disaster recovery: multi-region, Cassandra/Spanner vs Postgres + careful sharding.",
    ],
    hld: {
      summary:
        "HLD for WhatsApp-like chat emphasizes durable messaging over ephemeral connections. Clients talk to edge load balancers; a chat service cluster accepts sends, appends to a durable message log or database, and uses asynchronous workers + message queues for fan-out, search indexing, and push. Media bypasses the OLTP hot path via object storage. Presence is a separate concern with softer consistency.",
      blocks: [
        {
          title: "Clients and edge",
          bullets: [
            "Mobile apps maintain long-lived connections (WebSocket or MQTT-style) through regional LBs.",
            "TLS and device attestation (if required) terminate at edge; rate limit per device and per user.",
          ],
        },
        {
          title: "Chat core",
          bullets: [
            "Chat service validates sender, chat membership, and payload size; assigns monotonic sequence per chat.",
            "Writes go to durable storage (append log or sharded DB) before ACK to sender (commit point).",
          ],
        },
        {
          title: "Async pipeline",
          bullets: [
            "Queue decouples ingestion from fan-out to online devices, push notifications, and secondary indexes.",
            "Retries and dead-letter queues protect against poison messages.",
          ],
        },
        {
          title: "Media path",
          bullets: [
            "Client requests pre-signed URL; uploads directly to object storage; metadata row links chat_id + object_key.",
            "Thumbnails and transcoding via async workers; CDN for downloads.",
          ],
        },
        {
          title: "Notifications",
          bullets: [
            "When recipient offline or app backgrounded, enqueue push via FCM/APNs with collapse keys to avoid spam.",
          ],
        },
      ],
    },
    lld: {
      summary:
        "LLD makes the chat path concrete: idempotent send API, how a Message row (or log entry) looks, and how a device catches up with cursoring. Emphasize ordering keys and idempotency tokens.",
      apis: [
        { method: "POST", path: "/v1/chats/:chatId/messages", purpose: "Send text/media ref; body includes client_msg_id for dedup." },
        { method: "GET", path: "/v1/chats/:chatId/messages", purpose: "History page with before_seq cursor; limit + reverse order." },
        { method: "WS", path: "/v1/stream", purpose: "Subscribe; server pushes new messages + typing + receipts." },
        { method: "POST", path: "/v1/media/upload-url", purpose: "Returns pre-signed PUT URL + media_id pending state." },
      ],
      entities: [
        {
          name: "Message",
          fields: ["chat_id", "seq (BIGINT)", "sender_id", "type", "body or media_id", "created_at", "client_msg_id (unique per sender)"],
        },
        {
          name: "ChatMember",
          fields: ["chat_id", "user_id", "last_read_seq", "muted_until"],
        },
        {
          name: "Device",
          fields: ["user_id", "device_id", "push_token", "last_seen_at"],
        },
      ],
      happyPath: [
        "Client opens WS; server attaches connection to user_id and subscribed chat channels.",
        "Client POST send with client_msg_id; chat service checks membership, allocates next seq in transaction.",
        "Row inserted into Message store; outbox event published to queue for fan-out workers.",
        "Online recipients receive push on WS; offline recipients get FCM with seq hint.",
        "Recipient ACK updates last_read_seq; sender sees delivered/read via separate receipt events.",
      ],
    },
    nodes: [
      { id: "client", position: { x: 0, y: 200 }, data: { label: "Mobile / web client" } },
      { id: "lb", position: { x: 200, y: 200 }, data: { label: "Load balancer" } },
      { id: "chat", position: { x: 420, y: 200 }, data: { label: "Chat service" } },
      { id: "presence", position: { x: 420, y: 360 }, data: { label: "Presence / sessions" } },
      { id: "queue", position: { x: 640, y: 80 }, data: { label: "Message queue" } },
      { id: "media", position: { x: 640, y: 200 }, data: { label: "Object storage (media)" } },
      { id: "db", position: { x: 640, y: 320 }, data: { label: "Metadata DB" } },
      { id: "push", position: { x: 860, y: 200 }, data: { label: "Push / notification" } },
    ],
    edges: [
      { id: "m1", source: "client", target: "lb" },
      { id: "m2", source: "lb", target: "chat" },
      { id: "m3", source: "chat", target: "presence" },
      { id: "m4", source: "chat", target: "queue" },
      { id: "m5", source: "chat", target: "media" },
      { id: "m6", source: "chat", target: "db" },
      { id: "m7", source: "chat", target: "push" },
    ],
    selfChecks: [
      {
        id: "q1",
        question: "Recipient is offline — how does a message still get delivered?",
        answer:
          "Persist the message (DB or log), acknowledge to sender, then deliver on reconnect or via push notification; ordering is often per-chat sequence numbers.",
      },
      {
        id: "q2",
        question: "Why a message queue between services?",
        answer:
          "Decouples producers from consumers, smooths spikes, retries failed work, and lets you scale readers independently (e.g. search indexing, analytics).",
      },
      {
        id: "q3",
        question: "Where do large photos or voice notes live?",
        answer:
          "Object storage (S3-like) with the DB storing pointers, checksums, and ACL metadata — not the blob itself.",
      },
    ],
  },
  {
    id: "chess",
    label: "Multiplayer chess",
    blurb: "Matchmaking, authoritative game state, real-time updates, and durable user/rating data.",
    clarifications: [
      "Real-time only or also async correspondence games?",
      "Rating system (Elo/Glicko) in scope? Leaderboards global or regional?",
      "Disconnect policy: pause clock, forfeit timer, reconnect grace period?",
      "Anti-cheat scope: server validation only or client integrity checks?",
      "Peak concurrent games and matchmaking latency target?",
    ],
    interviewFlow: [
      "Clarify game modes and fairness rules (clock, disconnect).",
      "HLD: WS gateway → game service (authoritative) + matchmaking; hot state in memory/Redis; durable user stats in SQL.",
      "Walk move submission: validate, apply, broadcast, persist snapshot or event log.",
      "LLD: Move DTO, game state representation, checkmate/stalemate detection location (server).",
      "Deep dive: matchmaking buckets, sharding games by game_id, replay from event log.",
    ],
    commonDeepDives: [
      "Why server authoritative state beats optimistic client moves.",
      "Redis failover during active game: RTO/RPO vs sticky sessions.",
      "Matchmaking data structures: queues per rating band; avoiding starvation.",
      "Cheat detection: move timing analysis, engine correlation (out of scope for basic HLD).",
    ],
    hld: {
      summary:
        "HLD for multiplayer chess separates finding an opponent (matchmaking) from playing the game (game server). Clients use WebSockets through a gateway to a stateful or co-located game service that owns the board. Low-latency state lives in Redis or in-memory with replication; long-lived user and rating data lives in PostgreSQL.",
      blocks: [
        {
          title: "Connection layer",
          bullets: [
            "WebSocket gateway handles TLS, authentication, and routes connection to correct game shard or node.",
            "Backpressure and heartbeat detect half-open connections; reconnect resumes with game_id + session token.",
          ],
        },
        {
          title: "Matchmaking service",
          bullets: [
            "Players enqueue with rating + preferences; worker pairs compatible opponents and creates Game record.",
            "Emits event to game service to spawn session; notifies clients with game room id.",
          ],
        },
        {
          title: "Game service (authoritative)",
          bullets: [
            "Accepts Move commands; validates legality against server board; rejects illegal moves.",
            "Broadcasts StateDelta or full FEN to both players; updates clock server-side.",
          ],
        },
        {
          title: "Hot vs cold storage",
          bullets: [
            "Active games: Redis or partitioned memory for fast read-modify-write.",
            "Completed games and ratings: durable SQL with transactional rating updates.",
          ],
        },
      ],
    },
    lld: {
      summary:
        "LLD specifies the move API, how board state is stored (FEN + move list vs full event sourcing), and termination detection. Keep validation pure and testable on the server.",
      apis: [
        { method: "POST", path: "/v1/matchmaking/join", purpose: "Enter queue; returns ticket_id + ETA hint." },
        { method: "WS", path: "/v1/games/:gameId", purpose: "Gameplay channel; frames: Move, StateSync, GameOver." },
        { method: "POST", path: "/v1/games/:gameId/moves", purpose: "REST fallback move; same validation as WS path." },
        { method: "GET", path: "/v1/games/:gameId", purpose: "Spectator or reconnect fetch; includes clock state." },
      ],
      entities: [
        {
          name: "Game",
          fields: ["game_id", "white_user_id", "black_user_id", "status", "clock_ms_white", "clock_ms_black", "current_fen", "move_count"],
        },
        {
          name: "Move",
          fields: ["game_id", "ply", "from_sq", "to_sq", "promotion", "applied_at", "player_id"],
        },
        {
          name: "UserRating",
          fields: ["user_id", "rating", "games_played", "updated_at"],
        },
      ],
      happyPath: [
        "Client joins matchmaking; service pairs players and creates Game row + initial FEN.",
        "Both clients open WS; server sends full state + clock sync.",
        "Player submits move; server validates turn + legality; updates board; increments ply.",
        "Opponent receives StateSync; if checkmate/stalemate, server sets status and persists outcome.",
        "Rating worker updates UserRating in transaction; clients receive GameOver payload.",
      ],
    },
    nodes: [
      { id: "client", position: { x: 0, y: 180 }, data: { label: "Client" } },
      { id: "ws", position: { x: 220, y: 180 }, data: { label: "WebSocket gateway" } },
      { id: "match", position: { x: 440, y: 60 }, data: { label: "Matchmaking" } },
      { id: "game", position: { x: 440, y: 220 }, data: { label: "Game server" } },
      { id: "redis", position: { x: 680, y: 220 }, data: { label: "Redis (live game state)" } },
      { id: "db", position: { x: 680, y: 60 }, data: { label: "PostgreSQL (users, ratings)" } },
    ],
    edges: [
      { id: "c1", source: "client", target: "ws" },
      { id: "c2", source: "ws", target: "game" },
      { id: "c3", source: "ws", target: "match" },
      { id: "c4", source: "match", target: "db" },
      { id: "c5", source: "game", target: "redis" },
      { id: "c6", source: "game", target: "db" },
    ],
    selfChecks: [
      {
        id: "ch1",
        question: "How do you stop clients from cheating on illegal moves?",
        answer:
          "Treat the server as authoritative: validate every move against server-held rules and state; clients only suggest moves.",
      },
      {
        id: "ch2",
        question: "Redis vs PostgreSQL for an in-progress game — why both?",
        answer:
          "Redis (or memory + replication) gives low-latency reads/writes for active boards; PostgreSQL stores accounts, history, and ratings durably.",
      },
      {
        id: "ch3",
        question: "Two players disconnect mid-game — what happens?",
        answer:
          "Timeouts, reconnect tokens, and persisted state let them resume; you may forfeit after policy thresholds to avoid stuck games.",
      },
    ],
  },
];

export const DEFAULT_TOPIC_ID = SYSTEM_DESIGN_TOPICS[0]!.id;

export function getTopicById(id: string): SystemDesignTopic | undefined {
  return SYSTEM_DESIGN_TOPICS.find((t) => t.id === id);
}
