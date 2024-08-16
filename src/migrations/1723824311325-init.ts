import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1723824311325 implements MigrationInterface {
    name = 'Init1723824311325'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_ddf27769e29b0c4a0354bb5aaa7"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_41c12896f1dca3dbab30b32119f"`);
        await queryRunner.query(`ALTER TABLE "city" DROP CONSTRAINT "FK_efa45f1f32db90d7c6554a353ed"`);
        await queryRunner.query(`ALTER TABLE "customers" RENAME COLUMN "phone_number" TO "number_phone"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_ddf27769e29b0c4a0354bb5aaa7" FOREIGN KEY ("province_id") REFERENCES "province"("id") ON DELETE NO ACTION ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_41c12896f1dca3dbab30b32119f" FOREIGN KEY ("city_id") REFERENCES "city"("id") ON DELETE NO ACTION ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "city" ADD CONSTRAINT "FK_efa45f1f32db90d7c6554a353ed" FOREIGN KEY ("province_id") REFERENCES "province"("id") ON DELETE NO ACTION ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "city" DROP CONSTRAINT "FK_efa45f1f32db90d7c6554a353ed"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_41c12896f1dca3dbab30b32119f"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_ddf27769e29b0c4a0354bb5aaa7"`);
        await queryRunner.query(`ALTER TABLE "customers" RENAME COLUMN "number_phone" TO "phone_number"`);
        await queryRunner.query(`ALTER TABLE "city" ADD CONSTRAINT "FK_efa45f1f32db90d7c6554a353ed" FOREIGN KEY ("province_id") REFERENCES "province"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_41c12896f1dca3dbab30b32119f" FOREIGN KEY ("city_id") REFERENCES "city"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_ddf27769e29b0c4a0354bb5aaa7" FOREIGN KEY ("province_id") REFERENCES "province"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
