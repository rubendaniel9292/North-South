import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1719349434822 implements MigrationInterface {
    name = 'Init1719349434822'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "uq_user_email"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "uq_user_email" UNIQUE ("email", "user_name")`);
    }

}
