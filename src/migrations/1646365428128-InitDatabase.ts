import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitDatabase1646365428128 implements MigrationInterface {
  name = 'InitDatabase1646365428128'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "audio_metadata" ("id" uuid NOT NULL, "room_id" character varying, "user_id" uuid NOT NULL, "h5p_id" character varying NOT NULL, "h5p_sub_id" character varying, "description" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "mime_type" character varying NOT NULL, "base64_user_public_key" character varying NOT NULL, "base64_encrypted_symmetric_key" character varying NOT NULL, CONSTRAINT "PK_be3f57c90c68629bc8a599dfdf5" PRIMARY KEY ("id"))`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "audio_metadata"`)
  }
}
