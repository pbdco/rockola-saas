--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4 (Debian 16.4-1.pgdg120+2)
-- Dumped by pg_dump version 16.4 (Debian 16.4-1.pgdg120+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: admin
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO admin;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: admin
--

COMMENT ON SCHEMA public IS '';


--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'SUCCEEDED',
    'FAILED',
    'REFUNDED'
);


ALTER TYPE public."PaymentStatus" OWNER TO admin;

--
-- Name: RequestStatus; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."RequestStatus" AS ENUM (
    'PENDING',
    'PAID',
    'QUEUED',
    'PLAYING',
    'PLAYED',
    'SKIPPED',
    'FAILED'
);


ALTER TYPE public."RequestStatus" OWNER TO admin;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'OWNER',
    'MEMBER'
);


ALTER TYPE public."Role" OWNER TO admin;

--
-- Name: VenueMode; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."VenueMode" AS ENUM (
    'QUEUE',
    'PLAYLIST',
    'AUTOMATION'
);


ALTER TYPE public."VenueMode" OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


ALTER TABLE public."Account" OWNER TO admin;

--
-- Name: ApiKey; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."ApiKey" (
    id text NOT NULL,
    name text NOT NULL,
    "teamId" text NOT NULL,
    "hashedKey" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "lastUsedAt" timestamp(3) without time zone
);


ALTER TABLE public."ApiKey" OWNER TO admin;

--
-- Name: Invitation; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Invitation" (
    id text NOT NULL,
    "teamId" text NOT NULL,
    email text,
    role public."Role" DEFAULT 'MEMBER'::public."Role" NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL,
    "invitedBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "allowedDomains" text[] DEFAULT ARRAY[]::text[],
    "sentViaEmail" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."Invitation" OWNER TO admin;

--
-- Name: PasswordReset; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."PasswordReset" (
    id integer NOT NULL,
    email text NOT NULL,
    token text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PasswordReset" OWNER TO admin;

--
-- Name: PasswordReset_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."PasswordReset_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PasswordReset_id_seq" OWNER TO admin;

--
-- Name: PasswordReset_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."PasswordReset_id_seq" OWNED BY public."PasswordReset".id;


--
-- Name: Payment; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "songRequestId" text NOT NULL,
    "venueId" text NOT NULL,
    "providerPaymentId" text,
    amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "venueRevenue" numeric(10,2),
    "platformFee" numeric(10,2),
    "processingFee" numeric(10,2),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Payment" OWNER TO admin;

--
-- Name: Price; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Price" (
    id text NOT NULL,
    "billingScheme" text NOT NULL,
    currency text NOT NULL,
    "serviceId" text NOT NULL,
    amount integer,
    metadata jsonb NOT NULL,
    type text NOT NULL,
    created timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Price" OWNER TO admin;

--
-- Name: Service; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Service" (
    id text NOT NULL,
    description text NOT NULL,
    features text[],
    image text NOT NULL,
    name text NOT NULL,
    created timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Service" OWNER TO admin;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Session" OWNER TO admin;

--
-- Name: SongRequest; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."SongRequest" (
    id text NOT NULL,
    "venueId" text NOT NULL,
    "patronIdentifier" text,
    "spotifyTrackId" text,
    "trackName" text NOT NULL,
    "artistName" text NOT NULL,
    "albumName" text,
    "trackUri" text,
    status public."RequestStatus" DEFAULT 'PENDING'::public."RequestStatus" NOT NULL,
    price numeric(10,2),
    currency text DEFAULT 'USD'::text,
    "queuePosition" integer,
    "requestedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "queuedAt" timestamp(3) without time zone,
    "playedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SongRequest" OWNER TO admin;

--
-- Name: Subscription; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Subscription" (
    id text NOT NULL,
    "customerId" text NOT NULL,
    "priceId" text NOT NULL,
    active boolean DEFAULT false NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "cancelAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Subscription" OWNER TO admin;

--
-- Name: Team; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Team" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    domain text,
    "defaultRole" public."Role" DEFAULT 'MEMBER'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "billingId" text,
    "billingProvider" text
);


ALTER TABLE public."Team" OWNER TO admin;

--
-- Name: TeamMember; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."TeamMember" (
    id text NOT NULL,
    "teamId" text NOT NULL,
    "userId" text NOT NULL,
    role public."Role" DEFAULT 'MEMBER'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TeamMember" OWNER TO admin;

--
-- Name: User; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    password text,
    image text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    invalid_login_attempts integer DEFAULT 0 NOT NULL,
    "lockedAt" timestamp(3) without time zone
);


ALTER TABLE public."User" OWNER TO admin;

--
-- Name: Venue; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Venue" (
    id text NOT NULL,
    "teamId" text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    address text,
    mode public."VenueMode" DEFAULT 'QUEUE'::public."VenueMode" NOT NULL,
    "spotifyUserId" text,
    "spotifyAccessToken" text,
    "spotifyRefreshToken" text,
    "spotifyTokenExpiresAt" timestamp(3) without time zone,
    "pricingEnabled" boolean DEFAULT false NOT NULL,
    "pricePerSong" numeric(10,2),
    currency text DEFAULT 'USD'::text,
    "qrCodeUrl" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "n8nCredentialId" text,
    "spotifyDisplayName" text,
    "spotifyClientId" text,
    "spotifyClientSecret" text
);


ALTER TABLE public."Venue" OWNER TO admin;

