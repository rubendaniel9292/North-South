import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1723823298168 implements MigrationInterface {
    name = 'Init1723823298168'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "civil_status" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "status" character varying NOT NULL, CONSTRAINT "UQ_819697ca204c6033841e45383ff" UNIQUE ("status"), CONSTRAINT "PK_d76e30bdedf3bbfb853e7cd1406" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "customers" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "ci_ruc" character varying NOT NULL, "first_name" character varying NOT NULL, "second_name" character varying, "surname" character varying NOT NULL, "second_surname" character varying, "birthdate" TIMESTAMP NOT NULL, "email" character varying NOT NULL, "phone_number" character varying NOT NULL, "address" character varying NOT NULL, "personal_data" boolean NOT NULL, "status_id" bigint, "province_id" bigint, "city_id" bigint, CONSTRAINT "UQ_f5eb15adcff0883c4fa27046a39" UNIQUE ("ci_ruc"), CONSTRAINT "UQ_8536b8b85c06969f84f0c098b03" UNIQUE ("email"), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "city" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "city_name" character varying NOT NULL, "province_id" bigint, CONSTRAINT "PK_b222f51ce26f7e5ca86944a6739" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "province" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "province_name" character varying NOT NULL, CONSTRAINT "PK_4f461cb46f57e806516b7073659" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "first_name" character varying NOT NULL, "second_name" character varying, "surname" character varying NOT NULL, "second_surname" character varying, "user_name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL, CONSTRAINT "UQ_074a1f262efaca6aba16f7ed920" UNIQUE ("user_name"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_951b8f1dfc94ac1d0301a14b7e1" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_9d666fe1125d410ff9d110e2d2e" FOREIGN KEY ("status_id") REFERENCES "civil_status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_ddf27769e29b0c4a0354bb5aaa7" FOREIGN KEY ("province_id") REFERENCES "province"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_41c12896f1dca3dbab30b32119f" FOREIGN KEY ("city_id") REFERENCES "city"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "city" ADD CONSTRAINT "FK_efa45f1f32db90d7c6554a353ed" FOREIGN KEY ("province_id") REFERENCES "province"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "city" DROP CONSTRAINT "FK_efa45f1f32db90d7c6554a353ed"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_41c12896f1dca3dbab30b32119f"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_ddf27769e29b0c4a0354bb5aaa7"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_9d666fe1125d410ff9d110e2d2e"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "province"`);
        await queryRunner.query(`DROP TABLE "city"`);
        await queryRunner.query(`DROP TABLE "customers"`);
        await queryRunner.query(`DROP TABLE "civil_status"`);
    }

}
