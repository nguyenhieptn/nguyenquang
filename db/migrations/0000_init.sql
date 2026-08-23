CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"issuer" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"username" text,
	"display_username" text,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assertion" (
	"id" uuid PRIMARY KEY NOT NULL,
	"clan_id" uuid NOT NULL,
	"subject_person_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"object_person_id" uuid,
	"union_id" uuid,
	"value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_id" uuid NOT NULL,
	"confidence" text DEFAULT 'ton-nghi' NOT NULL,
	"tier" text DEFAULT 'tentative' NOT NULL,
	"status" text DEFAULT 'live' NOT NULL,
	"created_by_account_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"promoted_at" timestamp with time zone,
	"promoted_by_account_id" text
);
--> statement-breakpoint
CREATE TABLE "attachment" (
	"id" uuid PRIMARY KEY NOT NULL,
	"clan_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"person_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"vouched_by_attachment_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clan" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merge_proposal" (
	"id" uuid PRIMARY KEY NOT NULL,
	"clan_id" uuid NOT NULL,
	"winner_person_id" uuid NOT NULL,
	"loser_person_id" uuid NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"proposed_by_account_id" text NOT NULL,
	"decided_by_account_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY NOT NULL,
	"clan_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"seen_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "person" (
	"id" uuid PRIMARY KEY NOT NULL,
	"clan_id" uuid NOT NULL,
	"merged_into" uuid,
	"full_name" text DEFAULT '' NOT NULL,
	"name_folded" text DEFAULT '' NOT NULL,
	"name_tier" text,
	"name_confidence" text,
	"gender" text,
	"gender_tier" text,
	"birth_date" date,
	"birth_precision" text,
	"birth_tier" text,
	"death_date" date,
	"death_precision" text,
	"death_tier" text,
	"is_living" boolean DEFAULT true NOT NULL,
	"hidden_from_public" boolean DEFAULT false NOT NULL,
	"refuse_print" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recording" (
	"id" uuid PRIMARY KEY NOT NULL,
	"clan_id" uuid NOT NULL,
	"told_by_person_id" uuid,
	"recorded_by_account_id" text NOT NULL,
	"recorded_on" date NOT NULL,
	"duration_seconds" integer,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"access_tier" text DEFAULT 'admin' NOT NULL,
	"sealed_until" date,
	"withdrawn_at" timestamp with time zone,
	"title" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recording_subject" (
	"id" uuid PRIMARY KEY NOT NULL,
	"clan_id" uuid NOT NULL,
	"recording_id" uuid NOT NULL,
	"person_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revision" (
	"id" uuid PRIMARY KEY NOT NULL,
	"clan_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source" (
	"id" uuid PRIMARY KEY NOT NULL,
	"clan_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"told_by_person_id" uuid,
	"recording_id" uuid,
	"created_by_account_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "union" (
	"id" uuid PRIMARY KEY NOT NULL,
	"clan_id" uuid NOT NULL,
	"kind" text DEFAULT 'marriage' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assertion" ADD CONSTRAINT "assertion_clan_id_clan_id_fk" FOREIGN KEY ("clan_id") REFERENCES "public"."clan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assertion" ADD CONSTRAINT "assertion_subject_person_id_person_id_fk" FOREIGN KEY ("subject_person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assertion" ADD CONSTRAINT "assertion_object_person_id_person_id_fk" FOREIGN KEY ("object_person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assertion" ADD CONSTRAINT "assertion_union_id_union_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."union"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assertion" ADD CONSTRAINT "assertion_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_clan_id_clan_id_fk" FOREIGN KEY ("clan_id") REFERENCES "public"."clan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merge_proposal" ADD CONSTRAINT "merge_proposal_clan_id_clan_id_fk" FOREIGN KEY ("clan_id") REFERENCES "public"."clan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merge_proposal" ADD CONSTRAINT "merge_proposal_winner_person_id_person_id_fk" FOREIGN KEY ("winner_person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merge_proposal" ADD CONSTRAINT "merge_proposal_loser_person_id_person_id_fk" FOREIGN KEY ("loser_person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_clan_id_clan_id_fk" FOREIGN KEY ("clan_id") REFERENCES "public"."clan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person" ADD CONSTRAINT "person_clan_id_clan_id_fk" FOREIGN KEY ("clan_id") REFERENCES "public"."clan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recording" ADD CONSTRAINT "recording_clan_id_clan_id_fk" FOREIGN KEY ("clan_id") REFERENCES "public"."clan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recording" ADD CONSTRAINT "recording_told_by_person_id_person_id_fk" FOREIGN KEY ("told_by_person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recording_subject" ADD CONSTRAINT "recording_subject_clan_id_clan_id_fk" FOREIGN KEY ("clan_id") REFERENCES "public"."clan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recording_subject" ADD CONSTRAINT "recording_subject_recording_id_recording_id_fk" FOREIGN KEY ("recording_id") REFERENCES "public"."recording"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recording_subject" ADD CONSTRAINT "recording_subject_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revision" ADD CONSTRAINT "revision_clan_id_clan_id_fk" FOREIGN KEY ("clan_id") REFERENCES "public"."clan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source" ADD CONSTRAINT "source_clan_id_clan_id_fk" FOREIGN KEY ("clan_id") REFERENCES "public"."clan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source" ADD CONSTRAINT "source_told_by_person_id_person_id_fk" FOREIGN KEY ("told_by_person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "union" ADD CONSTRAINT "union_clan_id_clan_id_fk" FOREIGN KEY ("clan_id") REFERENCES "public"."clan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "assertion_clan_idx" ON "assertion" USING btree ("clan_id");--> statement-breakpoint
CREATE INDEX "assertion_subject_idx" ON "assertion" USING btree ("subject_person_id","kind");--> statement-breakpoint
CREATE INDEX "assertion_object_idx" ON "assertion" USING btree ("object_person_id");--> statement-breakpoint
CREATE INDEX "assertion_union_idx" ON "assertion" USING btree ("union_id");--> statement-breakpoint
CREATE UNIQUE INDEX "attachment_account_clan_uq" ON "attachment" USING btree ("clan_id","account_id");--> statement-breakpoint
CREATE INDEX "attachment_person_idx" ON "attachment" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "merge_proposal_clan_status_idx" ON "merge_proposal" USING btree ("clan_id","status");--> statement-breakpoint
CREATE INDEX "notification_person_idx" ON "notification" USING btree ("person_id","seen_at");--> statement-breakpoint
CREATE INDEX "person_clan_idx" ON "person" USING btree ("clan_id");--> statement-breakpoint
CREATE INDEX "person_name_folded_idx" ON "person" USING btree ("clan_id","name_folded");--> statement-breakpoint
CREATE INDEX "person_merged_into_idx" ON "person" USING btree ("merged_into");--> statement-breakpoint
CREATE INDEX "recording_clan_idx" ON "recording" USING btree ("clan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recording_subject_uq" ON "recording_subject" USING btree ("recording_id","person_id");--> statement-breakpoint
CREATE INDEX "recording_subject_person_idx" ON "recording_subject" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "revision_clan_time_idx" ON "revision" USING btree ("clan_id","created_at");--> statement-breakpoint
CREATE INDEX "revision_entity_idx" ON "revision" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "source_clan_idx" ON "source" USING btree ("clan_id");--> statement-breakpoint
CREATE INDEX "union_clan_idx" ON "union" USING btree ("clan_id");