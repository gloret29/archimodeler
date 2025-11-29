-- CreateTable
CREATE TABLE "Stereotype" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "applicableTo" TEXT NOT NULL DEFAULT 'both',
    "propertiesSchema" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stereotype_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElementStereotype" (
    "id" TEXT NOT NULL,
    "elementId" TEXT NOT NULL,
    "stereotypeId" TEXT NOT NULL,
    "extendedProperties" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElementStereotype_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationshipStereotype" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "stereotypeId" TEXT NOT NULL,
    "extendedProperties" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelationshipStereotype_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Stereotype_name_key" ON "Stereotype"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ElementStereotype_elementId_stereotypeId_key" ON "ElementStereotype"("elementId", "stereotypeId");

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipStereotype_relationshipId_stereotypeId_key" ON "RelationshipStereotype"("relationshipId", "stereotypeId");

-- AddForeignKey
ALTER TABLE "ElementStereotype" ADD CONSTRAINT "ElementStereotype_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "Element"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElementStereotype" ADD CONSTRAINT "ElementStereotype_stereotypeId_fkey" FOREIGN KEY ("stereotypeId") REFERENCES "Stereotype"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipStereotype" ADD CONSTRAINT "RelationshipStereotype_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipStereotype" ADD CONSTRAINT "RelationshipStereotype_stereotypeId_fkey" FOREIGN KEY ("stereotypeId") REFERENCES "Stereotype"("id") ON DELETE CASCADE ON UPDATE CASCADE;
