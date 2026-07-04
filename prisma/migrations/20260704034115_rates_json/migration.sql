/*
  Warnings:

  - You are about to drop the column `rate` on the `ExchangeRateCache` table. All the data in the column will be lost.
  - You are about to drop the column `target` on the `ExchangeRateCache` table. All the data in the column will be lost.
  - Added the required column `ratesJson` to the `ExchangeRateCache` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ExchangeRateCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "base" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "ratesJson" TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ExchangeRateCache" ("base", "day", "fetchedAt", "id") SELECT "base", "day", "fetchedAt", "id" FROM "ExchangeRateCache";
DROP TABLE "ExchangeRateCache";
ALTER TABLE "new_ExchangeRateCache" RENAME TO "ExchangeRateCache";
CREATE UNIQUE INDEX "ExchangeRateCache_base_day_key" ON "ExchangeRateCache"("base", "day");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
