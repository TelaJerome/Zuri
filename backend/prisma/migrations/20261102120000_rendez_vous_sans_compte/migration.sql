-- AlterTable : rendez-vous possibles sans compte cliente
ALTER TABLE "Appointment" ADD COLUMN     "guestEmail" TEXT,
ADD COLUMN     "guestName" TEXT,
ADD COLUMN     "guestPhone" TEXT,
ALTER COLUMN "clientId" DROP NOT NULL;
