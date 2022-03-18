import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitDatabase1646365428128 implements MigrationInterface {
  name = 'InitDatabase1646365428128'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "media_metadata" ("id" uuid NOT NULL, "room_id" character varying, "user_id" uuid NOT NULL, "h5p_id" character varying NOT NULL, "h5p_sub_id" character varying, "mime_type" character varying NOT NULL, "description" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "base64_user_public_key" character varying NOT NULL, "base64_encrypted_symmetric_key" character varying NOT NULL, CONSTRAINT "PK_6c52273ad7331542bbce7ae4da1" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ceeabe7fbd70e418d60777be39" ON "media_metadata" ("room_id") `,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ceeabe7fbd70e418d60777be39"`,
    )
    await queryRunner.query(`DROP TABLE "media_metadata"`)
  }
}
