-- CreateTable
CREATE TABLE "WarRecord" (
    "id" TEXT NOT NULL,
    "clanId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "finished" BOOLEAN NOT NULL,
    "rosterKnown" BOOLEAN NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "opponentTag" TEXT NOT NULL,
    "opponentName" TEXT NOT NULL,
    "teamSize" INTEGER NOT NULL,
    "attacksPerMember" INTEGER,
    "season" TEXT,
    "round" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarParticipation" (
    "id" TEXT NOT NULL,
    "warId" TEXT NOT NULL,
    "playerTag" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "townHall" INTEGER NOT NULL,
    "attacks" JSONB NOT NULL,

    CONSTRAINT "WarParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WarRecord_clanId_endTime_idx" ON "WarRecord"("clanId", "endTime");

-- CreateIndex
CREATE UNIQUE INDEX "WarRecord_clanId_kind_endTime_opponentTag_key" ON "WarRecord"("clanId", "kind", "endTime", "opponentTag");

-- CreateIndex
CREATE UNIQUE INDEX "WarParticipation_warId_playerTag_key" ON "WarParticipation"("warId", "playerTag");

-- AddForeignKey
ALTER TABLE "WarRecord" ADD CONSTRAINT "WarRecord_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "Clan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarParticipation" ADD CONSTRAINT "WarParticipation_warId_fkey" FOREIGN KEY ("warId") REFERENCES "WarRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
