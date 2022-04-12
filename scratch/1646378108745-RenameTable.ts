import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { MigrationInterface, QueryRunner } from 'typeorm'

const logger = withLogger('RenameTable1646378108745')

export class RenameTable1646378108745 implements MigrationInterface {
  name = 'RenameTable1646378108745'

  public async up(queryRunner: QueryRunner): Promise<void> {
    const audioMetadataTableExists =
      (
        await queryRunner.query(
          "SELECT datname FROM pg_catalog.pg_database WHERE datname = 'audio_metadata';",
        )
      ).length > 0
    if (!audioMetadataTableExists) {
      logger.debug('audio_metadata table does not exist. Skipping migration...')
      return
    }
    const mediaMetadataTableExists =
      (
        await queryRunner.query(
          "SELECT datname FROM pg_catalog.pg_database WHERE datname = 'media_metadata';",
        )
      ).length > 0
    if (mediaMetadataTableExists) {
      logger.debug('media_metadata table already exists. Skipping migration...')
      return
    }
    await queryRunner.query(
      `ALTER TABLE audio_metadata RENAME TO media_metadata`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "media_metadata"`)
  }
}
