/*
  Warnings:

  - You are about to drop the column `applicableTo` on the `Stereotype` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Stereotype" DROP COLUMN "applicableTo";

-- CreateTable
CREATE TABLE "StereotypeConceptType" (
    "id" TEXT NOT NULL,
    "stereotypeId" TEXT NOT NULL,
    "conceptTypeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StereotypeConceptType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StereotypeRelationType" (
    "id" TEXT NOT NULL,
    "stereotypeId" TEXT NOT NULL,
    "relationTypeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StereotypeRelationType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StereotypeConceptType_stereotypeId_conceptTypeId_key" ON "StereotypeConceptType"("stereotypeId", "conceptTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "StereotypeRelationType_stereotypeId_relationTypeId_key" ON "StereotypeRelationType"("stereotypeId", "relationTypeId");

-- AddForeignKey
ALTER TABLE "StereotypeConceptType" ADD CONSTRAINT "StereotypeConceptType_stereotypeId_fkey" FOREIGN KEY ("stereotypeId") REFERENCES "Stereotype"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StereotypeConceptType" ADD CONSTRAINT "StereotypeConceptType_conceptTypeId_fkey" FOREIGN KEY ("conceptTypeId") REFERENCES "ConceptType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StereotypeRelationType" ADD CONSTRAINT "StereotypeRelationType_stereotypeId_fkey" FOREIGN KEY ("stereotypeId") REFERENCES "Stereotype"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StereotypeRelationType" ADD CONSTRAINT "StereotypeRelationType_relationTypeId_fkey" FOREIGN KEY ("relationTypeId") REFERENCES "RelationType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