--
-- Name: VerificationToken; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."VerificationToken" (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."VerificationToken" OWNER TO admin;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO admin;

--
-- Name: jackson_index; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.jackson_index (
    id integer NOT NULL,
    key character varying(1500) NOT NULL,
    "storeKey" character varying(1500) NOT NULL
);


ALTER TABLE public.jackson_index OWNER TO admin;

--
-- Name: jackson_index_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.jackson_index_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jackson_index_id_seq OWNER TO admin;

--
-- Name: jackson_index_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.jackson_index_id_seq OWNED BY public.jackson_index.id;


--
-- Name: jackson_store; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.jackson_store (
    key character varying(1500) NOT NULL,
    value text NOT NULL,
    iv character varying(64),
    tag character varying(64),
    "createdAt" timestamp(6) without time zone DEFAULT now() NOT NULL,
    "modifiedAt" timestamp(6) without time zone,
    namespace character varying(256)
);


ALTER TABLE public.jackson_store OWNER TO admin;

--
-- Name: jackson_ttl; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.jackson_ttl (
    key character varying(1500) NOT NULL,
    "expiresAt" bigint NOT NULL
);


ALTER TABLE public.jackson_ttl OWNER TO admin;

--
-- Name: PasswordReset id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."PasswordReset" ALTER COLUMN id SET DEFAULT nextval('public."PasswordReset_id_seq"'::regclass);


--
-- Name: jackson_index id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.jackson_index ALTER COLUMN id SET DEFAULT nextval('public.jackson_index_id_seq'::regclass);


--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Account" (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: ApiKey; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."ApiKey" (id, name, "teamId", "hashedKey", "createdAt", "updatedAt", "expiresAt", "lastUsedAt") FROM stdin;
d4cd6b6d-7536-4453-a351-b134217b1f25	n8n	8158c232-2316-4fa2-aab4-eec269bab774	81d845173eca404b223e8dbdb30d347166d76cca6537906f807f32f66b183017	2025-11-23 03:04:39.215	2025-11-23 03:04:39.215	\N	\N
\.


--
-- Data for Name: Invitation; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Invitation" (id, "teamId", email, role, token, expires, "invitedBy", "createdAt", "updatedAt", "allowedDomains", "sentViaEmail") FROM stdin;
c3bfc46c-6e59-4fe7-9f5d-38ad69a59202	504ef1e7-5f0a-4ad8-b06f-deaa7f948648	Elbert85@yahoo.com	MEMBER	cdbf7afc-2298-43d9-88ff-ef82f94e6ee9	2025-11-25 00:44:02.414	66a78b96-5e28-4cb7-848c-82789b43909b	2025-11-18 00:44:02.415	2025-11-18 00:44:02.415	{}	t
a9af5962-f36b-4d46-b5b6-2296bdf1f52b	504ef1e7-5f0a-4ad8-b06f-deaa7f948648	Trycia85@gmail.com	MEMBER	d5a55bce-691c-47e0-84ee-921276b02720	2025-11-25 00:44:02.418	4e32ac67-ce8d-401a-8da9-88fb08906258	2025-11-18 00:44:02.419	2025-11-18 00:44:02.419	{}	t
ee75d628-41e9-4e59-9f68-a40ffce8ff29	504ef1e7-5f0a-4ad8-b06f-deaa7f948648	Maxine_Funk-Goyette@gmail.com	MEMBER	c01ca660-4c68-4f58-8b7b-cc9102a31845	2025-11-25 00:44:02.42	767fe4a0-7637-496f-847b-b6e29ef822fc	2025-11-18 00:44:02.42	2025-11-18 00:44:02.42	{}	t
29456c4b-c976-4126-8368-b4fae6160073	504ef1e7-5f0a-4ad8-b06f-deaa7f948648	Ayana.Kling@gmail.com	MEMBER	3a618e07-38a6-44c5-89c1-147c14eed16b	2025-11-25 00:44:02.42	089479fb-ca59-4e91-a0f8-c880fb0835f0	2025-11-18 00:44:02.421	2025-11-18 00:44:02.421	{}	t
2e139fb9-7c0f-42f7-9000-3d9a27531d42	504ef1e7-5f0a-4ad8-b06f-deaa7f948648	Garrick_Kemmer12@gmail.com	MEMBER	8cb570cf-e8c2-45e0-b89f-8f2f78ffb742	2025-11-25 00:44:02.421	66a78b96-5e28-4cb7-848c-82789b43909b	2025-11-18 00:44:02.421	2025-11-18 00:44:02.421	{}	t
0d8967ab-429b-4ecc-9865-38909fb18e22	504ef1e7-5f0a-4ad8-b06f-deaa7f948648	Norris_Jacobi77@yahoo.com	MEMBER	d9c660ec-8400-4f5e-8c6b-9095d0f9f2d7	2025-11-25 00:44:02.421	85abeaad-7edc-4b4b-af13-fb066ef763cb	2025-11-18 00:44:02.422	2025-11-18 00:44:02.422	{}	t
c68466dd-8536-4071-8cc5-1d269ce2ad7a	504ef1e7-5f0a-4ad8-b06f-deaa7f948648	Kiarra73@yahoo.com	MEMBER	5b85b405-52a2-4b22-a423-6fa14db17558	2025-11-25 00:44:02.422	767fe4a0-7637-496f-847b-b6e29ef822fc	2025-11-18 00:44:02.423	2025-11-18 00:44:02.423	{}	t
924e8012-3635-4aa1-88aa-c389f910e040	504ef1e7-5f0a-4ad8-b06f-deaa7f948648	Keyshawn26@yahoo.com	MEMBER	680f6025-b310-4545-a61d-59b478334876	2025-11-25 00:44:02.423	9fc428c9-834b-4df1-953b-6f65d44d017b	2025-11-18 00:44:02.423	2025-11-18 00:44:02.423	{}	t
b6018ca9-d616-409d-9c35-a335acfcfdf9	504ef1e7-5f0a-4ad8-b06f-deaa7f948648	Anibal_Daniel@yahoo.com	MEMBER	8ad38522-0c4d-4424-9799-6a60d0eda186	2025-11-25 00:44:02.423	85abeaad-7edc-4b4b-af13-fb066ef763cb	2025-11-18 00:44:02.424	2025-11-18 00:44:02.424	{}	t
3456ddb2-c3e9-4097-83f5-81ccfaac8d71	504ef1e7-5f0a-4ad8-b06f-deaa7f948648	Felicita.Boehm@yahoo.com	MEMBER	aa672fbf-d1c5-492d-9ba7-3fcfda192678	2025-11-25 00:44:02.424	089479fb-ca59-4e91-a0f8-c880fb0835f0	2025-11-18 00:44:02.424	2025-11-18 00:44:02.424	{}	t
a1b50e95-eb4e-42e0-9970-3a8b5e0f67ed	b7add7e5-c436-4d32-a3bf-3b95c12096c6	Johnathon_Hahn@yahoo.com	MEMBER	0f835853-3d04-487b-8775-31db116beb5d	2025-11-25 00:44:02.424	4e32ac67-ce8d-401a-8da9-88fb08906258	2025-11-18 00:44:02.425	2025-11-18 00:44:02.425	{}	t
58a57a2d-a15d-431d-862e-85c51daee021	b7add7e5-c436-4d32-a3bf-3b95c12096c6	Linnie_Connelly@hotmail.com	MEMBER	9118e9b7-4e3b-4ff6-a615-e46c3fdcce1a	2025-11-25 00:44:02.424	66a78b96-5e28-4cb7-848c-82789b43909b	2025-11-18 00:44:02.425	2025-11-18 00:44:02.425	{}	t
97dd7fcf-d003-4c00-9ab0-5c4d3da8767f	b7add7e5-c436-4d32-a3bf-3b95c12096c6	Issac_Kemmer-Pouros@yahoo.com	MEMBER	887a6e11-e439-4a3e-a29b-3dceb1ad0c0f	2025-11-25 00:44:02.425	9fc428c9-834b-4df1-953b-6f65d44d017b	2025-11-18 00:44:02.425	2025-11-18 00:44:02.425	{}	t
4e630c69-f9f0-479a-87b9-0435dbfcc14d	b7add7e5-c436-4d32-a3bf-3b95c12096c6	Maida.Hintz69@yahoo.com	MEMBER	0d634e13-5d78-4d69-afb0-61ee7d48502e	2025-11-25 00:44:02.425	85abeaad-7edc-4b4b-af13-fb066ef763cb	2025-11-18 00:44:02.426	2025-11-18 00:44:02.426	{}	t
cc11d3fc-242b-4b5e-a04d-f910409eff12	3b068e6d-d55d-41fb-9059-6de8009b8641	Mallie_Prosacco@hotmail.com	MEMBER	8f0a0556-6aa5-44bf-bcd5-0abba5a497e2	2025-11-25 00:44:02.426	db855c2b-8a9f-4abb-a5e8-d3818be2b8c8	2025-11-18 00:44:02.426	2025-11-18 00:44:02.426	{}	t
fb6bec22-48b3-42d4-972b-673f143d464a	3b068e6d-d55d-41fb-9059-6de8009b8641	Mollie81@gmail.com	MEMBER	304a7c8a-4d39-4767-afb1-4a4768526098	2025-11-25 00:44:02.426	4e32ac67-ce8d-401a-8da9-88fb08906258	2025-11-18 00:44:02.427	2025-11-18 00:44:02.427	{}	t
a7a349bd-91a5-4b53-9c10-8408a7377ef7	3b068e6d-d55d-41fb-9059-6de8009b8641	Jana_Mohr@yahoo.com	MEMBER	1d54396a-9aed-4c80-8877-c27d0fe617d6	2025-11-25 00:44:02.427	089479fb-ca59-4e91-a0f8-c880fb0835f0	2025-11-18 00:44:02.428	2025-11-18 00:44:02.428	{}	t
ce4ac567-cd4e-46d3-90dc-c34c0a44644b	3b068e6d-d55d-41fb-9059-6de8009b8641	Mable_Bogan30@yahoo.com	MEMBER	e4b2cd7c-692a-4e5b-b97c-5b1c7d884975	2025-11-25 00:44:02.427	66a78b96-5e28-4cb7-848c-82789b43909b	2025-11-18 00:44:02.428	2025-11-18 00:44:02.428	{}	t
ab0b0ac0-d641-4691-857d-55d6564f1818	3b068e6d-d55d-41fb-9059-6de8009b8641	Nathen.West@yahoo.com	MEMBER	125b47d8-861c-45dc-8a3c-ad2b61ac0a3d	2025-11-25 00:44:02.428	f56a9887-8399-437a-bf6c-729159cf97a9	2025-11-18 00:44:02.428	2025-11-18 00:44:02.428	{}	t
147d38a3-4844-4762-a6a5-1a8ee80adb9d	3b068e6d-d55d-41fb-9059-6de8009b8641	Makenna22@yahoo.com	MEMBER	76cc9a64-2024-4afd-8a9e-40c078ab78e6	2025-11-25 00:44:02.428	db855c2b-8a9f-4abb-a5e8-d3818be2b8c8	2025-11-18 00:44:02.429	2025-11-18 00:44:02.429	{}	t
7f0c4ca4-5448-46d9-aa81-35b42f1881c6	3b068e6d-d55d-41fb-9059-6de8009b8641	Ward.Macejkovic@yahoo.com	MEMBER	59f10dc6-b518-48d8-bc7f-ef52c3c00fa0	2025-11-25 00:44:02.429	767fe4a0-7637-496f-847b-b6e29ef822fc	2025-11-18 00:44:02.429	2025-11-18 00:44:02.429	{}	t
e3760d0d-e74b-4b03-8b56-d702787be286	3b068e6d-d55d-41fb-9059-6de8009b8641	Casimir8@hotmail.com	MEMBER	758f196e-9617-46aa-bcf4-094feda9a31f	2025-11-25 00:44:02.429	85abeaad-7edc-4b4b-af13-fb066ef763cb	2025-11-18 00:44:02.43	2025-11-18 00:44:02.43	{}	t
2785adbe-bd2c-4ee9-a34a-9f9236838cd1	3b068e6d-d55d-41fb-9059-6de8009b8641	Emmanuelle.Bartoletti68@gmail.com	MEMBER	f94df5be-1224-44c6-84c0-930b6385ff63	2025-11-25 00:44:02.429	089479fb-ca59-4e91-a0f8-c880fb0835f0	2025-11-18 00:44:02.43	2025-11-18 00:44:02.43	{}	t
05c80906-a148-4e7f-a8a2-02aefb02d6ad	3b068e6d-d55d-41fb-9059-6de8009b8641	Filiberto14@yahoo.com	MEMBER	ed6d6e36-d658-4e27-9a67-9e022fdcc6c9	2025-11-25 00:44:02.43	9fc428c9-834b-4df1-953b-6f65d44d017b	2025-11-18 00:44:02.43	2025-11-18 00:44:02.43	{}	t
fe2a6731-e708-4393-b4fc-6a8af5dacb50	6ad8a194-5bd6-42a9-8850-63053a70d3ca	Dillan_Wilkinson2@yahoo.com	MEMBER	8f6347af-205d-442f-9358-6695899323bf	2025-11-25 00:44:02.43	1560bfa1-82ee-412c-aaf0-332d2fc3957d	2025-11-18 00:44:02.431	2025-11-18 00:44:02.431	{}	t
9518ffd1-a590-49c5-ba14-601f7f5acd1a	6ad8a194-5bd6-42a9-8850-63053a70d3ca	Hollis10@yahoo.com	MEMBER	ca0a4438-1425-402e-baed-4064479aa1a0	2025-11-25 00:44:02.431	85abeaad-7edc-4b4b-af13-fb066ef763cb	2025-11-18 00:44:02.431	2025-11-18 00:44:02.431	{}	t
87f77955-91a9-4d33-865b-102e19d55b2e	6ad8a194-5bd6-42a9-8850-63053a70d3ca	Leslie.Schaefer65@gmail.com	MEMBER	3aa6147b-e5fc-4214-8271-37a2267a7152	2025-11-25 00:44:02.431	9fc428c9-834b-4df1-953b-6f65d44d017b	2025-11-18 00:44:02.431	2025-11-18 00:44:02.431	{}	t
0228fbc3-2c22-49b4-9aae-459660789da3	6ad8a194-5bd6-42a9-8850-63053a70d3ca	Shanelle45@yahoo.com	MEMBER	56fe0c1a-b1f0-4859-9cf8-1bf3bdb8265d	2025-11-25 00:44:02.431	f56a9887-8399-437a-bf6c-729159cf97a9	2025-11-18 00:44:02.432	2025-11-18 00:44:02.432	{}	t
812bc2a2-d128-4ce9-9d72-287956136e7e	6ad8a194-5bd6-42a9-8850-63053a70d3ca	Cleve44@hotmail.com	MEMBER	ffa3a7bf-cd32-452e-a9ff-042cd8dfc991	2025-11-25 00:44:02.432	9fc428c9-834b-4df1-953b-6f65d44d017b	2025-11-18 00:44:02.432	2025-11-18 00:44:02.432	{}	t
413ed450-a356-4a0d-ab3d-4f4106198a8e	6ad8a194-5bd6-42a9-8850-63053a70d3ca	Garrison.Langosh@gmail.com	MEMBER	84e9ed5b-053a-4596-83be-65738f295e2a	2025-11-25 00:44:02.432	f56a9887-8399-437a-bf6c-729159cf97a9	2025-11-18 00:44:02.433	2025-11-18 00:44:02.433	{}	t
c46c1cf3-efe8-4bb7-9ff9-0dd782b2a098	6ad8a194-5bd6-42a9-8850-63053a70d3ca	Rebeka.Purdy@hotmail.com	MEMBER	9be90bcb-f593-4702-9205-2e0850468ee0	2025-11-25 00:44:02.432	f56a9887-8399-437a-bf6c-729159cf97a9	2025-11-18 00:44:02.433	2025-11-18 00:44:02.433	{}	t
6be28dea-11c4-4c7c-bd55-ac11022980b8	6ad8a194-5bd6-42a9-8850-63053a70d3ca	Jaeden74@yahoo.com	MEMBER	667d8d86-c4d2-451f-b986-0eea5cb1a996	2025-11-25 00:44:02.433	089479fb-ca59-4e91-a0f8-c880fb0835f0	2025-11-18 00:44:02.433	2025-11-18 00:44:02.433	{}	t
70a984b0-bff3-4cfc-b716-0d571d16b1b6	6ad8a194-5bd6-42a9-8850-63053a70d3ca	Adaline71@gmail.com	MEMBER	ff162e42-40e9-455e-99fe-1da5635666c8	2025-11-25 00:44:02.433	4e32ac67-ce8d-401a-8da9-88fb08906258	2025-11-18 00:44:02.434	2025-11-18 00:44:02.434	{}	t
131b1533-5029-4863-a877-f081c5bdfd3f	7ea9a475-49ac-4d60-85eb-19872f5b7f3e	Florence.Hills84@hotmail.com	MEMBER	533c7b23-d6ce-4ec0-8b4d-a80ec9e60c8c	2025-11-25 00:44:02.434	66a78b96-5e28-4cb7-848c-82789b43909b	2025-11-18 00:44:02.434	2025-11-18 00:44:02.434	{}	t
30d38472-2386-4ce8-ba91-dfa72e7d1aee	7ea9a475-49ac-4d60-85eb-19872f5b7f3e	Dudley54@yahoo.com	MEMBER	ec02e1a2-1349-4524-833c-7bb0acb413d5	2025-11-25 00:44:02.434	4e32ac67-ce8d-401a-8da9-88fb08906258	2025-11-18 00:44:02.435	2025-11-18 00:44:02.435	{}	t
ba6da288-6a79-4cbe-bd39-59bc76f13a4d	7ea9a475-49ac-4d60-85eb-19872f5b7f3e	Jaylin43@yahoo.com	MEMBER	9f9ac1d9-3ffe-462e-83b9-9bf2f3d3c1d2	2025-11-25 00:44:02.435	089479fb-ca59-4e91-a0f8-c880fb0835f0	2025-11-18 00:44:02.435	2025-11-18 00:44:02.435	{}	t
0722f5c8-8442-4e46-806b-ec91c1417b1f	7ea9a475-49ac-4d60-85eb-19872f5b7f3e	Hunter_Kihn@yahoo.com	MEMBER	6bb8b082-4bbe-4295-84af-859144918540	2025-11-25 00:44:02.435	db855c2b-8a9f-4abb-a5e8-d3818be2b8c8	2025-11-18 00:44:02.435	2025-11-18 00:44:02.435	{}	t
4fca87ec-19db-4bc8-a646-0cc749d88788	7ea9a475-49ac-4d60-85eb-19872f5b7f3e	Cleve_Heaney@hotmail.com	MEMBER	559680fb-4400-4d66-9491-0e4c2f80d92f	2025-11-25 00:44:02.435	85abeaad-7edc-4b4b-af13-fb066ef763cb	2025-11-18 00:44:02.436	2025-11-18 00:44:02.436	{}	t
9bf1e5bc-9edd-461f-a254-25a3088b9b66	7ea9a475-49ac-4d60-85eb-19872f5b7f3e	Lavina58@gmail.com	MEMBER	6625ccb0-621b-4607-bf8c-3829e0635b9e	2025-11-25 00:44:02.436	7f92a0f9-bace-4116-92cb-6b1b7847a5db	2025-11-18 00:44:02.436	2025-11-18 00:44:02.436	{}	t
eb5f6804-10b6-44e2-b10d-f1d1761c352d	7ea9a475-49ac-4d60-85eb-19872f5b7f3e	Meda.Hahn@yahoo.com	MEMBER	6ac83c93-dfcd-41d9-a2b2-c2829807a4ac	2025-11-25 00:44:02.436	089479fb-ca59-4e91-a0f8-c880fb0835f0	2025-11-18 00:44:02.437	2025-11-18 00:44:02.437	{}	t
71960402-c1d0-42a6-ad18-3a7236ad7afc	7ea9a475-49ac-4d60-85eb-19872f5b7f3e	Dejon_Stiedemann@yahoo.com	MEMBER	f6929ed3-ea08-4234-9908-dc3d63fc9a24	2025-11-25 00:44:02.436	767fe4a0-7637-496f-847b-b6e29ef822fc	2025-11-18 00:44:02.437	2025-11-18 00:44:02.437	{}	t
529a0503-3ca3-4973-8286-ae63dd5dd5e1	7ea9a475-49ac-4d60-85eb-19872f5b7f3e	Mariana_Klocko-Nikolaus@gmail.com	MEMBER	4c3fc531-1206-441d-b047-c37a11e867d5	2025-11-25 00:44:02.437	089479fb-ca59-4e91-a0f8-c880fb0835f0	2025-11-18 00:44:02.437	2025-11-18 00:44:02.437	{}	t
1563c9ee-f633-4005-81e8-d821f7cb6775	7ea9a475-49ac-4d60-85eb-19872f5b7f3e	Alexander_Glover35@hotmail.com	MEMBER	9e3a8360-90a4-43cd-9751-db584de36391	2025-11-25 00:44:02.437	9fc428c9-834b-4df1-953b-6f65d44d017b	2025-11-18 00:44:02.438	2025-11-18 00:44:02.438	{}	t
\.


--
-- Data for Name: PasswordReset; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."PasswordReset" (id, email, token, "createdAt", "updatedAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Payment" (id, "songRequestId", "venueId", "providerPaymentId", amount, currency, status, "venueRevenue", "platformFee", "processingFee", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Price; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Price" (id, "billingScheme", currency, "serviceId", amount, metadata, type, created) FROM stdin;
\.


--
-- Data for Name: Service; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Service" (id, description, features, image, name, created, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Session" (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: SongRequest; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."SongRequest" (id, "venueId", "patronIdentifier", "spotifyTrackId", "trackName", "artistName", "albumName", "trackUri", status, price, currency, "queuePosition", "requestedAt", "queuedAt", "playedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Subscription; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Subscription" (id, "customerId", "priceId", active, "startDate", "endDate", "cancelAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Team; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Team" (id, name, slug, domain, "defaultRole", "createdAt", "updatedAt", "billingId", "billingProvider") FROM stdin;
7ea9a475-49ac-4d60-85eb-19872f5b7f3e	Gusikowski Group	gusikowski-group	\N	MEMBER	2025-11-18 00:44:02.405	2025-11-18 00:44:02.405	\N	\N
6ad8a194-5bd6-42a9-8850-63053a70d3ca	Donnelly - Morar	donnelly-morar	\N	MEMBER	2025-11-18 00:44:02.405	2025-11-18 00:44:02.405	\N	\N
3b068e6d-d55d-41fb-9059-6de8009b8641	Rath - Ernser	rath-ernser	\N	MEMBER	2025-11-18 00:44:02.405	2025-11-18 00:44:02.405	\N	\N
504ef1e7-5f0a-4ad8-b06f-deaa7f948648	McKenzie, Trantow and Harris	mckenzie-trantow-and-harris	\N	MEMBER	2025-11-18 00:44:02.405	2025-11-18 00:44:02.405	\N	\N
b7add7e5-c436-4d32-a3bf-3b95c12096c6	Thiel - Langworth	thiel-langworth	\N	MEMBER	2025-11-18 00:44:02.405	2025-11-18 00:44:02.405	\N	\N
dc3a9110-773b-470f-97d6-42ec1fbef2b5	qwe	qwe	\N	MEMBER	2025-11-22 01:29:32.067	2025-11-22 01:29:32.067	\N	\N
8158c232-2316-4fa2-aab4-eec269bab774	asd	asd	asdasd.com	MEMBER	2025-11-22 01:30:07.252	2025-11-22 01:30:07.252	\N	\N
\.


--
-- Data for Name: TeamMember; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."TeamMember" (id, "teamId", "userId", role, "createdAt", "updatedAt") FROM stdin;
486f7568-46bd-4a94-ac3b-31b93a14bc2e	3b068e6d-d55d-41fb-9059-6de8009b8641	9fc428c9-834b-4df1-953b-6f65d44d017b	OWNER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
91aaf778-950a-43ca-8aef-2f5a9b5fc799	504ef1e7-5f0a-4ad8-b06f-deaa7f948648	9fc428c9-834b-4df1-953b-6f65d44d017b	OWNER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
e2f2ba79-bc70-4ff9-89e2-2dc878cfe05a	6ad8a194-5bd6-42a9-8850-63053a70d3ca	9fc428c9-834b-4df1-953b-6f65d44d017b	OWNER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
d4329e66-cbbd-46b4-9abc-eb14438a73dc	7ea9a475-49ac-4d60-85eb-19872f5b7f3e	9fc428c9-834b-4df1-953b-6f65d44d017b	OWNER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
23259f35-c44a-4e70-9262-ad674abd4893	7ea9a475-49ac-4d60-85eb-19872f5b7f3e	f56a9887-8399-437a-bf6c-729159cf97a9	MEMBER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
3ccfa8fe-cd49-419b-82fb-448b48c29667	3b068e6d-d55d-41fb-9059-6de8009b8641	f56a9887-8399-437a-bf6c-729159cf97a9	MEMBER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
948fe891-4eea-4d2b-84a2-5f5c9b009fff	b7add7e5-c436-4d32-a3bf-3b95c12096c6	66a78b96-5e28-4cb7-848c-82789b43909b	MEMBER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
c82952b7-e02f-4dbf-bc92-d4a4e31e1f3b	504ef1e7-5f0a-4ad8-b06f-deaa7f948648	66a78b96-5e28-4cb7-848c-82789b43909b	MEMBER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
d9ce46a0-97af-4115-94b2-f6e3cb07baf7	b7add7e5-c436-4d32-a3bf-3b95c12096c6	85abeaad-7edc-4b4b-af13-fb066ef763cb	MEMBER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
c0d44ce8-54e2-4bbf-aae5-df68693d485d	6ad8a194-5bd6-42a9-8850-63053a70d3ca	85abeaad-7edc-4b4b-af13-fb066ef763cb	OWNER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
62ed0b10-f5cd-4fb6-899c-aeb1948fc9f4	3b068e6d-d55d-41fb-9059-6de8009b8641	7f92a0f9-bace-4116-92cb-6b1b7847a5db	MEMBER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
8d7affa0-b0ec-49d6-a658-fdce7cf07084	6ad8a194-5bd6-42a9-8850-63053a70d3ca	7f92a0f9-bace-4116-92cb-6b1b7847a5db	MEMBER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
7a337d1d-2deb-4cdc-807f-aa9e51fcbce6	7ea9a475-49ac-4d60-85eb-19872f5b7f3e	7f92a0f9-bace-4116-92cb-6b1b7847a5db	MEMBER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
dc04b3ca-4906-4392-ab24-49e11d6dc885	504ef1e7-5f0a-4ad8-b06f-deaa7f948648	089479fb-ca59-4e91-a0f8-c880fb0835f0	OWNER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
4224cbcb-1902-4228-94f4-687f98c1fddf	6ad8a194-5bd6-42a9-8850-63053a70d3ca	089479fb-ca59-4e91-a0f8-c880fb0835f0	OWNER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
c95c5ba9-39ef-4f57-b530-6aa2bdde87a4	b7add7e5-c436-4d32-a3bf-3b95c12096c6	089479fb-ca59-4e91-a0f8-c880fb0835f0	MEMBER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
43f17d6b-bd64-4d53-bed9-3a0f15226428	7ea9a475-49ac-4d60-85eb-19872f5b7f3e	089479fb-ca59-4e91-a0f8-c880fb0835f0	MEMBER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
c160a03b-41a5-4600-889f-06f25c1a00bc	3b068e6d-d55d-41fb-9059-6de8009b8641	089479fb-ca59-4e91-a0f8-c880fb0835f0	OWNER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
b9da853b-b0a1-48c1-a79f-784b027147b6	504ef1e7-5f0a-4ad8-b06f-deaa7f948648	1560bfa1-82ee-412c-aaf0-332d2fc3957d	OWNER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
b4a7d79e-b1a5-4c65-8ec5-b1f7f0241b7f	b7add7e5-c436-4d32-a3bf-3b95c12096c6	1560bfa1-82ee-412c-aaf0-332d2fc3957d	MEMBER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
fdcfea32-39a1-496f-8d1b-b14ebdd974c3	3b068e6d-d55d-41fb-9059-6de8009b8641	1560bfa1-82ee-412c-aaf0-332d2fc3957d	MEMBER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
87f53de9-d35c-4e6a-8630-d7bec36a900f	6ad8a194-5bd6-42a9-8850-63053a70d3ca	1560bfa1-82ee-412c-aaf0-332d2fc3957d	MEMBER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
b05dedc3-511a-440f-8fa0-a8fd08fdc899	7ea9a475-49ac-4d60-85eb-19872f5b7f3e	1560bfa1-82ee-412c-aaf0-332d2fc3957d	OWNER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
78ed7f42-5abd-4f1e-b2d1-fafcf9d38d6e	b7add7e5-c436-4d32-a3bf-3b95c12096c6	767fe4a0-7637-496f-847b-b6e29ef822fc	OWNER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
058df6be-321c-4283-b445-69c295e53501	7ea9a475-49ac-4d60-85eb-19872f5b7f3e	767fe4a0-7637-496f-847b-b6e29ef822fc	OWNER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
8c5948b0-5d53-404b-bd01-53d5335f2630	504ef1e7-5f0a-4ad8-b06f-deaa7f948648	767fe4a0-7637-496f-847b-b6e29ef822fc	OWNER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
e1e9b4ad-83f8-4e19-b823-3a84b872c143	3b068e6d-d55d-41fb-9059-6de8009b8641	767fe4a0-7637-496f-847b-b6e29ef822fc	MEMBER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
13893059-0be9-4d48-8f6b-4f8bf7aefc01	6ad8a194-5bd6-42a9-8850-63053a70d3ca	767fe4a0-7637-496f-847b-b6e29ef822fc	OWNER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
da4b7231-4945-42e5-b590-ad9a6a9dbb21	504ef1e7-5f0a-4ad8-b06f-deaa7f948648	4e32ac67-ce8d-401a-8da9-88fb08906258	OWNER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
4b7c5cd2-ce8f-4466-b552-75dbea4d9a21	6ad8a194-5bd6-42a9-8850-63053a70d3ca	4e32ac67-ce8d-401a-8da9-88fb08906258	MEMBER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
76440c4b-6d2b-496f-8dff-228ce19119d8	b7add7e5-c436-4d32-a3bf-3b95c12096c6	4e32ac67-ce8d-401a-8da9-88fb08906258	OWNER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
bdeaaa66-4095-4818-863f-1eab658626ff	3b068e6d-d55d-41fb-9059-6de8009b8641	db855c2b-8a9f-4abb-a5e8-d3818be2b8c8	OWNER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
e28d0df6-ed03-4516-809a-3b001ca2bc7f	7ea9a475-49ac-4d60-85eb-19872f5b7f3e	db855c2b-8a9f-4abb-a5e8-d3818be2b8c8	OWNER	2025-11-18 00:44:02.41	2025-11-18 00:44:02.41
f79f3b6c-9aea-44dc-bcf7-3c5ac2f0f982	dc3a9110-773b-470f-97d6-42ec1fbef2b5	e9d37cc7-08aa-43a1-9ddf-29b56b5d819f	OWNER	2025-11-22 01:29:32.07	2025-11-22 01:29:32.07
f9ef6e3d-21b9-4f62-945f-f2e2f8df98f4	8158c232-2316-4fa2-aab4-eec269bab774	772d07c2-08d6-4da4-b6e6-3fd1aae16b3d	OWNER	2025-11-22 01:30:07.253	2025-11-22 01:30:07.253
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."User" (id, name, email, "emailVerified", password, image, "createdAt", "updatedAt", invalid_login_attempts, "lockedAt") FROM stdin;
f56a9887-8399-437a-bf6c-729159cf97a9	Carlie	user@example.com	2025-11-18 00:44:00.577	$2b$12$g6icExLa9sGft2SfJE2b8.FIVcgSH7Ir0Sn2zo5KKIREKxCr8CkhC	\N	2025-11-18 00:44:00.578	2025-11-18 00:44:00.578	0	\N
66a78b96-5e28-4cb7-848c-82789b43909b	Nathaniel	Casey57@gmail.com	2025-11-18 00:44:02.368	$2b$12$wfWzfAh89jJYFV/4LmUiAu4CcpT6pogzNNebcasbT12IExlVIVLiy	\N	2025-11-18 00:44:02.369	2025-11-18 00:44:02.369	0	\N
85abeaad-7edc-4b4b-af13-fb066ef763cb	Margie	Willard.Bechtelar-Torp@gmail.com	2025-11-18 00:44:02.368	$2b$12$EOGwuHje2aA9/xTsbJWWEe3zkXKWeKPDMB0rH5OS7bCWdD9/GKvKu	\N	2025-11-18 00:44:02.369	2025-11-18 00:44:02.369	0	\N
7f92a0f9-bace-4116-92cb-6b1b7847a5db	Coby	Dolly.Baumbach72@gmail.com	2025-11-18 00:44:02.368	$2b$12$GRgCi47xmTx9TMdwRDg6he/Zej2sjCPK3VRrq5DmM2n7A305zf.n6	\N	2025-11-18 00:44:02.369	2025-11-18 00:44:02.369	0	\N
089479fb-ca59-4e91-a0f8-c880fb0835f0	Leo	Palma_Grady82@yahoo.com	2025-11-18 00:44:02.369	$2b$12$5JnjlL72MI4VK0tSsfIPWuST5DTA2FIYsA19My9b/zriGefNm6WFG	\N	2025-11-18 00:44:02.369	2025-11-18 00:44:02.369	0	\N
1560bfa1-82ee-412c-aaf0-332d2fc3957d	Jake	Domenico_Grady64@gmail.com	2025-11-18 00:44:02.368	$2b$12$8a1mXV5P7qsgh/iEpkZPV..pjXqqUbvX3rYFGvLgE9vsQz2l9Rrs.	\N	2025-11-18 00:44:02.369	2025-11-18 00:44:02.369	0	\N
767fe4a0-7637-496f-847b-b6e29ef822fc	Everardo	Lucy.Kirlin@hotmail.com	2025-11-18 00:44:02.368	$2b$12$JTJY/oC/HFRO2iVeHg0pMOMOewYPVxN/jCoA0OtlI4yJr4.arKfyC	\N	2025-11-18 00:44:02.369	2025-11-18 00:44:02.369	0	\N
4e32ac67-ce8d-401a-8da9-88fb08906258	Jalon	Leann_Larson57@gmail.com	2025-11-18 00:44:02.368	$2b$12$13cNKVgopJha/omn2M7tzuRBw29ORrrSoeheuZL2IbwwuA7lI8Dxe	\N	2025-11-18 00:44:02.369	2025-11-18 00:44:02.369	0	\N
db855c2b-8a9f-4abb-a5e8-d3818be2b8c8	Donato	Imani63@yahoo.com	2025-11-18 00:44:02.368	$2b$12$xWahF1zCV23X151/7J7OsOtIMSWSLqBJaw1IwhRqGP.DslpQuUZfW	\N	2025-11-18 00:44:02.369	2025-11-18 00:44:02.369	0	\N
9fc428c9-834b-4df1-953b-6f65d44d017b	Daniella	admin@example.com	2025-11-18 00:44:00.325	$2b$12$QR9PoU5Tl7XG5r4l9dBIR.lHSNIYz1Tbikk9zUV1QV188UdW1P9SW	\N	2025-11-18 00:44:00.356	2025-11-18 00:44:00.356	0	\N
e9d37cc7-08aa-43a1-9ddf-29b56b5d819f	asd	zxc@zxc.com	\N	$2b$12$FA2Df8REtKvPq/LtVYI9GeXholWDqAEVc2N11zMRg2qFDC8Ckhuqa	\N	2025-11-22 01:29:32.065	2025-11-22 01:29:32.065	0	\N
772d07c2-08d6-4da4-b6e6-3fd1aae16b3d	asd	asd@asd.com	\N	$2b$12$Jye43VeVr4CTsjhQFotB1eY0fUBV7ni4rU5TcPeQg9jFid0O2mPq.	\N	2025-11-22 01:30:07.251	2025-11-22 01:30:07.251	0	\N
\.


--
-- Data for Name: Venue; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Venue" (id, "teamId", name, slug, address, mode, "spotifyUserId", "spotifyAccessToken", "spotifyRefreshToken", "spotifyTokenExpiresAt", "pricingEnabled", "pricePerSong", currency, "qrCodeUrl", "isActive", "createdAt", "updatedAt", "n8nCredentialId", "spotifyDisplayName", "spotifyClientId", "spotifyClientSecret") FROM stdin;
e3f66d09-171e-4c8e-bcd0-9cbea141fc64	8158c232-2316-4fa2-aab4-eec269bab774	asd	asd	\N	QUEUE	pablo_of	BQAo0xXNV7TexxyYUrXu7X0UqbK15Ur9SB0nFnUCBhZ2dWL4lsDYir1AwApn_nfY9rLCqMVJ0M8JSoRKJI-SOGXqmLq5u52l3WrdEivCuXxqG22IJA4v_DLNVp3GUJm87bqgHl-fLGAjYBPLuT7OL5vF3foS5uDlnckYKu-61lUopZ0AbIwYqi6_1XSNyhhUOldKFTf8fZspy25WtFxwfknaz8RJeV7cPA0B-TPVZqgZUA	AQDtgTVCdrYxm3ShGnXDK9a_FJkvb3nBPMpTk-VoU_hg2q7gcHjGCPL4cOMpHdAFGDf5CShYlap1su2PeDtvA-AHzbNq1T-tDTu_I0qo9DG4q0JfY3DAHqlh2_U81XNN5Rc	2025-11-23 03:35:28.549	t	9.00	USD	\N	t	2025-11-23 02:32:22.055	2025-11-23 02:54:40.446	fjrVR5bR1A69MwRY	acrophase	51ac6e03a9694126b84402763a033249	96570d65d0c84d51839c1bf6c8354ad5
\.


--
-- Data for Name: VerificationToken; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."VerificationToken" (identifier, token, expires) FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
dd3db474-eb3d-4169-883c-05e439afc2dc	69d3b0047aeee4a78a7394cac79c5522cd2a87222b8b4bf28770878fc49ecfca	2025-11-18 00:43:58.717281+00	20230625203909_init	\N	\N	2025-11-18 00:43:58.672453+00	1
da544125-6ca5-4c2e-9524-f4789c8b4062	0cc4aab3acb9062a34445edf4ef5a44bab3633bfcd7b3556f64ae24e172ecfe0	2025-11-18 00:43:58.725666+00	20230703084002_add_api_keys	\N	\N	2025-11-18 00:43:58.718107+00	1
96063103-952c-4544-ba04-da13c5fc99dd	35d406c5b626c971a7c74d438f0cc509aaa274c7acf9e0882af7a685a1350f4b	2025-11-18 00:43:58.732031+00	20230703084117_add_index_user	\N	\N	2025-11-18 00:43:58.726582+00	1
8cd50246-d2b4-41d5-8a6e-77ee8fa48c13	9cb51e0b7636fa960d2bd9f801893d4151f9fbecb6d7514cfd9cd8926b70ca3d	2025-11-18 00:43:58.733526+00	20230720113226_make_password_optional	\N	\N	2025-11-18 00:43:58.732382+00	1
371af0e4-163e-4113-ad4d-6af9e911913a	56b3cfde3de868f031569364af5e40200189fa2fb73ebb264f9e8cb94b5a9679	2025-11-18 00:43:58.734966+00	20231109082527_add_account_lockout	\N	\N	2025-11-18 00:43:58.733897+00	1
251c1d4d-7bea-4055-b410-6dafd7a1906d	5d9222d034d5cd613b098bf63c501ad06dae14d71e8dfd97428b60f2de03e556	2025-11-18 00:43:58.736565+00	20240109041326_columns_for_invitation_link	\N	\N	2025-11-18 00:43:58.735271+00	1
fc4553e7-6b6e-4c5a-a761-1ea805f64258	b482ed7e1bc3f6bb0a498080e5afd2809a643a3667171b997db98d6b44dc341b	2025-11-18 00:43:58.747157+00	20240212105842_stripe	\N	\N	2025-11-18 00:43:58.736877+00	1
65161d24-35ca-46f0-bbfa-264d49fc657e	a0ef8b4fffe6b5a7f00a58c7c436b33ce81c763051168976d7303f70eb07d371	2025-11-18 00:43:58.753056+00	20240213160517_indices	\N	\N	2025-11-18 00:43:58.748301+00	1
92ce00f7-6315-4362-83a0-d3ca8b71eef3	74900ff2b684ffb180433f56f6a29a7de5d484350fd774d1fbbd689189730301	2025-11-18 00:43:58.775575+00	20240226091046_add_jackson_schema	\N	\N	2025-11-18 00:43:58.753497+00	1
5da558c3-9f8d-4ba5-8a1a-21c68b2ea427	125cc4a378fcafc94e6fec8f133c551061f577fb7a92b75f9cbaf1339b8f0818	2025-11-18 00:43:58.778585+00	20240316224800_add_index_billing_id	\N	\N	2025-11-18 00:43:58.776085+00	1
0bf4a27b-c9d1-4297-957f-bd47a83225ab	1bc6c6d90eaecc2449781d31845a93f486ccb09425014f1e5158e590de15cb5f	2025-11-18 00:43:58.781062+00	20240531124127_expand_jackson_namespace_column	\N	\N	2025-11-18 00:43:58.779261+00	1
bf65d784-4a0c-47c2-a9c6-8b83c9107ea4	644c92e01bc4e5ae29fb73fa68871c534c2bcf820ecd94121c2013bba54e2a71	2025-11-18 00:44:08.917175+00	20251118004408_add_rockola_core_models	\N	\N	2025-11-18 00:44:08.891026+00	1
\.


--
-- Data for Name: jackson_index; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.jackson_index (id, key, "storeKey") FROM stdin;
\.


--
-- Data for Name: jackson_store; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.jackson_store (key, value, iv, tag, "createdAt", "modifiedAt", namespace) FROM stdin;
x509:certificates:d0433197d35269e214094d56068f768a15f2f00a	{"publicKey":"-----BEGIN CERTIFICATE-----\\r\\nMIICvzCCAaegAwIBAgIBATANBgkqhkiG9w0BAQsFADAUMRIwEAYDVQQDEwlPcnkg\\r\\nUG9saXMwIBcNMjUxMTIyMDEzMDM0WhgPMjA1NTExMjIwMTMwMzRaMBQxEjAQBgNV\\r\\nBAMTCU9yeSBQb2xpczCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALIz\\r\\nakPUfaAnvSvNOjJdUXvDAUqILVBjo0oTwpYfdRGeLvMI0TEXcA5JeBkwJbRhGa+N\\r\\nsqFUQJCkc30UVhTgH9Agk6b1W1EOBPrLhg4A5eYkhQNRU/XVvZEyDjJOgZh6Dg4G\\r\\nQSxjPGH9UpaFI314GRsralHpXQrDpFEhsJiY52upoqiUJptLtvsyX970aAKpe+eF\\r\\nwKFkNlgMlUnroK3NWjU56MBS5jX8V+ECOBhaNZDyujYxbxMQATiodgd4CxzRPy4a\\r\\nJMl0wwlpg/YVaX3AzdJacmSbJUNZtJb4TPbj0xCFRWRsmcea6Rf6PTvRx4dwxZmy\\r\\nNpG4BkOjaiBSEgotNRcCAwEAAaMaMBgwCQYDVR0TBAIwADALBgNVHQ8EBAMCB4Aw\\r\\nDQYJKoZIhvcNAQELBQADggEBAAIamcEU9lChCDn2JlzyDEQWUI1yGtCYJY+M1O6p\\r\\nUtc1of3DugGoH+R6Zmq4RBz4ehIFDuj9w6Itk1OZ72iJIh6PQTfLg4/8taIwytOW\\r\\nNpQyp8HFwNo7cudaocWKIB+Wlbscfdzq87iXVFiLezkPhrzhsFJ7POWPPqUw9cbP\\r\\nn+uytTCqAlpqzNAcKPmUtJP/JP3HUJpTloINQh2dRLJW5t6vZzKXfv5Mm+ietrjl\\r\\neE+dwKWqXEN/khRUHaccCgtoDE+AoVU+mM4m1rxPtgeGCYN1Y7i0ZPWkthWF3tbR\\r\\nS/O5NRiJkei+HTOpgkNE06OUib67ciguL4+ba1kCoQztt/M=\\r\\n-----END CERTIFICATE-----\\r\\n","privateKey":"-----BEGIN RSA PRIVATE KEY-----\\r\\nMIIEpQIBAAKCAQEAsjNqQ9R9oCe9K806Ml1Re8MBSogtUGOjShPClh91EZ4u8wjR\\r\\nMRdwDkl4GTAltGEZr42yoVRAkKRzfRRWFOAf0CCTpvVbUQ4E+suGDgDl5iSFA1FT\\r\\n9dW9kTIOMk6BmHoODgZBLGM8Yf1SloUjfXgZGytqUeldCsOkUSGwmJjna6miqJQm\\r\\nm0u2+zJf3vRoAql754XAoWQ2WAyVSeugrc1aNTnowFLmNfxX4QI4GFo1kPK6NjFv\\r\\nExABOKh2B3gLHNE/LhokyXTDCWmD9hVpfcDN0lpyZJslQ1m0lvhM9uPTEIVFZGyZ\\r\\nx5rpF/o9O9HHh3DFmbI2kbgGQ6NqIFISCi01FwIDAQABAoIBAB6qHU+lyaZdID7g\\r\\n1nJjP4nSAS9fppiORMOTCemGaUFKXJ7itgjCFTzIJLwE3oAfM2nTstjzJBcfzWXJ\\r\\nMZTvClpouK/Cyd91T6MOkbdoLSeAwkjTXmTPzoqlN+8tNjzUSAXeyqlGPFZKXsNb\\r\\nDsPg/kUAIBAPXbzj9KsnZnmj2jLa2HfRfBCNQnmyftYU/czi5o8G0mw8BfNk7BOa\\r\\nEjXZIe4FT4luMmDRZUIFR+mG8h5dhZuLIOOnK5OrGTvludSI7atuZUyy14v5B8MF\\r\\n4NbTZ7tS1xnAkqnXLCw0dwxu718J76IiF4S6WYoq93ZnzAHL+DFtHLpUIPR7+BTq\\r\\nkLQ+7uECgYEA8ewq0Fivo8WEDnGCf9byYe50VM2QYuBf5B2a9JbWanCLnn/OIuQA\\r\\nPb0i8kmVjtO8O0KaLzEdl5LXOvmZSqT6mAaCx6KNy0lSbb3jKx8LL/LoowOzl8oZ\\r\\nu3HFf5OqgrMQROhLCxj+stUoS3kgaNt2/7QJ1h8OtiMqRzto8HhJreECgYEAvJIC\\r\\nQjQwEUf6VBfQF5gO31ztqIyBS7YrtgH2/RALba6cY8XUrtJewT+iKmbW0cV49lo2\\r\\nY893vH7KurVFzhIlza4K0pDfz8qE5J5gn3zQxqjfOeKY7tBAamMqn+BTBrQ1sAAP\\r\\nCsDdMjhSODC8pHMcz5HXluJNtjfD4tk6Z+7akfcCgYEAmREufai/aMW+Kk1TnoNn\\r\\n1OLFJCr0YjtJMNIyivMtMyeGj4CZ8qWEKYwUImzAfiAmBvC7EYToDlFQcPYgMYR1\\r\\nMd9cu+d0A92ek+UDaPM5ZtswqoPbC/1JjroLlg7eYdfeQVsgsCLedFQ+LJK1GONT\\r\\nRbKqTppT+pYBWBSU7yGMrMECgYEAnF7PtKqmOY5gjZ95ljcoDh13js+E4I3eTX3v\\r\\nnQbTE086rJn+tkIJBWOJTHQfK7D/j/pbJAWFGzBhWNa9Xhc6dgcfPmGY1yzvas3S\\r\\n/i54ymR7R/saKt9Sq2Y0kINrFiIWay6BSr+ILf76X1I6/HvgplggWSSsoLA5pkHQ\\r\\n5yLw6R0CgYEAqbqZ1RaXzLAujoNyM8pPitR3E/jqLXO3tDCucAp25XSZdc3ny0JW\\r\\n+tVPfWfHg8dWt4GjJwkwTGdI93VBD7IQ/px2ZP2K52focRfwh0qsg2Mpy7hXtoIt\\r\\nZpRiZu8HGF3IsDqFVva3hSPEmWRjfmQUfGmkY+Lfw0Upe4Tn3v/gRqg=\\r\\n-----END RSA PRIVATE KEY-----\\r\\n"}	\N	\N	2025-11-22 01:30:34.834907	2025-11-22 01:30:34.835	x509:certificates
_analytics:events:3e17b50c0ea2923c12a789f58ed8b8c7c51892ea	"0ccc4f76-d7c3-4151-a9a1-f33c3056baae"	\N	\N	2025-11-22 01:30:34.841461	2025-11-22 01:30:34.842	_analytics:events
_analytics:events:2a2c16ca719e641cd5946275851eb8dc396658ca	"2025-11-22T01:30:35.174Z"	\N	\N	2025-11-19 14:54:05.05484	2025-11-22 01:30:35.176	_analytics:events
\.


--
-- Data for Name: jackson_ttl; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.jackson_ttl (key, "expiresAt") FROM stdin;
\.


--
-- Name: PasswordReset_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."PasswordReset_id_seq"', 1, false);


--
-- Name: jackson_index_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.jackson_index_id_seq', 1, false);


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: ApiKey ApiKey_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ApiKey"
    ADD CONSTRAINT "ApiKey_pkey" PRIMARY KEY (id);


--
-- Name: Invitation Invitation_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Invitation"
    ADD CONSTRAINT "Invitation_pkey" PRIMARY KEY (id);


--
-- Name: PasswordReset PasswordReset_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."PasswordReset"
    ADD CONSTRAINT "PasswordReset_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: Price Price_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Price"
    ADD CONSTRAINT "Price_pkey" PRIMARY KEY (id);


--
-- Name: Service Service_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Service"
    ADD CONSTRAINT "Service_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: SongRequest SongRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."SongRequest"
    ADD CONSTRAINT "SongRequest_pkey" PRIMARY KEY (id);


--
-- Name: Subscription Subscription_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_pkey" PRIMARY KEY (id);


--
-- Name: TeamMember TeamMember_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TeamMember"
    ADD CONSTRAINT "TeamMember_pkey" PRIMARY KEY (id);


--
-- Name: Team Team_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Team"
    ADD CONSTRAINT "Team_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Venue Venue_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Venue"
    ADD CONSTRAINT "Venue_pkey" PRIMARY KEY (id);


--
-- Name: jackson_index _jackson_index_id; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.jackson_index
    ADD CONSTRAINT _jackson_index_id PRIMARY KEY (id);


--
-- Name: jackson_store _jackson_store_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.jackson_store
    ADD CONSTRAINT _jackson_store_key PRIMARY KEY (key);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: jackson_ttl jackson_ttl_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.jackson_ttl
    ADD CONSTRAINT jackson_ttl_key PRIMARY KEY (key);


--
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public."Account" USING btree (provider, "providerAccountId");


--
-- Name: Account_userId_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Account_userId_idx" ON public."Account" USING btree ("userId");


--
-- Name: ApiKey_hashedKey_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "ApiKey_hashedKey_key" ON public."ApiKey" USING btree ("hashedKey");


--
-- Name: ApiKey_teamId_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "ApiKey_teamId_idx" ON public."ApiKey" USING btree ("teamId");


--
-- Name: Invitation_email_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Invitation_email_idx" ON public."Invitation" USING btree (email);


--
-- Name: Invitation_teamId_email_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Invitation_teamId_email_key" ON public."Invitation" USING btree ("teamId", email);


--
-- Name: Invitation_token_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Invitation_token_key" ON public."Invitation" USING btree (token);


--
-- Name: PasswordReset_token_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "PasswordReset_token_key" ON public."PasswordReset" USING btree (token);


--
-- Name: Payment_songRequestId_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Payment_songRequestId_key" ON public."Payment" USING btree ("songRequestId");


--
-- Name: Payment_status_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Payment_status_idx" ON public."Payment" USING btree (status);


--
-- Name: Payment_venueId_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Payment_venueId_idx" ON public."Payment" USING btree ("venueId");


--
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" USING btree ("sessionToken");


--
-- Name: Session_userId_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Session_userId_idx" ON public."Session" USING btree ("userId");


--
-- Name: SongRequest_status_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "SongRequest_status_idx" ON public."SongRequest" USING btree (status);


--
-- Name: SongRequest_venueId_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "SongRequest_venueId_idx" ON public."SongRequest" USING btree ("venueId");


--
-- Name: Subscription_customerId_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Subscription_customerId_idx" ON public."Subscription" USING btree ("customerId");


--
-- Name: TeamMember_teamId_userId_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON public."TeamMember" USING btree ("teamId", "userId");


--
-- Name: TeamMember_userId_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "TeamMember_userId_idx" ON public."TeamMember" USING btree ("userId");


--
-- Name: Team_billingId_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Team_billingId_idx" ON public."Team" USING btree ("billingId");


--
-- Name: Team_domain_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Team_domain_key" ON public."Team" USING btree (domain);


--
-- Name: Team_slug_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Team_slug_key" ON public."Team" USING btree (slug);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Venue_slug_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Venue_slug_key" ON public."Venue" USING btree (slug);


--
-- Name: Venue_teamId_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Venue_teamId_idx" ON public."Venue" USING btree ("teamId");


--
-- Name: VerificationToken_identifier_token_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON public."VerificationToken" USING btree (identifier, token);


--
-- Name: VerificationToken_token_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "VerificationToken_token_key" ON public."VerificationToken" USING btree (token);


--
-- Name: _jackson_index_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX _jackson_index_key ON public.jackson_index USING btree (key);


--
-- Name: _jackson_index_key_store; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX _jackson_index_key_store ON public.jackson_index USING btree (key, "storeKey");


--
-- Name: _jackson_store_namespace; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX _jackson_store_namespace ON public.jackson_store USING btree (namespace);


--
-- Name: _jackson_ttl_expires_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX _jackson_ttl_expires_at ON public.jackson_ttl USING btree ("expiresAt");


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ApiKey ApiKey_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ApiKey"
    ADD CONSTRAINT "ApiKey_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public."Team"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Invitation Invitation_invitedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Invitation"
    ADD CONSTRAINT "Invitation_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Invitation Invitation_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Invitation"
    ADD CONSTRAINT "Invitation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public."Team"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Payment Payment_songRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_songRequestId_fkey" FOREIGN KEY ("songRequestId") REFERENCES public."SongRequest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Payment Payment_venueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES public."Venue"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Price Price_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Price"
    ADD CONSTRAINT "Price_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public."Service"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SongRequest SongRequest_venueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."SongRequest"
    ADD CONSTRAINT "SongRequest_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES public."Venue"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeamMember TeamMember_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TeamMember"
    ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public."Team"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeamMember TeamMember_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TeamMember"
    ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Venue Venue_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Venue"
    ADD CONSTRAINT "Venue_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public."Team"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jackson_index jackson_index_storeKey_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.jackson_index
    ADD CONSTRAINT "jackson_index_storeKey_fkey" FOREIGN KEY ("storeKey") REFERENCES public.jackson_store(key) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: admin
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

