-- CreateTable
CREATE TABLE "public"."example" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "status" BOOLEAN,

    CONSTRAINT "example_pkey" PRIMARY KEY ("id")
);
